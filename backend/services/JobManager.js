const { v4: uuidv4 } = require('uuid');
const Bull = require('bull');
const redis = require('redis');
const EventEmitter = require('events');
const logger = require('../utils/logger');
const MetricsCollector = require('./MetricsCollector');

class JobManager extends EventEmitter {
    constructor() {
        super();
        this.jobs = new Map();
        this.jobHistory = new Map();
        this.auditLogs = [];
        this.queues = new Map();
        this.redisClient = null;
        this.isRedisAvailable = false;
        
        // Initialize metrics collector
        this.metricsCollector = new MetricsCollector();
        this.setupMetricsIntegration();
        
        this.initializeRedis();
        this.setupCleanupInterval();
        this.initializeSampleJobs();
        
        // Delay queue setup to allow Redis connection to be established
        setTimeout(() => {
            if (this.isRedisAvailable) {
                try {
                    this.setupQueues();
                } catch (error) {
                    logger.error('Failed to setup Bull queues:', error.message);
                    logger.info('Continuing with in-memory job processing');
                    this.isRedisAvailable = false;
                }
            } else {
                logger.info('Redis not available, using in-memory job processing only');
            }
        }, 2000);
    }

    async initializeRedis() {
        try {
            const redisConfig = {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3
            };

            // Add password if specified
            if (process.env.REDIS_PASSWORD) {
                redisConfig.password = process.env.REDIS_PASSWORD;
            }

            this.redisClient = redis.createClient(redisConfig);

            this.redisClient.on('connect', () => {
                logger.info('Redis connected for job management');
                this.isRedisAvailable = true;
            });

            this.redisClient.on('error', (err) => {
                logger.warn('Redis connection failed, using in-memory storage:', err.message);
                this.isRedisAvailable = false;
            });

            await this.redisClient.connect().catch(() => {
                this.isRedisAvailable = false;
            });
        } catch (error) {
            logger.warn('Redis initialization failed, using in-memory storage:', error.message);
            this.isRedisAvailable = false;
        }
    }

    setupQueues() {
        // Skip Bull queue setup if Redis is not available
        if (!this.isRedisAvailable) {
            logger.warn('Redis not available, skipping Bull queue setup. Using in-memory job processing.');
            return;
        }

        const queueTypes = [
            'identity_matching',
            'data_validation', 
            'data_quality',
            'deduplication',
            'household_detection',
            'bulk_export'
        ];

        logger.info(`Setting up Bull queues with Redis connection...`);
        
        queueTypes.forEach(queueType => {
            try {
                // Use Redis configuration for Bull queues without authentication
                const redisConfig = {
                    port: process.env.REDIS_PORT || 6379,
                    host: process.env.REDIS_HOST || 'localhost',
                    maxRetriesPerRequest: 3,
                    retryDelayOnFailover: 100,
                    lazyConnect: true
                };
                
                // Skip password for Bull queues to avoid NOAUTH errors
                logger.info(`Creating Bull queue: ${queueType} without authentication`);

                // Create Bull queue with improved error handling
                const queue = new Bull(queueType, {
                    redis: redisConfig,
                    defaultJobOptions: {
                        removeOnComplete: 50,
                        removeOnFail: 20,
                        attempts: 3,
                        backoff: {
                            type: 'exponential',
                            delay: 2000
                        }
                    },
                    settings: {
                        stalledInterval: 30 * 1000,
                        maxStalledCount: 1
                    }
                });

                queue.process(async (job) => {
                    return await this.processJob(job);
                });

                queue.on('completed', (job, result) => {
                    this.handleJobCompleted(job, result);
                });

                queue.on('failed', (job, err) => {
                    this.handleJobFailed(job, err);
                });

                queue.on('progress', (job, progress) => {
                    this.handleJobProgress(job, progress);
                });

                // Add error handling for Bull queue connection issues
                queue.on('error', (error) => {
                    logger.warn(`Bull queue ${queueType} error:`, error.message);
                });

                queue.on('waiting', (jobId) => {
                    logger.debug(`Job ${jobId} waiting in queue ${queueType}`);
                });

                this.queues.set(queueType, queue);
            } catch (error) {
                logger.warn(`Failed to setup queue ${queueType}:`, error.message);
            }
        });
    }

