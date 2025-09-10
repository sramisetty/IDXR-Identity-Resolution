// System Monitoring Page
function loadMonitoringPage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="space-y-6">
            <!-- Real-time Metrics -->
            <div class="stats-grid">
                <div class="stat-card info">
                    <div class="stat-header">
                        <span class="stat-title">CPU Usage</span>
                        <div class="stat-icon info">
                            <i class="fas fa-microchip"></i>
                        </div>
                    </div>
                    <div class="stat-value" id="cpuUsage">--</div>
                    <div class="stat-change" id="cpuTrend">
                        <span>Loading...</span>
                    </div>
                </div>

                <div class="stat-card success">
                    <div class="stat-header">
                        <span class="stat-title">Memory Usage</span>
                        <div class="stat-icon success">
                            <i class="fas fa-memory"></i>
                        </div>
                    </div>
                    <div class="stat-value" id="memoryUsage">--</div>
                    <div class="stat-change" id="memoryTrend">
                        <span>Loading...</span>
                    </div>
                </div>

                <div class="stat-card warning">
                    <div class="stat-header">
                        <span class="stat-title">Disk Usage</span>
                        <div class="stat-icon warning">
                            <i class="fas fa-hdd"></i>
                        </div>
                    </div>
                    <div class="stat-value" id="diskUsage">--</div>
                    <div class="stat-change" id="diskTrend">
                        <span>Loading...</span>
                    </div>
                </div>

                <div class="stat-card primary">
                    <div class="stat-header">
                        <span class="stat-title">Active Sessions</span>
                        <div class="stat-icon primary">
                            <i class="fas fa-users"></i>
                        </div>
                    </div>
                    <div class="stat-value" id="activeSessions">--</div>
                    <div class="stat-change" id="sessionsTrend">
                        <span>Loading...</span>
                    </div>
                </div>
            </div>

            <!-- Monitoring Charts -->
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">System Performance</h3>
                        <div class="flex items-center gap-2">
                            <button class="btn btn-sm btn-outline" onclick="pauseMonitoring()" id="pauseBtn">
                                <i class="fas fa-pause"></i>
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="refreshMonitoring()">
                                <i class="fas fa-refresh"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <canvas id="systemPerformanceChart" height="300"></canvas>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">API Response Times</h3>
                    </div>
                    <div class="card-body">
                        <canvas id="responseTimesChart" height="300"></canvas>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Request Volume</h3>
                    </div>
                    <div class="card-body">
                        <canvas id="requestVolumeChart" height="300"></canvas>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Error Rates</h3>
                    </div>
                    <div class="card-body">
                        <canvas id="errorRatesChart" height="300"></canvas>
                    </div>
                </div>
            </div>

            <!-- Service Status -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Service Health Status</h3>
                    <button class="btn btn-sm btn-primary" onclick="runHealthCheck()">
                        <i class="fas fa-heartbeat"></i>
                        Health Check
                    </button>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="serviceStatus">
                        <!-- Service status cards will be loaded here -->
                    </div>
                </div>
            </div>

            <!-- Alerts and Notifications -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Active Alerts</h3>
                        <span class="badge badge-danger" id="alertCount">0</span>
                    </div>
                    <div class="card-body">
                        <div id="activeAlerts">
                            <!-- Active alerts will be loaded here -->
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Recent Events</h3>
                    </div>
                    <div class="card-body">
                        <div id="recentEvents">
                            <!-- Recent events will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize monitoring
    initializeMonitoring();
}

let monitoringInterval;
let isPaused = false;

function initializeMonitoring() {
    setupMonitoringCharts();
    loadServiceStatus();
    loadActiveAlerts();
    loadRecentEvents();
    startRealTimeMonitoring();
}

function startRealTimeMonitoring() {
    updateRealTimeMetrics();
    monitoringInterval = setInterval(() => {
        if (!isPaused) {
            updateRealTimeMetrics();
            updateMonitoringCharts();
        }
    }, 5000); // Update every 5 seconds
}

function updateRealTimeMetrics() {
    // Generate realistic demo metrics
    const cpuUsage = (Math.random() * 30 + 45).toFixed(1); // 45-75%
    const memoryUsage = (Math.random() * 20 + 60).toFixed(1); // 60-80%
    const diskUsage = (Math.random() * 10 + 65).toFixed(1); // 65-75%
    const activeSessions = Math.floor(Math.random() * 50 + 20); // 20-70

    document.getElementById('cpuUsage').textContent = cpuUsage + '%';
    document.getElementById('memoryUsage').textContent = memoryUsage + '%';
    document.getElementById('diskUsage').textContent = diskUsage + '%';
    document.getElementById('activeSessions').textContent = activeSessions;

    // Update trends
    updateTrend('cpuTrend', cpuUsage, 70);
    updateTrend('memoryTrend', memoryUsage, 75);
    updateTrend('diskTrend', diskUsage, 80);
    updateTrend('sessionsTrend', activeSessions, 50);
}

