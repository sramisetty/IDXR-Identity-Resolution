/**
 * WebSocket Client for IDXR Real-time Updates
 * Handles job updates, system notifications, and audit logs
 */

class IDXRWebSocketClient {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 5000; // 5 seconds
        this.eventHandlers = new Map();
        this.subscriptions = new Set();
        this.connectionState = 'disconnected';
        this.autoReconnect = true;
        
        // Bind methods to preserve context
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.handleConnectionError = this.handleConnectionError.bind(this);
        this.handleReconnect = this.handleReconnect.bind(this);
    }

    /**
     * Connect to WebSocket server
     */
    async connect() {
        if (this.socket && this.socket.connected) {
            console.log('WebSocket already connected');
            return;
        }

        try {
            // Determine WebSocket URL based on environment
            const wsUrl = await this.getWebSocketURL();
            
            // If URL is null, fallback mode was already enabled
            if (wsUrl === null) {
                console.log('Skipping WebSocket connection attempt - using fallback mode');
                return;
            }
            
            // Load Socket.IO from CDN if not already loaded
            if (typeof io === 'undefined') {
                await this.loadSocketIO();
            }

            const token = localStorage.getItem('auth_token') || 'demo';
            console.log('Attempting WebSocket connection to:', wsUrl);
            
            this.socket = io(wsUrl, {
                path: '/websocket/socket.io/',
                auth: {
                    token: token
                },
                transports: ['websocket', 'polling'],
                timeout: 10000,
                forceNew: true,
                reconnection: true,
                reconnectionDelay: 2000,
                reconnectionDelayMax: 10000,
                maxReconnectionAttempts: 5
            });

            this.setupEventHandlers();
            this.connectionState = 'connecting';
            
            console.log('Connecting to WebSocket server...');
            
        } catch (error) {
            console.error('Failed to connect to WebSocket:', error);
            this.connectionState = 'error';
            this.notifyHandlers('connection_error', { error: error.message });
            this.enableFallbackMode();
        }
    }

    /**
     * Determine the appropriate WebSocket URL
     */
    async getWebSocketURL() {
        const currentHost = window.location.hostname;
        const currentProtocol = window.location.protocol;
        const currentPort = window.location.port;
        
        // For production domain, use HTTPS nginx proxy
        if (currentHost === 'idxr.ramisetty.net') {
            console.log(`Production domain detected - using nginx proxy for WebSocket`);
            
            // Use nginx proxy with HTTPS
            const proxyUrl = `https://${currentHost}`;
            
            console.log(`Testing nginx proxy WebSocket at: ${proxyUrl}`);
            const isProxyAvailable = await this.checkServerHealth(proxyUrl);
            
            if (isProxyAvailable) {
                console.log(`Nginx proxy WebSocket available at: ${proxyUrl}`);
                return proxyUrl;
            } else {
                console.log('Nginx proxy WebSocket not available, enabling fallback mode');
                setTimeout(() => this.enableFallbackMode(), 100);
                return null;
            }
        }
        
        // For local development, build smart URL list
        const possibleUrls = [];
        
        // Add current host/port if available
        if (currentPort && currentPort !== '80' && currentPort !== '443') {
            possibleUrls.push(`${currentProtocol}//${currentHost}:${currentPort}`);
        }
        
        // Add common development URLs
        const commonPorts = [3000, 3001, 8000, 8080];
        const hosts = ['localhost', '127.0.0.1', currentHost];
        
        for (const host of hosts) {
            for (const port of commonPorts) {
                const url = `http://${host}:${port}`;
                if (!possibleUrls.includes(url)) {
                    possibleUrls.push(url);
                }
            }
        }
        
        // Test URLs and return the first working one
        for (const url of possibleUrls) {
            const isAvailable = await this.checkServerHealth(url);
            if (isAvailable) {
                console.log(`WebSocket server found at: ${url}`);
                return url;
            }
        }
        
        console.log('No WebSocket server found, enabling fallback mode');
        setTimeout(() => this.enableFallbackMode(), 100);
        return null;
    }

    /**
     * Check if WebSocket server is available at URL
     */
    async checkServerHealth(url) {
        try {
            // Respect current protocol (HTTP/HTTPS)
            let healthUrl;
            if (url.startsWith('wss://')) {
                healthUrl = url.replace(/^wss:\/\//, 'https://') + '/api/v1/health';
            } else if (url.startsWith('ws://')) {
                healthUrl = url.replace(/^ws:\/\//, 'http://') + '/api/v1/health';
            } else if (url.startsWith('https://')) {
                healthUrl = url + '/api/v1/health';
            } else {
                healthUrl = url + '/api/v1/health';
            }
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
            
            const response = await fetch(healthUrl, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                return data.status === 'healthy' || data.status === 'ok';
            }
            
            return false;
        } catch (error) {
            // Silently fail for server health checks
            return false;
        }
    }

    /**
     * Load Socket.IO library from CDN
     */
    async loadSocketIO() {
        return new Promise((resolve, reject) => {
            if (typeof io !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.8.1/socket.io.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Socket.IO library'));
            document.head.appendChild(script);
        });
    }

    /**
     * Setup WebSocket event handlers
     */
    setupEventHandlers() {
        if (!this.socket) return;

        // Connection events
        this.socket.on('connect', () => {
            console.log('WebSocket connected:', this.socket.id);
            this.connectionState = 'connected';
            this.reconnectAttempts = 0;
            this.notifyHandlers('connected', { clientId: this.socket.id });
            
            // Restore subscriptions after reconnect
            this.restoreSubscriptions();
        });

        this.socket.on('connected', (data) => {
            console.log('Server confirmed connection:', data);
            this.notifyHandlers('server_connected', data);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('WebSocket disconnected:', reason);
            this.connectionState = 'disconnected';
            this.notifyHandlers('disconnected', { reason });
            
            if (this.autoReconnect && reason !== 'io client disconnect') {
                this.handleReconnect();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            this.handleConnectionError(error);
        });

        // Job update events
        this.socket.on('job_update', (data) => {
            console.log('Job update received:', data);
            this.notifyHandlers('job_update', data);
        });

        this.socket.on('jobs_snapshot', (data) => {
            console.log('Jobs snapshot received:', data);
            this.notifyHandlers('jobs_snapshot', data);
        });

        this.socket.on('job_status_response', (data) => {
            this.notifyHandlers('job_status', data);
        });

        // Queue statistics
        this.socket.on('queue_stats_response', (data) => {
            this.notifyHandlers('queue_stats', data);
        });

        // Metrics updates
        this.socket.on('metrics_update', (data) => {
            this.notifyHandlers('metrics_update', data);
        });

        // Audit logs
        this.socket.on('audit_update', (data) => {
            this.notifyHandlers('audit_update', data);
        });

        // System notifications
        this.socket.on('system_notification', (data) => {
            console.log('System notification:', data);
            this.notifyHandlers('system_notification', data);
            this.showSystemNotification(data);
        });

        // Subscription confirmations
        this.socket.on('subscription_confirmed', (data) => {
            console.log('Subscription confirmed:', data);
            this.subscriptions.add(data.type);
            this.notifyHandlers('subscription_confirmed', data);
        });

        this.socket.on('unsubscribed', (data) => {
            console.log('Unsubscribed:', data);
            if (data.type === 'all') {
                this.subscriptions.clear();
            } else {
                this.subscriptions.delete(data.type);
            }
            this.notifyHandlers('unsubscribed', data);
        });

        // Server shutdown
        this.socket.on('server_shutdown', (data) => {
            console.warn('Server shutdown notification:', data);
            this.autoReconnect = false;
            this.notifyHandlers('server_shutdown', data);
        });

        // Pong response
        this.socket.on('pong', (data) => {
            this.notifyHandlers('pong', data);
        });
    }

    /**
     * Handle connection errors
     */
    handleConnectionError(error) {
        console.warn('WebSocket connection error:', error.message);
        this.connectionState = 'error';
        this.notifyHandlers('connection_error', { error: error.message });
        
        // Try fallback mode if reconnection fails
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnection attempts reached, enabling fallback mode');
            this.enableFallbackMode();
        } else if (this.autoReconnect) {
            this.handleReconnect();
        }
    }

    /**
     * Enable fallback mode when WebSocket is unavailable
     */
    enableFallbackMode() {
        console.log('WebSocket unavailable - enabling fallback mode with polling');
        this.connectionState = 'fallback';
        this.autoReconnect = false;
        
        // Notify handlers that we're in fallback mode
        this.notifyHandlers('fallback_mode_enabled', { 
            message: 'Real-time updates unavailable, using polling fallback' 
        });
        
        // Show user notification
        this.showFallbackNotification();
        
        // Start polling for updates instead of real-time WebSocket
        this.startPollingFallback();
    }

    /**
     * Show fallback notification to user
     */
    showFallbackNotification() {
        // Only show notification in development, not production
        const currentHost = window.location.hostname;
        if (currentHost === 'idxr.ramisetty.net') {
            // Production - don't show notification as fallback is expected
            console.log('Running in fallback mode - periodic data refresh enabled');
            return;
        }
        
        const notification = {
            level: 'info',
            message: 'Real-time updates temporarily unavailable. Data will refresh periodically.',
            timestamp: new Date().toISOString()
        };
        
        this.showSystemNotification(notification);
    }

    /**
     * Start polling fallback for when WebSocket is unavailable
     */
    startPollingFallback() {
        // Poll for job updates every 30 seconds (less aggressive to avoid rate limits)
        this.fallbackInterval = setInterval(() => {
            this.pollForUpdates();
        }, 30000);
        
        console.log('Fallback polling started - checking for updates every 30 seconds');
        
        // Do an initial poll after a short delay
        setTimeout(() => this.pollForUpdates(), 2000);
    }

    /**
     * Poll for updates when WebSocket is unavailable
     */
    async pollForUpdates() {
        try {
            // Poll for active jobs
            const response = await fetch('/api/v1/batch/jobs?status=running');
            
            // Handle rate limiting
            if (response.status === 429) {
                console.warn('Rate limit reached, slowing down polling');
                // Double the polling interval if we're being rate limited
                if (this.fallbackInterval) {
                    clearInterval(this.fallbackInterval);
                    this.fallbackInterval = setInterval(() => {
                        this.pollForUpdates();
                    }, 60000); // Increase to 60 seconds
                }
                return;
            }
            
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success') {
                    this.notifyHandlers('jobs_snapshot', {
                        jobs: data.jobs,
                        total: data.total,
                        source: 'polling'
                    });
                }
            }
            
            // Poll for queue statistics with delay to avoid rate limits
            setTimeout(async () => {
                try {
                    const statsResponse = await fetch('/api/v1/batch/queue/statistics');
                    if (statsResponse.ok) {
                        const statsData = await statsResponse.json();
                        if (statsData.status === 'success') {
                            this.notifyHandlers('queue_stats', {
                                statistics: statsData.statistics,
                                source: 'polling'
                            });
                        }
                    }
                } catch (error) {
                    console.warn('Error fetching queue statistics:', error);
                }
            }, 1000); // Add 1 second delay between requests
            
        } catch (error) {
            console.warn('Polling fallback error:', error);
            // Continue polling even if individual requests fail
        }
    }

    /**
     * Stop fallback polling
     */
    stopPollingFallback() {
        if (this.fallbackInterval) {
            clearInterval(this.fallbackInterval);
            this.fallbackInterval = null;
            console.log('Fallback polling stopped');
        }
    }

    /**
     * Handle reconnection logic
     */
    handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this.connectionState = 'failed';
            this.notifyHandlers('reconnect_failed', { 
                attempts: this.reconnectAttempts 
            });
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectInterval * this.reconnectAttempts;
        
        console.log(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
        
        setTimeout(() => {
            if (this.autoReconnect && this.connectionState !== 'connected') {
                this.connect();
            }
        }, delay);
    }

    /**
     * Restore subscriptions after reconnect
     */
    restoreSubscriptions() {
        if (this.subscriptions.has('jobs')) {
            this.subscribeToJobs();
        }
        if (this.subscriptions.has('audit_logs')) {
            this.subscribeToAuditLogs();
        }
        if (this.subscriptions.has('system_metrics')) {
            this.subscribeToMetrics();
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
        this.autoReconnect = false;
        
        // Stop fallback polling
        this.stopPollingFallback();
        
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        this.connectionState = 'disconnected';
        this.subscriptions.clear();
        console.log('WebSocket manually disconnected');
    }

    /**
     * Subscribe to job updates
     */
    subscribeToJobs(filters = {}) {
        if (!this.isRealTimeConnected()) {
            console.warn('Cannot subscribe to jobs: WebSocket not connected, using fallback mode');
            return;
        }
        
        this.socket.emit('subscribe_jobs', { filters });
        console.log('Subscribed to job updates with filters:', filters);
    }

    /**
     * Subscribe to specific job updates
     */
    subscribeToJob(jobId) {
        if (!this.isRealTimeConnected()) {
            console.warn('Cannot subscribe to job: WebSocket not connected, using fallback mode');
            return;
        }
        
        this.socket.emit('subscribe_job', { jobId });
        console.log('Subscribed to job:', jobId);
    }

    /**
     * Unsubscribe from job updates
     */
    unsubscribeFromJobs() {
        if (!this.isRealTimeConnected()) {
            console.warn('Cannot unsubscribe from jobs: WebSocket not connected, using fallback mode');
            return;
        }
        
        this.socket.emit('unsubscribe_jobs');
        console.log('Unsubscribed from job updates');
    }

    /**
     * Subscribe to audit logs
     */
    subscribeToAuditLogs(filters = {}) {
        if (!this.isRealTimeConnected()) {
            console.warn('Cannot subscribe to audit logs: WebSocket not connected, using fallback mode');
            return;
        }
        
        this.socket.emit('subscribe_audit', { filters });
        console.log('Subscribed to audit logs');
    }

    /**
     * Subscribe to system metrics
     */
    subscribeToMetrics() {
        if (!this.isRealTimeConnected()) {
            console.warn('Cannot subscribe to metrics: WebSocket not connected, using fallback mode');
            return;
        }
        
        this.socket.emit('subscribe_metrics');
        console.log('Subscribed to system metrics');
    }

    /**
     * Request current job status
     */
    requestJobStatus(jobId) {
        if (!this.isRealTimeConnected()) {
            console.warn('Cannot request job status: WebSocket not connected, using fallback mode');
            return;
        }
        
        this.socket.emit('request_job_status', { jobId });
    }

    /**
     * Request queue statistics
     */
    requestQueueStats() {
        if (!this.isRealTimeConnected()) {
            console.warn('Cannot request queue stats: WebSocket not connected, using fallback mode');
            return;
        }
        
        this.socket.emit('request_queue_stats');
    }

    /**
     * Send ping to server
     */
    ping() {
        if (!this.isRealTimeConnected()) {
            console.warn('Cannot ping: WebSocket not connected, using fallback mode');
            return;
        }
        
        this.socket.emit('ping', (response) => {
            console.log('Ping response:', response);
        });
    }

    /**
     * Check if WebSocket is connected or in fallback mode
     */
    isConnected() {
        return (this.socket && this.socket.connected && this.connectionState === 'connected') ||
               this.connectionState === 'fallback';
    }

    /**
     * Check if WebSocket is actually connected (not fallback)
     */
    isRealTimeConnected() {
        return this.socket && this.socket.connected && this.connectionState === 'connected';
    }

    /**
     * Get connection state
     */
    getConnectionState() {
        return {
            state: this.connectionState,
            clientId: this.socket ? this.socket.id : null,
            connected: this.isConnected(),
            realTimeConnected: this.isRealTimeConnected(),
            reconnectAttempts: this.reconnectAttempts,
            subscriptions: Array.from(this.subscriptions),
            fallbackMode: this.connectionState === 'fallback',
            pollingActive: this.fallbackInterval !== null
        };
    }

    /**
     * Register event handler
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);
    }

    /**
     * Unregister event handler
     */
    off(event, handler) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).delete(handler);
        }
    }

    /**
     * Notify event handlers
     */
    notifyHandlers(event, data) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in ${event} handler:`, error);
                }
            });
        }
    }

    /**
     * Show system notification in UI
     */
    showSystemNotification(notification) {
        // Create a simple notification popup
        const notificationEl = document.createElement('div');
        notificationEl.className = `notification notification-${notification.level}`;
        notificationEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(notification.level)};
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            max-width: 300px;
            font-size: 14px;
        `;
        notificationEl.textContent = notification.message;

        document.body.appendChild(notificationEl);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notificationEl.parentNode) {
                notificationEl.parentNode.removeChild(notificationEl);
            }
        }, 5000);
    }

    /**
     * Get notification color based on level
     */
    getNotificationColor(level) {
        switch (level) {
            case 'error': return '#dc3545';
            case 'warning': return '#ffc107';
            case 'success': return '#28a745';
            case 'info':
            default: return '#17a2b8';
        }
    }

    /**
     * Start periodic connection health check
     */
    startHealthCheck(interval = 30000) {
        setInterval(() => {
            if (this.isConnected()) {
                this.ping();
            }
        }, interval);
    }
}

// Global WebSocket client instance
window.IDXRWebSocket = window.IDXRWebSocket || new IDXRWebSocketClient();

// Auto-connect when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Auto-connecting to WebSocket...');
    window.IDXRWebSocket.connect();
    window.IDXRWebSocket.startHealthCheck();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IDXRWebSocketClient;
}