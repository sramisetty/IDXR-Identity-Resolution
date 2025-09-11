/**
 * MetricsCollector - Comprehensive metrics collection system
 * Captures data for dashboard sections, performance tracking, and reporting
 */

const { EventEmitter } = require('events');
const os = require('os');
const logger = require('../utils/logger');

class MetricsCollector extends EventEmitter {
    constructor() {
        super();
        
        // Metrics storage
        this.performanceMetrics = new Map();
        this.algorithmMetrics = new Map();
        this.dataSourceMetrics = new Map();
        this.processingStats = new Map();
        this.resourceMetrics = [];
        this.qualityMetrics = new Map();
        this.errorMetrics = new Map();
        
        // Time series data for trends
        this.timeSeriesData = {
            hourly: new Map(),
            daily: new Map(),
            weekly: new Map()
        };
        
        // Start periodic resource monitoring
        this.startResourceMonitoring();
        
        logger.info('MetricsCollector initialized');
    }

    /**
     * Record job processing metrics
     */
    recordJobMetrics(job, processingData) {
        const timestamp = new Date().toISOString();
        const hour = new Date().getHours();
        const day = new Date().getDate();
        
        try {
            // Overall performance metrics
            const performanceData = {
                job_id: job.job_id,
                job_type: job.job_type,
                processing_time: processingData.processing_time || 0,
                records_processed: job.processed_records,
                records_per_second: this.calculateRecordsPerSecond(job, processingData),
                success_rate: (job.successful_records / job.total_records) * 100,
                error_rate: (job.failed_records / job.total_records) * 100,
                throughput: job.total_records / (processingData.processing_time / 1000),
                memory_usage: processingData.memory_usage || process.memoryUsage(),
                cpu_usage: processingData.cpu_usage || this.getCurrentCpuUsage(),
                timestamp: timestamp,
                status: job.status
            };
            
            this.performanceMetrics.set(job.job_id, performanceData);
            
            // Algorithm-specific metrics
            if (processingData.algorithm_results) {
                this.recordAlgorithmMetrics(job, processingData.algorithm_results);
            }
            
            // Data source metrics
            this.recordDataSourceMetrics(job, processingData);
            
            // Processing statistics
            this.recordProcessingStats(job, processingData);
            
            // Quality metrics
            this.recordQualityMetrics(job, processingData);
            
            // Update time series data
            this.updateTimeSeriesData(hour, day, performanceData);
            
            // Emit metrics update event
            this.emit('metricsUpdated', {
                type: 'job_metrics',
                job_id: job.job_id,
                metrics: performanceData
            });
            
        } catch (error) {
            logger.error('Error recording job metrics:', error);
        }
    }

    /**
     * Record algorithm performance metrics
     */
    recordAlgorithmMetrics(job, algorithmResults) {
        const timestamp = new Date().toISOString();
        
        Object.entries(algorithmResults).forEach(([algorithmName, results]) => {
            const algorithmKey = `${job.job_type}_${algorithmName}`;
            
            if (!this.algorithmMetrics.has(algorithmKey)) {
                this.algorithmMetrics.set(algorithmKey, {
                    algorithm_name: algorithmName,
                    job_type: job.job_type,
                    total_executions: 0,
                    total_processing_time: 0,
                    total_records_processed: 0,
                    success_count: 0,
                    error_count: 0,
                    average_accuracy: 0,
                    average_processing_time: 0,
                    confidence_scores: [],
                    match_rates: [],
                    performance_trend: [],
                    last_updated: timestamp
                });
            }
            
            const algorithmData = this.algorithmMetrics.get(algorithmKey);
            
            // Update algorithm statistics
            algorithmData.total_executions += 1;
            algorithmData.total_processing_time += results.processing_time || 0;
            algorithmData.total_records_processed += results.records_processed || 0;
            algorithmData.success_count += results.successful_matches || 0;
            algorithmData.error_count += results.errors || 0;
            
            // Calculate averages
            algorithmData.average_processing_time = algorithmData.total_processing_time / algorithmData.total_executions;
            algorithmData.average_accuracy = results.accuracy || 0;
            
            // Store confidence scores and match rates for trend analysis
            if (results.confidence_score) {
                algorithmData.confidence_scores.push({
                    score: results.confidence_score,
                    timestamp: timestamp
                });
                // Keep only last 100 scores
                if (algorithmData.confidence_scores.length > 100) {
                    algorithmData.confidence_scores.shift();
                }
            }
            
            if (results.match_rate) {
                algorithmData.match_rates.push({
                    rate: results.match_rate,
                    timestamp: timestamp
                });
                // Keep only last 100 rates
                if (algorithmData.match_rates.length > 100) {
                    algorithmData.match_rates.shift();
                }
            }
            
            // Performance trend data
            algorithmData.performance_trend.push({
                processing_time: results.processing_time,
                accuracy: results.accuracy,
                throughput: results.records_processed / (results.processing_time / 1000),
                timestamp: timestamp
            });
            
            // Keep only last 24 hours of trend data
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            algorithmData.performance_trend = algorithmData.performance_trend.filter(
                trend => trend.timestamp > oneDayAgo
            );
            
            algorithmData.last_updated = timestamp;
        });
    }

