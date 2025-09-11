const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class WebSocketService {
    constructor(server, jobManager) {
        this.io = new Server(server, {
            path: '/websocket/socket.io/',
            cors: {
                origin: process.env.CORS_ORIGIN || "*",
                methods: ["GET", "POST"]
            },
            transports: ['websocket', 'polling']
        });

        this.jobManager = jobManager;
        this.connectedClients = new Map();
        this.roomSubscriptions = new Map();
        
        this.setupAuthentication();
        this.setupEventHandlers();
        this.setupJobManagerListeners();
        
        logger.info('WebSocket service initialized');
    }

    setupAuthentication() {
        this.io.use((socket, next) => {
            try {
                // For demo purposes, allow connections without strict auth
                const token = socket.handshake.auth.token || socket.handshake.query.token;
                
                if (token && token !== 'demo') {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo_secret');
                    socket.user = decoded;
                } else {
                    // Demo user for development
                    socket.user = {
                        id: 'demo_user',
                        agency: 'DEMO_AGENCY',
                        role: 'admin'
                    };
                }
                
                logger.info(`WebSocket client authenticated: ${socket.user.id}`);
                next();
            } catch (err) {
                logger.error('WebSocket authentication failed:', err);
                next(new Error('Authentication failed'));
            }
        });
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            this.handleClientConnection(socket);
        });
    }

    handleClientConnection(socket) {
        const userId = socket.user.id;
        const clientInfo = {
            id: socket.id,
            userId: userId,
            agency: socket.user.agency,
            role: socket.user.role,
            connectedAt: new Date(),
            subscriptions: new Set(),
            lastActivity: new Date()
        };

        this.connectedClients.set(socket.id, clientInfo);
        
        logger.info(`WebSocket client connected: ${socket.id} (${userId})`);

        // Send initial connection confirmation
        socket.emit('connected', {
            clientId: socket.id,
            serverTime: new Date().toISOString(),
            features: ['job_updates', 'audit_logs', 'real_time_metrics']
        });

        // Handle client events
        this.setupClientEventHandlers(socket, clientInfo);

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            this.handleClientDisconnection(socket, reason);
        });
    }

    setupClientEventHandlers(socket, clientInfo) {
        // Subscribe to job updates
        socket.on('subscribe_jobs', (data) => {
            const { filters = {} } = data;
            this.subscribeToJobs(socket, clientInfo, filters);
        });

        // Subscribe to specific job
        socket.on('subscribe_job', (data) => {
            const { jobId } = data;
            if (jobId) {
                this.subscribeToJob(socket, clientInfo, jobId);
            }
        });

        // Unsubscribe from job updates
        socket.on('unsubscribe_jobs', () => {
            this.unsubscribeFromJobs(socket, clientInfo);
        });

        // Subscribe to audit logs
        socket.on('subscribe_audit', (data) => {
            this.subscribeToAuditLogs(socket, clientInfo, data?.filters);
        });

        // Subscribe to system metrics
        socket.on('subscribe_metrics', () => {
            this.subscribeToMetrics(socket, clientInfo);
        });

        // Handle ping for connection health
        socket.on('ping', (callback) => {
            clientInfo.lastActivity = new Date();
            if (typeof callback === 'function') {
                callback({ pong: true, serverTime: new Date().toISOString() });
            }
        });

        // Request current job status
        socket.on('request_job_status', async (data) => {
            const { jobId } = data;
            if (jobId) {
                const result = await this.jobManager.getJob(jobId);
                socket.emit('job_status_response', {
                    jobId,
                    ...result
                });
            }
        });

        // Request job queue statistics
        socket.on('request_queue_stats', async () => {
            const stats = await this.jobManager.getQueueStatistics();
            socket.emit('queue_stats_response', stats);
        });
    }

    subscribeToJobs(socket, clientInfo, filters = {}) {
        const roomName = this.getJobsRoomName(filters);
        socket.join(roomName);
        clientInfo.subscriptions.add(roomName);

        // Track room subscriptions
        if (!this.roomSubscriptions.has(roomName)) {
            this.roomSubscriptions.set(roomName, new Set());
        }
        this.roomSubscriptions.get(roomName).add(socket.id);

        logger.info(`Client ${socket.id} subscribed to jobs: ${roomName}`);

        // Send current jobs matching filters
        this.sendCurrentJobs(socket, filters);

        socket.emit('subscription_confirmed', {
            type: 'jobs',
            filters,
            room: roomName
        });
    }

    subscribeToJob(socket, clientInfo, jobId) {
        const roomName = `job_${jobId}`;
        socket.join(roomName);
        clientInfo.subscriptions.add(roomName);

        if (!this.roomSubscriptions.has(roomName)) {
            this.roomSubscriptions.set(roomName, new Set());
        }
        this.roomSubscriptions.get(roomName).add(socket.id);

        logger.info(`Client ${socket.id} subscribed to job: ${jobId}`);

        // Send current job status
        this.jobManager.getJob(jobId).then(result => {
            socket.emit('job_update', {
                type: 'status',
                ...result
            });
        });

        socket.emit('subscription_confirmed', {
            type: 'job',
            jobId,
            room: roomName
        });
    }

    unsubscribeFromJobs(socket, clientInfo) {
        clientInfo.subscriptions.forEach(roomName => {
            socket.leave(roomName);
            const roomSubs = this.roomSubscriptions.get(roomName);
            if (roomSubs) {
                roomSubs.delete(socket.id);
                if (roomSubs.size === 0) {
                    this.roomSubscriptions.delete(roomName);
                }
            }
        });

        clientInfo.subscriptions.clear();
        socket.emit('unsubscribed', { type: 'all' });
    }

    subscribeToAuditLogs(socket, clientInfo, filters = {}) {
        const roomName = 'audit_logs';
        socket.join(roomName);
        clientInfo.subscriptions.add(roomName);

        if (!this.roomSubscriptions.has(roomName)) {
            this.roomSubscriptions.set(roomName, new Set());
        }
        this.roomSubscriptions.get(roomName).add(socket.id);

        logger.info(`Client ${socket.id} subscribed to audit logs`);

        socket.emit('subscription_confirmed', {
            type: 'audit_logs',
            filters,
            room: roomName
        });
    }

    subscribeToMetrics(socket, clientInfo) {
        const roomName = 'system_metrics';
        socket.join(roomName);
        clientInfo.subscriptions.add(roomName);

        if (!this.roomSubscriptions.has(roomName)) {
            this.roomSubscriptions.set(roomName, new Set());
        }
        this.roomSubscriptions.get(roomName).add(socket.id);

        logger.info(`Client ${socket.id} subscribed to system metrics`);

        // Start sending periodic metrics
        this.startMetricsUpdates(socket);

        socket.emit('subscription_confirmed', {
            type: 'system_metrics',
            room: roomName
        });
    }

    async sendCurrentJobs(socket, filters = {}) {
        try {
            const result = await this.jobManager.getJobs(filters);
            if (result.status === 'success') {
                socket.emit('jobs_snapshot', {
                    jobs: result.jobs,
                    total: result.total,
                    filters
                });
            }
        } catch (error) {
            logger.error('Error sending current jobs:', error);
        }
    }

    startMetricsUpdates(socket) {
        const interval = setInterval(async () => {
            if (!socket.connected) {
                clearInterval(interval);
                return;
            }

            try {
                const stats = await this.jobManager.getQueueStatistics();
                const metrics = {
                    timestamp: new Date().toISOString(),
                    job_stats: stats.statistics,
                    system_health: {
                        memory_usage: process.memoryUsage(),
                        uptime: process.uptime(),
                        connected_clients: this.connectedClients.size
                    }
                };

                socket.emit('metrics_update', metrics);
            } catch (error) {
                logger.error('Error sending metrics update:', error);
            }
        }, 5000); // Every 5 seconds

        // Store interval reference for cleanup
        const clientInfo = this.connectedClients.get(socket.id);
        if (clientInfo) {
            clientInfo.metricsInterval = interval;
        }
    }

    handleClientDisconnection(socket, reason) {
        const clientInfo = this.connectedClients.get(socket.id);
        if (clientInfo) {
            // Clean up subscriptions
            clientInfo.subscriptions.forEach(roomName => {
                const roomSubs = this.roomSubscriptions.get(roomName);
                if (roomSubs) {
                    roomSubs.delete(socket.id);
                    if (roomSubs.size === 0) {
                        this.roomSubscriptions.delete(roomName);
                    }
                }
            });

            // Clean up intervals
            if (clientInfo.metricsInterval) {
                clearInterval(clientInfo.metricsInterval);
            }

            this.connectedClients.delete(socket.id);
        }

        logger.info(`WebSocket client disconnected: ${socket.id} (${reason})`);
    }

    setupJobManagerListeners() {
        // Listen to job events from JobManager
        this.jobManager.on('jobCreated', (job) => {
            this.broadcastJobUpdate('created', job);
        });

        this.jobManager.on('jobStarted', (job) => {
            this.broadcastJobUpdate('started', job);
        });

        this.jobManager.on('jobProgress', (job, progress) => {
            this.broadcastJobUpdate('progress', job, { progress });
        });

        this.jobManager.on('jobCompleted', (job) => {
            this.broadcastJobUpdate('completed', job);
        });

        this.jobManager.on('jobFailed', (job, error) => {
            this.broadcastJobUpdate('failed', job, { error: error.message });
        });

        this.jobManager.on('jobCancelled', (job) => {
            this.broadcastJobUpdate('cancelled', job);
        });

        this.jobManager.on('jobPaused', (job) => {
            this.broadcastJobUpdate('paused', job);
        });

        this.jobManager.on('jobResumed', (job) => {
            this.broadcastJobUpdate('resumed', job);
        });

        this.jobManager.on('auditEvent', (auditEntry) => {
            this.broadcastAuditLog(auditEntry);
        });
    }

    broadcastJobUpdate(eventType, job, extra = {}) {
        const update = {
            type: eventType,
            job,
            timestamp: new Date().toISOString(),
            ...extra
        };

        // Broadcast to general job subscribers
        this.io.to(this.getJobsRoomName()).emit('job_update', update);

        // Broadcast to specific job subscribers
        this.io.to(`job_${job.job_id}`).emit('job_update', update);

        // Broadcast to job type subscribers
        this.io.to(`jobs_${job.job_type}`).emit('job_update', update);

        logger.info(`Broadcasted job ${eventType}: ${job.job_id}`);
    }

    broadcastAuditLog(auditEntry) {
        this.io.to('audit_logs').emit('audit_update', {
            type: 'new_log',
            log: auditEntry,
            timestamp: new Date().toISOString()
        });
    }

    getJobsRoomName(filters = {}) {
        if (filters.job_type) {
            return `jobs_${filters.job_type}`;
        }
        if (filters.status_filter) {
            return `jobs_status_${filters.status_filter}`;
        }
        return 'jobs_all';
    }

    // Public API methods
    getConnectedClientsCount() {
        return this.connectedClients.size;
    }

    getConnectionStats() {
        const stats = {
            total_connections: this.connectedClients.size,
            rooms: this.roomSubscriptions.size,
            clients_by_role: {},
            clients_by_agency: {}
        };

        this.connectedClients.forEach(client => {
            stats.clients_by_role[client.role] = (stats.clients_by_role[client.role] || 0) + 1;
            stats.clients_by_agency[client.agency] = (stats.clients_by_agency[client.agency] || 0) + 1;
        });

        return stats;
    }

    broadcastSystemNotification(message, level = 'info', targetRole = null) {
        const notification = {
            type: 'system_notification',
            message,
            level,
            timestamp: new Date().toISOString()
        };

        if (targetRole) {
            // Send to specific role
            this.connectedClients.forEach((client, socketId) => {
                if (client.role === targetRole) {
                    this.io.to(socketId).emit('system_notification', notification);
                }
            });
        } else {
            // Broadcast to all
            this.io.emit('system_notification', notification);
        }

        logger.info(`System notification broadcasted: ${message}`);
    }

    async shutdown() {
        logger.info('Shutting down WebSocket service...');
        
        // Notify all clients
        this.io.emit('server_shutdown', {
            message: 'Server is shutting down',
            timestamp: new Date().toISOString()
        });

        // Close all connections
        this.io.close();

        logger.info('WebSocket service shutdown complete');
    }
}

module.exports = WebSocketService;