    async createJob(jobData) {
        const jobId = uuidv4();
        const now = new Date().toISOString();
        
        const job = {
            job_id: jobId,
            name: jobData.name,
            job_type: jobData.job_type,
            status: 'queued',
            priority: jobData.priority || 'normal',
            created_by: jobData.created_by || 'system',
            created_at: now,
            started_at: null,
            completed_at: null,
            estimated_completion: null,
            progress: 0,
            total_records: 0,
            processed_records: 0,
            successful_records: 0,
            failed_records: 0,
            input_data: jobData.input_data,
            config: jobData.config || {},
            output_config: jobData.output_config || {},
            error_message: null,
            audit_trail: [],
            insights: {
                processing_time: 0,
                throughput: 0,
                quality_score: 0,
                match_rate: 0,
                error_rate: 0
            }
        };

        // Store job
        this.jobs.set(jobId, job);
        
        // Log audit event
        this.logAuditEvent(jobId, 'JOB_CREATED', {
            created_by: job.created_by,
            job_type: job.job_type,
            priority: job.priority
        });

        // Add to queue
        try {
            const queue = this.queues.get(jobData.job_type);
            if (queue) {
                await queue.add('process', { jobId, jobData: job }, {
                    priority: this.getPriorityValue(job.priority),
                    delay: 0
                });
                
                this.logAuditEvent(jobId, 'JOB_QUEUED', {
                    queue: jobData.job_type
                });
            } else {
                // Fallback to direct processing if queue not available
                setTimeout(() => this.processJobDirect(jobId), 100);
            }
        } catch (error) {
            logger.error(`Failed to queue job ${jobId}:`, error);
            // Fallback to direct processing
            setTimeout(() => this.processJobDirect(jobId), 100);
        }

        // Emit job created event
        this.emit('jobCreated', job);
        
        logger.info(`Job created: ${jobId} (${job.job_type})`);
        return { job_id: jobId, status: 'success' };
    }

    async processJob(bullJob) {
        const { jobId } = bullJob.data;
        return await this.processJobDirect(jobId, bullJob);
    }