    /**
     * Record data source metrics
     */
    recordDataSourceMetrics(job, processingData) {
        const dataSourceType = job.data_source?.type || processingData.data_source_type || 'unknown';
        const timestamp = new Date().toISOString();
        
        if (!this.dataSourceMetrics.has(dataSourceType)) {
            this.dataSourceMetrics.set(dataSourceType, {
                source_type: dataSourceType,
                total_jobs: 0,
                total_records: 0,
                successful_records: 0,
                failed_records: 0,
                average_file_size: 0,
                processing_times: [],
                error_types: new Map(),
                quality_scores: [],
                data_completeness: [],
                last_processed: timestamp
            });
        }
        
        const sourceData = this.dataSourceMetrics.get(dataSourceType);
        
        sourceData.total_jobs += 1;
        sourceData.total_records += job.total_records;
        sourceData.successful_records += job.successful_records;
        sourceData.failed_records += job.failed_records;
        
        if (processingData.file_size) {
            sourceData.average_file_size = (
                (sourceData.average_file_size * (sourceData.total_jobs - 1)) + 
                processingData.file_size
            ) / sourceData.total_jobs;
        }
        
        sourceData.processing_times.push({
            time: processingData.processing_time,
            timestamp: timestamp
        });
        
        // Track error types
        if (processingData.errors) {
            processingData.errors.forEach(error => {
                const errorType = error.type || 'unknown';
                sourceData.error_types.set(
                    errorType,
                    (sourceData.error_types.get(errorType) || 0) + 1
                );
            });
        }
        
        // Quality and completeness metrics
        if (processingData.quality_score) {
            sourceData.quality_scores.push({
                score: processingData.quality_score,
                timestamp: timestamp
            });
        }
        
        if (processingData.data_completeness) {
            sourceData.data_completeness.push({
                completeness: processingData.data_completeness,
                timestamp: timestamp
            });
        }
        
        sourceData.last_processed = timestamp;
    }