function updateTrend(elementId, currentValue, threshold) {
    const element = document.getElementById(elementId);
    const isHigh = parseFloat(currentValue) > threshold;
    const change = (Math.random() * 5 - 2.5).toFixed(1); // -2.5 to +2.5
    
    element.innerHTML = `
        <i class="fas fa-arrow-${change > 0 ? 'up' : 'down'}"></i>
        <span>${Math.abs(change)}% ${change > 0 ? 'increase' : 'decrease'}</span>
    `;
    element.className = `stat-change ${isHigh ? 'negative' : 'positive'}`;
}

function setupMonitoringCharts() {
    setupSystemPerformanceChart();
    setupResponseTimesChart();
    setupRequestVolumeChart();
    setupErrorRatesChart();
}

function setupSystemPerformanceChart() {
    const ctx = document.getElementById('systemPerformanceChart').getContext('2d');
    
    const labels = Array.from({length: 20}, (_, i) => {
        const time = new Date(Date.now() - (19 - i) * 30000);
        return time.toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' });
    });

    chartInstances.systemPerformance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'CPU %',
                data: Array.from({length: 20}, () => Math.random() * 30 + 45),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.1
            }, {
                label: 'Memory %',
                data: Array.from({length: 20}, () => Math.random() * 20 + 60),
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            },
            animation: false
        }
    });
}