    async processJobDirect(jobId, bullJob = null) {
        const job = this.jobs.get(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        try {
            // Update job status
            job.status = 'running';
            job.started_at = new Date().toISOString();
            
            // Estimate completion time based on data size and job type
            const estimatedDuration = this.estimateProcessingTime(job);
            job.estimated_completion = new Date(Date.now() + estimatedDuration).toISOString();
            
            // Determine total records
            job.total_records = Array.isArray(job.input_data) ? 
                job.input_data.length : 
                (job.input_data?.length || 1000 + Math.floor(Math.random() * 5000));

            this.logAuditEvent(jobId, 'JOB_STARTED', {
                total_records: job.total_records,
                estimated_duration: estimatedDuration
            });

            this.emit('jobStarted', job);

            // Simulate processing with realistic progress
            await this.simulateJobProcessing(job, bullJob);

            // Complete job
            job.status = 'completed';
            job.completed_at = new Date().toISOString();
            job.progress = 100;
            job.processed_records = job.total_records;
            job.successful_records = Math.floor(job.total_records * (0.85 + Math.random() * 0.1));
            job.failed_records = job.total_records - job.successful_records;

            // Calculate insights
            this.calculateJobInsights(job);

            this.logAuditEvent(jobId, 'JOB_COMPLETED', {
                processing_time: job.insights.processing_time,
                success_rate: (job.successful_records / job.total_records * 100).toFixed(2) + '%'
            });

            this.emit('jobCompleted', job);
            logger.info(`Job completed: ${jobId}`);

            return { success: true, jobId, results: job.insights };

        } catch (error) {
            // Handle job failure
            job.status = 'failed';
            job.completed_at = new Date().toISOString();
            job.error_message = error.message;

            this.logAuditEvent(jobId, 'JOB_FAILED', {
                error: error.message,
                stack: error.stack
            });

            this.emit('jobFailed', job, error);
            logger.error(`Job failed: ${jobId}`, error);

            throw error;
        }
    }

    async simulateJobProcessing(job, bullJob = null) {
        const totalSteps = 20; // Process in 20 steps
        const stepDelay = Math.max(500, Math.floor(job.total_records / 10)); // Adjust based on data size
        
        for (let step = 1; step <= totalSteps; step++) {
            // Calculate progress
            const progress = Math.floor((step / totalSteps) * 100);
            job.progress = progress;
            job.processed_records = Math.floor((progress / 100) * job.total_records);
            
            // Update Bull job progress if available
            if (bullJob) {
                await bullJob.progress(progress);
            }

            // Log significant progress milestones
            if (progress % 25 === 0) {
                this.logAuditEvent(job.job_id, 'PROGRESS_UPDATE', {
                    progress: progress,
                    processed_records: job.processed_records,
                    step: step
                });
            }

            // Emit progress event
            this.emit('jobProgress', job, progress);

            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, stepDelay));

            // Random chance of error (very low)
            if (Math.random() < 0.001) { // 0.1% chance
                throw new Error('Simulated processing error');
            }
        }
    }

    estimateProcessingTime(job) {
        const baseTime = {
            'identity_matching': 60000,  // 1 minute base
            'data_validation': 30000,   // 30 seconds base
            'data_quality': 45000,      // 45 seconds base
            'deduplication': 90000,     // 1.5 minutes base
            'household_detection': 75000, // 1.25 minutes base
            'bulk_export': 20000        // 20 seconds base
        };

        const base = baseTime[job.job_type] || 60000;
        const recordMultiplier = Math.max(1, Math.floor(job.total_records / 1000));
        
        return base * recordMultiplier * (0.8 + Math.random() * 0.4); // ±20% variance
    }

    calculateJobInsights(job) {
        const processingTime = new Date(job.completed_at) - new Date(job.started_at);
        job.insights.processing_time = processingTime;
        job.insights.throughput = job.total_records / (processingTime / 1000); // records per second
        job.insights.quality_score = 75 + Math.random() * 20; // 75-95%
        job.insights.match_rate = job.successful_records / job.total_records * 100;
        job.insights.error_rate = job.failed_records / job.total_records * 100;
    }

    getPriorityValue(priority) {
        const priorities = {
            'urgent': 10,
            'high': 5,
            'normal': 0,
            'low': -5
        };
        return priorities[priority] || 0;
    }

    logAuditEvent(jobId, event, metadata = {}) {
        const auditEntry = {
            id: uuidv4(),
            job_id: jobId,
            event,
            timestamp: new Date().toISOString(),
            metadata,
            user: metadata.user || 'system'
        };

        this.auditLogs.push(auditEntry);
        
        // Keep only last 10000 audit logs to prevent memory issues
        if (this.auditLogs.length > 10000) {
            this.auditLogs = this.auditLogs.slice(-5000);
        }

        const job = this.jobs.get(jobId);
        if (job) {
            job.audit_trail.push(auditEntry);
        }

        this.emit('auditEvent', auditEntry);
        logger.info(`Audit: ${event} for job ${jobId}`, metadata);
    }

    addAuditLog(logData) {
        const auditEntry = {
            id: uuidv4(),
            job_id: logData.job_id,
            action_type: logData.action_type,
            action_details: logData.action_details,
            user_id: logData.user_id,
            timestamp: logData.timestamp || new Date().toISOString()
        };

        this.auditLogs.push(auditEntry);
        
        // Keep only last 10000 audit logs to prevent memory issues
        if (this.auditLogs.length > 10000) {
            this.auditLogs = this.auditLogs.slice(-5000);
        }

        // Emit audit event for WebSocket notifications
        this.emit('auditEvent', auditEntry);
    }

    handleJobCompleted(bullJob, result) {
        const jobId = bullJob.data.jobId;
        logger.info(`Bull job completed: ${jobId}`);
    }

    handleJobFailed(bullJob, error) {
        const jobId = bullJob.data.jobId;
        logger.error(`Bull job failed: ${jobId}`, error);
    }

    handleJobProgress(bullJob, progress) {
        const jobId = bullJob.data.jobId;
        const job = this.jobs.get(jobId);
        if (job) {
            job.progress = progress;
            this.emit('jobProgress', job, progress);
        }
    }

    // Public API methods
    async getJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            return { status: 'error', message: 'Job not found' };
        }
        return { status: 'success', job };
    }

    async getJobs(filters = {}) {
        let jobs = Array.from(this.jobs.values());

        // Apply filters
        if (filters.status_filter) {
            jobs = jobs.filter(job => job.status === filters.status_filter);
        }

        if (filters.job_type) {
            jobs = jobs.filter(job => job.job_type === filters.job_type);
        }

        if (filters.created_by) {
            jobs = jobs.filter(job => job.created_by === filters.created_by);
        }

        // Sort by creation time (newest first)
        jobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Apply pagination
        const limit = parseInt(filters.limit) || 50;
        const offset = parseInt(filters.offset) || 0;
        const paginatedJobs = jobs.slice(offset, offset + limit);

        return {
            status: 'success',
            jobs: paginatedJobs,
            total: jobs.length,
            limit,
            offset
        };
    }

    async cancelJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            return { status: 'error', message: 'Job not found' };
        }

        if (job.status === 'completed' || job.status === 'failed') {
            return { status: 'error', message: 'Cannot cancel completed or failed job' };
        }

        job.status = 'cancelled';
        job.completed_at = new Date().toISOString();

        this.logAuditEvent(jobId, 'JOB_CANCELLED', {
            cancelled_by: 'user'
        });

        this.emit('jobCancelled', job);
        return { status: 'success', message: 'Job cancelled' };
    }

    async pauseJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            return { status: 'error', message: 'Job not found' };
        }

        if (job.status !== 'running' && job.status !== 'queued') {
            return { status: 'error', message: 'Can only pause running or queued jobs' };
        }

        job.status = 'paused';
        this.logAuditEvent(jobId, 'JOB_PAUSED');
        this.emit('jobPaused', job);
        
        return { status: 'success', message: 'Job paused' };
    }

    async resumeJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            return { status: 'error', message: 'Job not found' };
        }

        if (job.status !== 'paused') {
            return { status: 'error', message: 'Can only resume paused jobs' };
        }

        job.status = 'running';
        this.logAuditEvent(jobId, 'JOB_RESUMED');
        this.emit('jobResumed', job);
        
        return { status: 'success', message: 'Job resumed' };
    }

    async getJobResults(jobId, filters = {}) {
        const job = this.jobs.get(jobId);
        if (!job) {
            return { status: 'error', message: 'Job not found' };
        }

        // Mock results based on job type
        const results = this.generateMockResults(job, filters);
        
        return {
            status: 'success',
            job_id: jobId,
            total_records: job.total_records,
            processed_records: job.processed_records,
            results: results
        };
    }

    generateMockResults(job, filters) {
        const results = [];
        const limit = parseInt(filters.limit) || 100;
        
        for (let i = 0; i < Math.min(limit, job.processed_records); i++) {
            results.push({
                record_id: uuidv4(),
                status: Math.random() > 0.1 ? 'success' : 'failed',
                confidence_score: Math.random(),
                matched_records: Math.floor(Math.random() * 3),
                processing_time: Math.floor(Math.random() * 1000),
                metadata: {
                    algorithm_used: 'hybrid',
                    quality_flags: []
                }
            });
        }
        
        return results;
    }

    async getQueueStatistics() {
        const stats = {
            total_jobs: this.jobs.size,
            queued_jobs: 0,
            running_jobs: 0,
            completed_jobs: 0,
            failed_jobs: 0,
            cancelled_jobs: 0,
            paused_jobs: 0,
            queue_details: {}
        };

        // Count job statuses
        for (const job of this.jobs.values()) {
            stats[`${job.status}_jobs`]++;
        }

        // Get queue details
        for (const [queueName, queue] of this.queues) {
            try {
                const [waiting, active, completed, failed] = await Promise.all([
                    queue.getWaiting(),
                    queue.getActive(), 
                    queue.getCompleted(),
                    queue.getFailed()
                ]);

                stats.queue_details[queueName] = {
                    waiting: waiting.length,
                    active: active.length,
                    completed: completed.length,
                    failed: failed.length
                };
            } catch (error) {
                stats.queue_details[queueName] = {
                    waiting: 0,
                    active: 0,
                    completed: 0,
                    failed: 0,
                    error: 'Queue unavailable'
                };
            }
        }

        return { status: 'success', statistics: stats };
    }

    async exportJobResults(jobId, format = 'csv') {
        try {
            logger.info(`Exporting results for job ${jobId} in ${format} format`);

            const job = this.jobs.get(jobId);
            if (!job) {
                throw new Error(`Job ${jobId} not found`);
            }

            if (job.status !== 'completed') {
                throw new Error(`Job ${jobId} is not completed yet. Current status: ${job.status}`);
            }

            // Generate export data based on job results
            const results = await this.getJobResults(jobId, { page: 1, limit: 1000000 }); // Get all results
            
            let exportData;
            let contentType;
            let fileExtension;

            switch (format.toLowerCase()) {
                case 'csv':
                    exportData = this.generateCSVExport(results);
                    contentType = 'text/csv';
                    fileExtension = 'csv';
                    break;
                case 'json':
                    exportData = JSON.stringify(results, null, 2);
                    contentType = 'application/json';
                    fileExtension = 'json';
                    break;
                case 'xlsx':
                    // For now, fallback to CSV for XLSX (can be enhanced later)
                    exportData = this.generateCSVExport(results);
                    contentType = 'text/csv';
                    fileExtension = 'csv';
                    logger.warn('XLSX export not fully implemented, falling back to CSV');
                    break;
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }

            // Create audit log entry
            this.addAuditLog({
                job_id: jobId,
                action_type: 'EXPORT',
                action_details: `Exported job results in ${format} format`,
                user_id: job.created_by,
                timestamp: new Date().toISOString()
            });

            return {
                status: 'success',
                message: 'Export completed successfully',
                job_id: jobId,
                format: format,
                data: exportData,
                content_type: contentType,
                file_extension: fileExtension,
                record_count: results.length,
                generated_at: new Date().toISOString()
            };

        } catch (error) {
            logger.error(`Error exporting job results for ${jobId}:`, error);
            throw error;
        }
    }

    generateCSVExport(results) {
        if (!results || results.length === 0) {
            return 'No results available\n';
        }

        // Extract headers from first result
        const headers = Object.keys(results[0]);
        let csv = headers.join(',') + '\n';

        // Add data rows
        for (const result of results) {
            const row = headers.map(header => {
                let value = result[header];
                if (typeof value === 'object') {
                    value = JSON.stringify(value);
                }
                // Escape commas and quotes in CSV
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    value = '"' + value.replace(/"/g, '""') + '"';
                }
                return value || '';
            });
            csv += row.join(',') + '\n';
        }

        return csv;
    }

    async getAuditLogs(filters = {}) {
        let logs = [...this.auditLogs];

        if (filters.job_id) {
            logs = logs.filter(log => log.job_id === filters.job_id);
        }

        if (filters.event) {
            logs = logs.filter(log => log.event === filters.event);
        }

        // Sort by timestamp (newest first)
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const limit = parseInt(filters.limit) || 100;
        const offset = parseInt(filters.offset) || 0;
        
        return {
            status: 'success',
            logs: logs.slice(offset, offset + limit),
            total: logs.length
        };
    }

    setupCleanupInterval() {
        // Clean up old completed jobs every hour
        setInterval(() => {
            const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
            
            for (const [jobId, job] of this.jobs) {
                if ((job.status === 'completed' || job.status === 'failed') && 
                    new Date(job.completed_at) < cutoff) {
                    
                    // Move to history before deletion
                    this.jobHistory.set(jobId, job);
                    this.jobs.delete(jobId);
                }
            }

            // Keep only last 1000 historical jobs
            if (this.jobHistory.size > 1000) {
                const entries = Array.from(this.jobHistory.entries());
                entries.sort((a, b) => new Date(b[1].completed_at) - new Date(a[1].completed_at));
                this.jobHistory.clear();
                entries.slice(0, 500).forEach(([id, job]) => {
                    this.jobHistory.set(id, job);
                });
            }

            logger.info(`Job cleanup completed. Active: ${this.jobs.size}, Historical: ${this.jobHistory.size}`);
        }, 60 * 60 * 1000); // Every hour
    }

    setupMetricsIntegration() {
        // Listen to our own events to capture metrics
        this.on('jobCompleted', (job) => {
            const processingData = this.generateProcessingData(job);
            this.metricsCollector.recordJobMetrics(job, processingData);
        });

        this.on('jobFailed', (job, error) => {
            const processingData = this.generateProcessingData(job, error);
            this.metricsCollector.recordJobMetrics(job, processingData);
            this.metricsCollector.recordError(job.job_id, {
                error: error.message,
                stack: error.stack,
                job_type: job.job_type,
                processing_stage: 'execution'
            });
        });

        this.on('jobProgress', (job, progress) => {
            // Update progress metrics in real-time
            if (progress.stage_metrics) {
                const processingData = {
                    processing_time: Date.now() - new Date(job.started_at).getTime(),
                    memory_usage: process.memoryUsage(),
                    cpu_usage: this.metricsCollector.getCurrentCpuUsage(),
                    algorithm_results: progress.algorithm_results,
                    quality_analysis: progress.quality_analysis
                };
                this.metricsCollector.recordJobMetrics(job, processingData);
            }
        });
    }

    generateProcessingData(job, error = null) {
        const processingTime = job.completed_at ? 
            new Date(job.completed_at).getTime() - new Date(job.started_at).getTime() : 
            Date.now() - new Date(job.started_at).getTime();

        return {
            processing_time: processingTime,
            memory_usage: process.memoryUsage(),
            cpu_usage: this.metricsCollector.getCurrentCpuUsage(),
            data_source_type: job.data_source?.type || 'file_upload',
            file_size: job.input_file_size || 0,
            algorithm_results: this.generateAlgorithmResults(job),
            quality_analysis: this.generateQualityAnalysis(job),
            errors: error ? [{ type: error.name, message: error.message }] : [],
            throughput: job.processed_records / (processingTime / 1000)
        };
    }

    generateAlgorithmResults(job) {
        // Generate realistic algorithm performance data based on job type
        const algorithms = this.getAlgorithmsForJobType(job.job_type);
        const results = {};

        algorithms.forEach(algorithmName => {
            const successRate = 0.85 + (Math.random() * 0.1); // 85-95% success rate
            const processingTime = Math.random() * 2000 + 500; // 500-2500ms
            const confidence = Math.random() * 0.3 + 0.7; // 70-100% confidence
            
            results[algorithmName] = {
                processing_time: processingTime,
                records_processed: job.processed_records,
                successful_matches: Math.floor(job.processed_records * successRate),
                errors: Math.floor(job.processed_records * (1 - successRate)),
                accuracy: (successRate * 100) + (Math.random() * 5 - 2.5), // Add some variance
                confidence_score: confidence,
                match_rate: successRate,
                quality_flags: this.generateQualityFlags()
            };
        });

        return results;
    }

    generateQualityAnalysis(job) {
        const baseQuality = Math.random() * 0.2 + 0.8; // 80-100%
        
        return {
            completeness: baseQuality * 100,
            accuracy: (0.9 + Math.random() * 0.1) * 100,
            consistency: (0.85 + Math.random() * 0.15) * 100,
            duplicate_rate: Math.random() * 10, // 0-10%
            missing_data_rate: Math.random() * 15, // 0-15%
            field_scores: {
                'first_name': 95 + Math.random() * 5,
                'last_name': 93 + Math.random() * 7,
                'email': 88 + Math.random() * 12,
                'phone': 85 + Math.random() * 15,
                'address': 78 + Math.random() * 22
            },
            validation_errors: this.generateValidationErrors(job),
            improvement_suggestions: this.generateImprovementSuggestions()
        };
    }

    getAlgorithmsForJobType(jobType) {
        const algorithmMap = {
            'identity_matching': ['deterministic', 'probabilistic', 'ai_hybrid'],
            'data_validation': ['schema_validation', 'business_rules', 'pattern_matching'],
            'data_quality': ['completeness_check', 'consistency_analyzer', 'accuracy_scorer'],
            'deduplication': ['exact_match', 'fuzzy_match', 'clustering'],
            'household_detection': ['address_grouping', 'name_analysis', 'relationship_inference'],
            'bulk_export': ['data_formatter', 'field_mapper', 'quality_filter']
        };

        return algorithmMap[jobType] || ['generic_processor'];
    }

    generateQualityFlags() {
        const flags = [];
        const possibleFlags = [
            'high_confidence', 'manual_review', 'partial_match', 
            'data_quality_concern', 'requires_validation'
        ];
        
        possibleFlags.forEach(flag => {
            if (Math.random() < 0.1) { // 10% chance for each flag
                flags.push(flag);
            }
        });

        return flags;
    }

    generateValidationErrors(job) {
        const errors = [];
        const errorTypes = [
            'Invalid email format',
            'Missing required field',
            'Date format inconsistency',
            'Duplicate record detected',
            'Data length exceeds limit'
        ];

        const errorCount = Math.floor(Math.random() * 3); // 0-2 errors
        for (let i = 0; i < errorCount; i++) {
            errors.push({
                type: 'validation_error',
                message: errorTypes[Math.floor(Math.random() * errorTypes.length)],
                field: ['first_name', 'last_name', 'email', 'phone'][Math.floor(Math.random() * 4)],
                record_count: Math.floor(Math.random() * 10) + 1
            });
        }

        return errors;
    }

    generateImprovementSuggestions() {
        const suggestions = [
            'Standardize phone number formats',
            'Implement email validation',
            'Normalize address formats',
            'Add data completeness checks',
            'Improve duplicate detection rules'
        ];

        const suggestionCount = Math.floor(Math.random() * 3); // 0-2 suggestions
        return suggestions.slice(0, suggestionCount);
    }

    // Add methods to get dashboard data through metrics collector
    getDashboardData() {
        return this.metricsCollector.getDashboardData();
    }

    getPerformanceInsights(timeframe = '24h') {
        return this.metricsCollector.getPerformanceOverview();
    }

    getTrends(days = 7) {
        return this.metricsCollector.getTrendData();
    }

    getJobSummary() {
        const dashboardData = this.metricsCollector.getDashboardData();
        return {
            overview: dashboardData.performance_overview,
            quality: dashboardData.quality_overview,
            resources: dashboardData.resource_usage,
            trends: dashboardData.trends
        };
    }

    getBatchStatistics() {
        const jobs = Array.from(this.jobs.values());
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const activeJobs = jobs.filter(job => job.status === 'processing' || job.status === 'pending').length;
        const completedToday = jobs.filter(job => {
            const jobDate = new Date(job.updated_at || job.created_at);
            return job.status === 'completed' && jobDate >= today;
        }).length;
        const queuedJobs = jobs.filter(job => job.status === 'pending').length;
        const totalJobs = jobs.length;
        const completedJobs = jobs.filter(job => job.status === 'completed').length;
        const failedJobs = jobs.filter(job => job.status === 'failed').length;
        
        // Calculate processing rate (simplified)
        const processingJobs = jobs.filter(job => job.status === 'processing');
        const avgProcessingTime = processingJobs.length > 0 ? 
            processingJobs.reduce((sum, job) => {
                const startTime = new Date(job.started_at || job.created_at);
                const now = new Date();
                return sum + (now - startTime);
            }, 0) / processingJobs.length : 0;
        
        const processingRatePerHour = avgProcessingTime > 0 ? Math.round(3600000 / avgProcessingTime) : 0;
        
        return {
            active_jobs: activeJobs,
            completed_today: completedToday,
            queued_jobs: queuedJobs,
            processing_rate_per_hour: processingRatePerHour,
            total_jobs: totalJobs,
            failed_jobs: failedJobs,
            success_rate: totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0,
            avg_processing_time: Math.round(avgProcessingTime / 1000) // in seconds
        };
    }

    initializeSampleJobs() {
        // Only initialize sample jobs if Redis is not available and we have no jobs
        if (!this.isRedisAvailable && this.jobs.size === 0) {
            logger.info('Initializing sample jobs for demo purposes...');
            
            const sampleJobs = [
                {
                    job_id: 'BATCH_20250911_102442_cedb4dd1',
                    name: 'Identity Matching - Healthcare Records',
                    job_type: 'identity_matching', 
                    status: 'completed',
                    priority: 'high',
                    created_by: 'admin_user',
                    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                    started_at: new Date(Date.now() - 24 * 60 * 60 * 1000 + 5000).toISOString(),
                    completed_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
                    progress: 100,
                    total_records: 5000,
                    processed_records: 5000,
                    successful_records: 4875,
                    failed_records: 125,
                    config: {
                        batch_size: 1000,
                        match_threshold: 0.85,
                        use_ai: true
                    }
                },
                {
                    job_id: 'BATCH_20250911_143000_abc123ef',
                    name: 'AI Cross-Reference - Financial Data',
                    job_type: 'ai_cross_reference',
                    status: 'running',
                    priority: 'normal',
                    created_by: 'system_user',
                    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                    started_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 10000).toISOString(),
                    progress: 67,
                    total_records: 3000,
                    processed_records: 2010,
                    successful_records: 1950,
                    failed_records: 60,
                    config: {
                        batch_size: 500,
                        match_threshold: 0.90,
                        use_ai: true
                    }
                },
                {
                    job_id: 'BATCH_20250911_160500_def456gh',
                    name: 'Data Validation - Customer Records',
                    job_type: 'data_validation',
                    status: 'queued',
                    priority: 'low',
                    created_by: 'data_admin',
                    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
                    progress: 0,
                    total_records: 1500,
                    processed_records: 0,
                    successful_records: 0,
                    failed_records: 0,
                    config: {
                        batch_size: 100,
                        match_threshold: 0.75,
                        use_ai: false
                    }
                },
                {
                    job_id: 'BATCH_20250911_090000_hij789kl',
                    name: 'Entity Resolution - Legacy System',
                    job_type: 'entity_resolution',
                    status: 'failed',
                    priority: 'normal',
                    created_by: 'legacy_admin',
                    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
                    started_at: new Date(Date.now() - 8 * 60 * 60 * 1000 + 5000).toISOString(),
                    failed_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
                    progress: 45,
                    total_records: 2500,
                    processed_records: 1125,
                    successful_records: 1000,
                    failed_records: 125,
                    error_message: 'Connection timeout to external API',
                    config: {
                        batch_size: 250,
                        match_threshold: 0.80,
                        use_ai: true
                    }
                },
                {
                    job_id: 'BATCH_20250911_173000_mno012pq',
                    name: 'Real-time Processing - Current Batch',
                    job_type: 'real_time_processing',
                    status: 'running',
                    priority: 'high',
                    created_by: 'rt_processor',
                    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
                    started_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
                    progress: 25,
                    total_records: 800,
                    processed_records: 200,
                    successful_records: 195,
                    failed_records: 5,
                    config: {
                        batch_size: 50,
                        match_threshold: 0.95,
                        use_ai: true
                    }
                }
            ];

            // Add jobs to memory
            sampleJobs.forEach(jobData => {
                this.jobs.set(jobData.job_id, jobData);
                
                // Add to audit logs
                this.addAuditLog({
                    job_id: jobData.job_id,
                    action_type: 'CREATED',
                    action_details: `Sample job created: ${jobData.name}`,
                    user_id: jobData.created_by,
                    timestamp: jobData.created_at
                });

                if (jobData.status === 'completed') {
                    this.addAuditLog({
                        job_id: jobData.job_id,
                        action_type: 'COMPLETED',
                        action_details: `Job completed successfully with ${jobData.successful_records}/${jobData.total_records} successful records`,
                        user_id: jobData.created_by,
                        timestamp: jobData.completed_at
                    });
                } else if (jobData.status === 'failed') {
                    this.addAuditLog({
                        job_id: jobData.job_id,
                        action_type: 'FAILED',
                        action_details: `Job failed: ${jobData.error_message}`,
                        user_id: jobData.created_by,
                        timestamp: jobData.failed_at
                    });
                } else if (jobData.status === 'running') {
                    this.addAuditLog({
                        job_id: jobData.job_id,
                        action_type: 'STARTED',
                        action_details: `Job started processing`,
                        user_id: jobData.created_by,
                        timestamp: jobData.started_at
                    });
                }
            });

            logger.info(`Initialized ${sampleJobs.length} sample jobs for demo`);
        }
    }

    async shutdown() {
        logger.info('Shutting down Job Manager...');
        
        // Cleanup metrics
        if (this.metricsCollector) {
            this.metricsCollector.cleanup();
        }
        
        // Close all queues
        for (const queue of this.queues.values()) {
            await queue.close();
        }

        // Close Redis connection
        if (this.redisClient) {
            await this.redisClient.disconnect();
        }

        logger.info('Job Manager shutdown complete');
    }
}

module.exports = JobManager;