    /**
     * Record processing statistics
     */
    recordProcessingStats(job, processingData) {
        const jobType = job.job_type;
        const timestamp = new Date().toISOString();
        
        if (!this.processingStats.has(jobType)) {
            this.processingStats.set(jobType, {
                job_type: jobType,
                total_jobs: 0,
                active_jobs: 0,
                completed_jobs: 0,
                failed_jobs: 0,
                total_processing_time: 0,
                average_processing_time: 0,
                peak_processing_time: 0,
                total_records: 0,
                average_records_per_job: 0,
                throughput_stats: {
                    current: 0,
                    average: 0,
                    peak: 0
                },
                resource_usage: {
                    avg_cpu: 0,
                    avg_memory: 0,
                    peak_cpu: 0,
                    peak_memory: 0
                },
                quality_distribution: {
                    high: 0,    // >90%
                    medium: 0,  // 70-90%
                    low: 0      // <70%
                },
                last_updated: timestamp
            });
        }
        
        const stats = this.processingStats.get(jobType);
        
        stats.total_jobs += 1;
        if (job.status === 'completed') stats.completed_jobs += 1;
        if (job.status === 'failed') stats.failed_jobs += 1;
        if (job.status === 'running') stats.active_jobs += 1;
        
        stats.total_records += job.total_records;
        stats.average_records_per_job = stats.total_records / stats.total_jobs;
        
        if (processingData.processing_time) {
            stats.total_processing_time += processingData.processing_time;
            stats.average_processing_time = stats.total_processing_time / stats.completed_jobs;
            
            if (processingData.processing_time > stats.peak_processing_time) {
                stats.peak_processing_time = processingData.processing_time;
            }
        }
        
        // Throughput calculations
        if (processingData.processing_time) {
            const currentThroughput = job.total_records / (processingData.processing_time / 1000);
            stats.throughput_stats.current = currentThroughput;
            
            if (currentThroughput > stats.throughput_stats.peak) {
                stats.throughput_stats.peak = currentThroughput;
            }
        }
        
        // Resource usage tracking
        if (processingData.cpu_usage) {
            stats.resource_usage.avg_cpu = (
                (stats.resource_usage.avg_cpu * (stats.total_jobs - 1)) + 
                processingData.cpu_usage
            ) / stats.total_jobs;
            
            if (processingData.cpu_usage > stats.resource_usage.peak_cpu) {
                stats.resource_usage.peak_cpu = processingData.cpu_usage;
            }
        }
        
        if (processingData.memory_usage?.heapUsed) {
            const memoryMB = processingData.memory_usage.heapUsed / 1024 / 1024;
            stats.resource_usage.avg_memory = (
                (stats.resource_usage.avg_memory * (stats.total_jobs - 1)) + 
                memoryMB
            ) / stats.total_jobs;
            
            if (memoryMB > stats.resource_usage.peak_memory) {
                stats.resource_usage.peak_memory = memoryMB;
            }
        }
        
        // Quality distribution
        const successRate = (job.successful_records / job.total_records) * 100;
        if (successRate > 90) stats.quality_distribution.high += 1;
        else if (successRate >= 70) stats.quality_distribution.medium += 1;
        else stats.quality_distribution.low += 1;
        
        stats.last_updated = timestamp;
    }

    /**
     * Record quality metrics
     */
    recordQualityMetrics(job, processingData) {
        const timestamp = new Date().toISOString();
        
        if (!this.qualityMetrics.has(job.job_id)) {
            this.qualityMetrics.set(job.job_id, {
                job_id: job.job_id,
                job_type: job.job_type,
                overall_quality_score: 0,
                data_completeness: 0,
                data_accuracy: 0,
                data_consistency: 0,
                duplicate_rate: 0,
                missing_data_rate: 0,
                validation_errors: [],
                field_quality_scores: new Map(),
                improvement_suggestions: [],
                timestamp: timestamp
            });
        }
        
        const qualityData = this.qualityMetrics.get(job.job_id);
        
        // Calculate quality metrics
        const successRate = (job.successful_records / job.total_records) * 100;
        qualityData.overall_quality_score = successRate;
        
        if (processingData.quality_analysis) {
            const qa = processingData.quality_analysis;
            qualityData.data_completeness = qa.completeness || 0;
            qualityData.data_accuracy = qa.accuracy || 0;
            qualityData.data_consistency = qa.consistency || 0;
            qualityData.duplicate_rate = qa.duplicate_rate || 0;
            qualityData.missing_data_rate = qa.missing_data_rate || 0;
            
            if (qa.field_scores) {
                Object.entries(qa.field_scores).forEach(([field, score]) => {
                    qualityData.field_quality_scores.set(field, score);
                });
            }
            
            if (qa.validation_errors) {
                qualityData.validation_errors = qa.validation_errors;
            }
            
            if (qa.improvement_suggestions) {
                qualityData.improvement_suggestions = qa.improvement_suggestions;
            }
        }
        
        qualityData.timestamp = timestamp;
    }