function setupResponseTimesChart() {
    const ctx = document.getElementById('responseTimesChart').getContext('2d');
    
    chartInstances.responseTimes = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['/api/resolve', '/api/statistics', '/api/health', '/api/reports', '/api/admin'],
            datasets: [{
                label: 'Avg Response Time (ms)',
                data: [45, 12, 8, 156, 89],
                backgroundColor: 'rgba(168, 85, 247, 0.6)',
                borderColor: 'rgb(168, 85, 247)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function setupRequestVolumeChart() {
    const ctx = document.getElementById('requestVolumeChart').getContext('2d');
    
    const labels = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    
    chartInstances.requestVolume = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Requests per Hour',
                data: [12, 8, 5, 3, 2, 4, 8, 15, 25, 35, 42, 48, 52, 49, 45, 42, 38, 35, 30, 25, 20, 18, 15, 14],
                borderColor: 'rgb(236, 72, 153)',
                backgroundColor: 'rgba(236, 72, 153, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function setupErrorRatesChart() {
    const ctx = document.getElementById('errorRatesChart').getContext('2d');
    
    chartInstances.errorRates = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['2xx Success', '4xx Client Error', '5xx Server Error'],
            datasets: [{
                data: [98.5, 1.2, 0.3],
                backgroundColor: [
                    'rgb(34, 197, 94)',
                    'rgb(245, 158, 11)',
                    'rgb(239, 68, 68)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateMonitoringCharts() {
    // Update system performance chart with new data
    if (chartInstances.systemPerformance) {
        const chart = chartInstances.systemPerformance;
        const newTime = new Date().toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' });
        
        chart.data.labels.shift();
        chart.data.labels.push(newTime);
        
        chart.data.datasets[0].data.shift();
        chart.data.datasets[0].data.push(Math.random() * 30 + 45);
        
        chart.data.datasets[1].data.shift();
        chart.data.datasets[1].data.push(Math.random() * 20 + 60);
        
        chart.update('none');
    }
}

function loadServiceStatus() {
    const container = document.getElementById('serviceStatus');
    
    const services = [
        { name: 'Matching Engine', status: 'healthy', uptime: '99.8%', responseTime: '45ms' },
        { name: 'Database', status: 'healthy', uptime: '99.9%', responseTime: '12ms' },
        { name: 'Redis Cache', status: 'healthy', uptime: '99.7%', responseTime: '3ms' },
        { name: 'API Gateway', status: 'warning', uptime: '98.5%', responseTime: '89ms' },
        { name: 'Authentication', status: 'healthy', uptime: '99.6%', responseTime: '25ms' },
        { name: 'External APIs', status: 'degraded', uptime: '95.2%', responseTime: '250ms' }
    ];

    container.innerHTML = services.map(service => `
        <div class="border rounded-lg p-4 ${getServiceStatusClass(service.status)}">
            <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium">${service.name}</h4>
                <span class="badge badge-${getStatusBadgeColor(service.status)}">${service.status}</span>
            </div>
            <div class="text-sm space-y-1">
                <div class="flex justify-between">
                    <span class="text-gray-600">Uptime:</span>
                    <span class="font-medium">${service.uptime}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Response:</span>
                    <span class="font-medium">${service.responseTime}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function getServiceStatusClass(status) {
    switch(status) {
        case 'healthy': return 'border-green-200 bg-green-50';
        case 'warning': return 'border-yellow-200 bg-yellow-50';
        case 'degraded': return 'border-red-200 bg-red-50';
        default: return 'border-gray-200 bg-gray-50';
    }
}

function getStatusBadgeColor(status) {
    switch(status) {
        case 'healthy': return 'success';
        case 'warning': return 'warning';
        case 'degraded': return 'danger';
        default: return 'secondary';
    }
}

function loadActiveAlerts() {
    const container = document.getElementById('activeAlerts');
    const alertCount = document.getElementById('alertCount');
    
    const alerts = [
        {
            level: 'warning',
            title: 'High Response Time',
            description: 'API Gateway response time above threshold',
            time: '5 minutes ago'
        },
        {
            level: 'critical',
            title: 'External Service Degraded',
            description: 'Address validation service not responding',
            time: '12 minutes ago'
        }
    ];

    alertCount.textContent = alerts.length;

    if (alerts.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-4">No active alerts</div>';
    } else {
        container.innerHTML = alerts.map(alert => `
            <div class="border-l-4 ${alert.level === 'critical' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'} p-3 mb-3">
                <div class="flex items-start">
                    <i class="fas fa-${alert.level === 'critical' ? 'exclamation-circle text-red-500' : 'exclamation-triangle text-yellow-500'} mt-1 mr-2"></i>
                    <div class="flex-1">
                        <div class="font-medium text-sm">${alert.title}</div>
                        <div class="text-sm text-gray-600">${alert.description}</div>
                        <div class="text-xs text-gray-500 mt-1">${alert.time}</div>
                    </div>
                    <button class="btn btn-sm btn-outline ml-2" onclick="acknowledgeAlert(this)">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
}

function loadRecentEvents() {
    const container = document.getElementById('recentEvents');
    
    const events = [
        {
            type: 'info',
            title: 'System restart completed',
            time: '1 hour ago'
        },
        {
            type: 'success',
            title: 'Database backup completed',
            time: '3 hours ago'
        },
        {
            type: 'warning',
            title: 'High memory usage detected',
            time: '5 hours ago'
        },
        {
            type: 'info',
            title: 'Configuration updated',
            time: '8 hours ago'
        }
    ];

    container.innerHTML = events.map(event => `
        <div class="flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0">
            <i class="fas fa-${getEventIcon(event.type)} text-${getEventColor(event.type)}-500"></i>
            <div class="flex-1">
                <div class="text-sm font-medium">${event.title}</div>
                <div class="text-xs text-gray-500">${event.time}</div>
            </div>
        </div>
    `).join('');
}

function getEventIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'warning': return 'exclamation-triangle';
        case 'error': return 'exclamation-circle';
        default: return 'info-circle';
    }
}

function getEventColor(type) {
    switch(type) {
        case 'success': return 'green';
        case 'warning': return 'yellow';
        case 'error': return 'red';
        default: return 'blue';
    }
}

function pauseMonitoring() {
    const btn = document.getElementById('pauseBtn');
    isPaused = !isPaused;
    
    if (isPaused) {
        btn.innerHTML = '<i class="fas fa-play"></i>';
        btn.title = 'Resume monitoring';
        showNotification('Monitoring paused', 'info');
    } else {
        btn.innerHTML = '<i class="fas fa-pause"></i>';
        btn.title = 'Pause monitoring';
        showNotification('Monitoring resumed', 'info');
    }
}

function refreshMonitoring() {
    updateRealTimeMetrics();
    loadServiceStatus();
    loadActiveAlerts();
    loadRecentEvents();
    showNotification('Monitoring data refreshed', 'success');
}

function runHealthCheck() {
    showNotification('Running comprehensive health check...', 'info');
    
    setTimeout(() => {
        loadServiceStatus();
        showNotification('Health check completed', 'success');
    }, 3000);
}

function acknowledgeAlert(button) {
    const alertDiv = button.closest('.border-l-4');
    alertDiv.style.opacity = '0.5';
    button.innerHTML = '<i class="fas fa-check text-green-500"></i>';
    button.disabled = true;
    
    showNotification('Alert acknowledged', 'success');
    
    setTimeout(() => {
        alertDiv.remove();
        loadActiveAlerts(); // Refresh alert count
    }, 2000);
}

function updateMonitoringMetrics() {
    updateRealTimeMetrics();
    updateMonitoringCharts();
}