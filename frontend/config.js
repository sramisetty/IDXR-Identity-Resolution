// Configuration for IDXR Frontend
window.IDXR_CONFIG = {
    // Detect environment
    isProduction: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1',
    
    // API Base URLs
    getApiBaseUrl: function() {
        if (this.isProduction) {
            return '/api/v1';  // Use nginx proxy in production
        } else {
            return 'http://localhost:3001/api/v1';  // Direct to Node.js in development
        }
    },
    
    // WebSocket URL
    getWebSocketUrl: function() {
        if (this.isProduction) {
            return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/websocket/socket.io/`;
        } else {
            return 'ws://localhost:3001/websocket/socket.io/';
        }
    },
    
    // Current environment info
    environment: function() {
        return {
            hostname: window.location.hostname,
            port: window.location.port,
            protocol: window.location.protocol,
            isProduction: this.isProduction,
            apiBaseUrl: this.getApiBaseUrl(),
            webSocketUrl: this.getWebSocketUrl()
        };
    }
};

// Log configuration for debugging
console.log('IDXR Configuration:', window.IDXR_CONFIG.environment());