    /**
     * Start resource monitoring
     */
    startResourceMonitoring() {
        setInterval(() => {
            const resourceData = {
                timestamp: new Date().toISOString(),
                cpu: {
                    usage: this.getCurrentCpuUsage(),
                    load_average: os.loadavg(),
                    cores: os.cpus().length
                },
                memory: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    used: os.totalmem() - os.freemem(),
                    usage_percent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
                    process_memory: process.memoryUsage()
                },
                system: {
                    uptime: os.uptime(),
                    platform: os.platform(),
                    arch: os.arch(),
                    node_version: process.version
                },
                network: {
                    interfaces: os.networkInterfaces()
                }
            };
            
            this.resourceMetrics.push(resourceData);
            
            // Keep only last 24 hours of resource data (one per minute)
            if (this.resourceMetrics.length > 1440) {
                this.resourceMetrics.shift();
            }
            
            this.emit('resourceUpdate', resourceData);
        }, 60000); // Every minute
    }

    /**
     * Update time series data for trends
     */
    updateTimeSeriesData(hour, day, performanceData) {
        // Hourly data
        const hourKey = `${new Date().getDate()}-${hour}`;
        if (!this.timeSeriesData.hourly.has(hourKey)) {
            this.timeSeriesData.hourly.set(hourKey, {
                timestamp: new Date().toISOString(),
                jobs_completed: 0,
                records_processed: 0,
                average_processing_time: 0,
                success_rate: 0,
                throughput: 0
            });
        }
        
        const hourData = this.timeSeriesData.hourly.get(hourKey);
        hourData.jobs_completed += 1;
        hourData.records_processed += performanceData.records_processed;
        hourData.average_processing_time = (
            (hourData.average_processing_time * (hourData.jobs_completed - 1)) + 
            performanceData.processing_time
        ) / hourData.jobs_completed;
        hourData.success_rate = (
            (hourData.success_rate * (hourData.jobs_completed - 1)) + 
            performanceData.success_rate
        ) / hourData.jobs_completed;
        hourData.throughput += performanceData.throughput || 0;
    }

    /**
     * Get comprehensive dashboard data
     */
    getDashboardData() {
        return {
            performance_overview: this.getPerformanceOverview(),
            algorithm_performance: this.getAlgorithmPerformance(),
            real_time_metrics: this.getRealTimeMetrics(),
            data_sources: this.getDataSourceSummary(),
            processing_stats: this.getProcessingStatsSummary(),
            top_algorithms: this.getTopPerformingAlgorithms(),
            resource_usage: this.getCurrentResourceUsage(),
            quality_overview: this.getQualityOverview(),
            trends: this.getTrendData()
        };
    }

    /**
     * Get performance overview
     */
    getPerformanceOverview() {
        const recentJobs = Array.from(this.performanceMetrics.values())
            .filter(job => {
                const jobTime = new Date(job.timestamp);
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return jobTime > oneDayAgo;
            });
        
        if (recentJobs.length === 0) {
            return {
                total_jobs: 0,
                successful_jobs: 0,
                average_processing_time: 0,
                total_records_processed: 0,
                average_throughput: 0,
                success_rate: 0
            };
        }
        
        const successfulJobs = recentJobs.filter(job => job.status === 'completed');
        const totalRecords = recentJobs.reduce((sum, job) => sum + job.records_processed, 0);
        const avgProcessingTime = recentJobs.reduce((sum, job) => sum + job.processing_time, 0) / recentJobs.length;
        const avgThroughput = recentJobs.reduce((sum, job) => sum + (job.throughput || 0), 0) / recentJobs.length;
        const successRate = (successfulJobs.length / recentJobs.length) * 100;
        
        return {
            total_jobs: recentJobs.length,
            successful_jobs: successfulJobs.length,
            average_processing_time: avgProcessingTime,
            total_records_processed: totalRecords,
            average_throughput: avgThroughput,
            success_rate: successRate
        };
    }

    /**
     * Get algorithm performance data
     */
    getAlgorithmPerformance() {
        return Array.from(this.algorithmMetrics.values()).map(algo => ({
            algorithm_name: algo.algorithm_name,
            job_type: algo.job_type,
            executions: algo.total_executions,
            average_processing_time: algo.average_processing_time,
            success_rate: algo.success_count / (algo.success_count + algo.error_count) * 100,
            average_accuracy: algo.average_accuracy,
            confidence_trend: algo.confidence_scores.slice(-24), // Last 24 data points
            performance_trend: algo.performance_trend.slice(-24)
        }));
    }

    /**
     * Get real-time metrics
     */
    getRealTimeMetrics() {
        const currentTime = new Date();
        const fiveMinutesAgo = new Date(currentTime - 5 * 60 * 1000);
        
        const recentJobs = Array.from(this.performanceMetrics.values())
            .filter(job => new Date(job.timestamp) > fiveMinutesAgo);
        
        const activeJobs = recentJobs.filter(job => job.status === 'running').length;
        const currentThroughput = recentJobs.reduce((sum, job) => sum + (job.throughput || 0), 0);
        
        return {
            active_jobs: activeJobs,
            current_throughput: currentThroughput,
            records_per_second: recentJobs.reduce((sum, job) => sum + job.records_per_second, 0),
            recent_completions: recentJobs.filter(job => job.status === 'completed').length,
            error_rate: recentJobs.length > 0 ? 
                recentJobs.reduce((sum, job) => sum + job.error_rate, 0) / recentJobs.length : 0
        };
    }

    /**
     * Get data source summary
     */
    getDataSourceSummary() {
        return Array.from(this.dataSourceMetrics.values()).map(source => ({
            source_type: source.source_type,
            total_jobs: source.total_jobs,
            total_records: source.total_records,
            success_rate: (source.successful_records / source.total_records) * 100,
            average_file_size: source.average_file_size,
            common_errors: Array.from(source.error_types.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
        }));
    }

    /**
     * Get processing stats summary
     */
    getProcessingStatsSummary() {
        return Array.from(this.processingStats.values());
    }

    /**
     * Get top performing algorithms (last 24h)
     */
    getTopPerformingAlgorithms() {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        return Array.from(this.algorithmMetrics.values())
            .filter(algo => new Date(algo.last_updated) > oneDayAgo)
            .sort((a, b) => {
                const scoreA = (a.average_accuracy * 0.4) + 
                             ((a.success_count / (a.success_count + a.error_count)) * 100 * 0.4) +
                             (Math.max(0, 100 - a.average_processing_time) * 0.2);
                const scoreB = (b.average_accuracy * 0.4) + 
                             ((b.success_count / (b.success_count + b.error_count)) * 100 * 0.4) +
                             (Math.max(0, 100 - b.average_processing_time) * 0.2);
                return scoreB - scoreA;
            })
            .slice(0, 10)
            .map(algo => ({
                algorithm_name: algo.algorithm_name,
                job_type: algo.job_type,
                accuracy: algo.average_accuracy,
                success_rate: (algo.success_count / (algo.success_count + algo.error_count)) * 100,
                processing_time: algo.average_processing_time,
                executions: algo.total_executions
            }));
    }

    /**
     * Get current resource usage
     */
    getCurrentResourceUsage() {
        const latestResource = this.resourceMetrics[this.resourceMetrics.length - 1];
        
        if (!latestResource) {
            return {
                cpu_usage: 0,
                memory_usage: 0,
                available_memory: 0,
                system_load: [],
                uptime: 0
            };
        }
        
        return {
            cpu_usage: latestResource.cpu.usage,
            memory_usage: latestResource.memory.usage_percent,
            available_memory: latestResource.memory.free,
            system_load: latestResource.cpu.load_average,
            uptime: latestResource.system.uptime,
            process_memory: latestResource.memory.process_memory
        };
    }

    /**
     * Get quality overview
     */
    getQualityOverview() {
        const qualityData = Array.from(this.qualityMetrics.values());
        
        if (qualityData.length === 0) {
            return {
                average_quality_score: 0,
                data_completeness: 0,
                total_issues: 0,
                improvement_opportunities: 0
            };
        }
        
        const avgQuality = qualityData.reduce((sum, q) => sum + q.overall_quality_score, 0) / qualityData.length;
        const avgCompleteness = qualityData.reduce((sum, q) => sum + q.data_completeness, 0) / qualityData.length;
        const totalIssues = qualityData.reduce((sum, q) => sum + q.validation_errors.length, 0);
        const improvements = qualityData.reduce((sum, q) => sum + q.improvement_suggestions.length, 0);
        
        return {
            average_quality_score: avgQuality,
            data_completeness: avgCompleteness,
            total_issues: totalIssues,
            improvement_opportunities: improvements
        };
    }

    /**
     * Get trend data
     */
    getTrendData() {
        return {
            hourly: Array.from(this.timeSeriesData.hourly.values()).slice(-24),
            daily: Array.from(this.timeSeriesData.daily.values()).slice(-7),
            resource_trends: this.resourceMetrics.slice(-60) // Last hour of resource data
        };
    }

    /**
     * Helper methods
     */
    calculateRecordsPerSecond(job, processingData) {
        if (!processingData.processing_time || processingData.processing_time === 0) {
            return 0;
        }
        return job.processed_records / (processingData.processing_time / 1000);
    }

    getCurrentCpuUsage() {
        // Simple CPU usage calculation
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        
        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });
        
        return 100 - ~~(100 * totalIdle / totalTick);
    }

    /**
     * Error tracking
     */
    recordError(jobId, errorData) {
        if (!this.errorMetrics.has(jobId)) {
            this.errorMetrics.set(jobId, []);
        }
        
        this.errorMetrics.get(jobId).push({
            ...errorData,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get error metrics
     */
    getErrorMetrics() {
        return Array.from(this.errorMetrics.entries()).map(([jobId, errors]) => ({
            job_id: jobId,
            error_count: errors.length,
            errors: errors
        }));
    }

    /**
     * Calculate average processing time across all completed jobs
     */
    getAverageProcessingTime() {
        const completedJobs = Array.from(this.performanceMetrics.values())
            .filter(metric => metric.status === 'completed' && metric.processing_time);
        
        if (completedJobs.length === 0) {
            return 0;
        }
        
        const totalTime = completedJobs.reduce((sum, job) => sum + job.processing_time, 0);
        return totalTime / completedJobs.length;
    }

    /**
     * Get comprehensive system statistics
     */
    getSystemStatistics() {
        const now = Date.now();
        const last24h = now - 24 * 60 * 60 * 1000;
        
        const totalJobs = this.performanceMetrics.size;
        const completedJobs = Array.from(this.performanceMetrics.values())
            .filter(metric => metric.status === 'completed').length;
        const failedJobs = Array.from(this.performanceMetrics.values())
            .filter(metric => metric.status === 'failed').length;
        const pendingJobs = Array.from(this.performanceMetrics.values())
            .filter(metric => metric.status === 'pending').length;
        
        const avgProcessingTime = this.getAverageProcessingTime();
        const successRate = totalJobs > 0 ? (completedJobs / totalJobs * 100) : 0;
        const errorRate = totalJobs > 0 ? (failedJobs / totalJobs * 100) : 0;
        
        const recentMetrics = Array.from(this.performanceMetrics.values())
            .filter(metric => new Date(metric.timestamp).getTime() > last24h);
        
        const totalRequests = recentMetrics.length;
        const avgThroughput = totalRequests / 24; // per hour
        
        const currentResource = this.getCurrentResourceUsage();
        
        return {
            total_jobs: totalJobs,
            completed_jobs: completedJobs,
            failed_jobs: failedJobs,
            pending_jobs: pendingJobs,
            success_rate: Math.round(successRate * 100) / 100,
            error_rate: Math.round(errorRate * 100) / 100,
            avg_processing_time: avgProcessingTime,
            total_requests: totalRequests,
            avg_throughput_per_hour: Math.round(avgThroughput * 100) / 100,
            memory_usage_mb: Math.round(currentResource.memory_usage || 0),
            cpu_usage_percent: currentResource.cpu_usage || 0,
            uptime_hours: Math.round(process.uptime() / 3600 * 100) / 100,
            active_algorithms: this.algorithmMetrics.size,
            data_sources_count: this.dataSourceMetrics.size
        };
    }

    /**
     * Cleanup old metrics (run periodically)
     */
    cleanup() {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        // Clean up old performance metrics
        for (const [jobId, metrics] of this.performanceMetrics.entries()) {
            if (new Date(metrics.timestamp) < sevenDaysAgo) {
                this.performanceMetrics.delete(jobId);
            }
        }
        
        // Clean up old quality metrics
        for (const [jobId, metrics] of this.qualityMetrics.entries()) {
            if (new Date(metrics.timestamp) < sevenDaysAgo) {
                this.qualityMetrics.delete(jobId);
            }
        }
        
        // Clean up old error metrics
        for (const [jobId, errors] of this.errorMetrics.entries()) {
            const recentErrors = errors.filter(error => new Date(error.timestamp) >= sevenDaysAgo);
            if (recentErrors.length === 0) {
                this.errorMetrics.delete(jobId);
            } else {
                this.errorMetrics.set(jobId, recentErrors);
            }
        }
        
        logger.info('Metrics cleanup completed');
    }
}

module.exports = MetricsCollector;