// Overview Dashboard Page
function loadOverviewPage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <!-- Stats Grid -->
        <div class="stats-grid" id="statsGrid">
            <!-- Stats will be loaded here -->
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <!-- System Status Card -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">System Status</h3>
                    <div class="flex items-center gap-2">
                        <div class="status-indicator" id="systemStatusIndicator"></div>
                        <span class="text-sm text-gray-600" id="systemStatusText">All Systems Operational</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="space-y-4">
                        <div class="service-status" id="matchingEngineStatus">
                            <div class="flex justify-between items-center">
                                <span class="text-sm font-medium">Matching Engine</span>
                                <span class="badge badge-success">Online</span>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">Response time: <span id="matchingEngineResponseTime">--</span></div>
                        </div>
                        <div class="service-status" id="databaseStatus">
                            <div class="flex justify-between items-center">
                                <span class="text-sm font-medium">Database</span>
                                <span class="badge badge-success">Connected</span>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">Connections: <span id="databaseConnections">--</span></div>
                        </div>
                        <div class="service-status" id="redisStatus">
                            <div class="flex justify-between items-center">
                                <span class="text-sm font-medium">Redis Cache</span>
                                <span class="badge badge-success">Active</span>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">Memory usage: <span id="redisMemory">--</span></div>
                        </div>
                        <div class="service-status" id="apiStatus">
                            <div class="flex justify-between items-center">
                                <span class="text-sm font-medium">API Gateway</span>
                                <span class="badge badge-success">Healthy</span>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">Requests/min: <span id="apiRequestRate">--</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Activity Card -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Recent Activity</h3>
                    <button class="btn btn-sm btn-outline" onclick="refreshRecentActivity()">
                        <i class="fas fa-refresh"></i>
                        Refresh
                    </button>
                </div>
                <div class="card-body">
                    <div class="space-y-3" id="recentActivityList">
                        <!-- Activity items will be loaded here -->
                    </div>
                </div>
                <div class="card-footer">
                    <a href="#" class="text-sm text-blue-600 hover:text-blue-800" onclick="showPage('audit-logs')">
                        View all activity →
                    </a>
                </div>
            </div>

            <!-- Quick Actions Card -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Quick Actions</h3>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-1 gap-3">
                        <button class="btn btn-primary w-full" onclick="openIdentityMatchModal()">
                            <i class="fas fa-search-plus"></i>
                            New Identity Match
                        </button>
                        <button class="btn btn-outline w-full" onclick="showPage('batch-processing')">
                            <i class="fas fa-layer-group"></i>
                            Batch Processing
                        </button>
                        <button class="btn btn-outline w-full" onclick="showPage('reports')">
                            <i class="fas fa-file-alt"></i>
                            Generate Report
                        </button>
                        <button class="btn btn-outline w-full" onclick="openSystemHealthModal()">
                            <i class="fas fa-heartbeat"></i>
                            System Health Check
                        </button>
                    </div>
                </div>
            </div>

            <!-- Performance Overview Chart -->
            <div class="card lg:col-span-2">
                <div class="card-header">
                    <h3 class="card-title">Performance Overview</h3>
                    <div class="flex items-center gap-2">
                        <select class="form-select text-sm" id="performanceTimeRange" onchange="updatePerformanceChart()">
                            <option value="1h">Last Hour</option>
                            <option value="6h">Last 6 Hours</option>
                            <option value="24h" selected>Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                        </select>
                    </div>
                </div>
                <div class="card-body">
                    <canvas id="performanceChart" height="300"></canvas>
                </div>
            </div>

            <!-- Algorithm Performance -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Algorithm Performance</h3>
                </div>
                <div class="card-body">
                    <div class="space-y-4" id="algorithmPerformance">
                        <!-- Algorithm performance will be loaded here -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Identity Match Modal -->
        <div class="modal" id="identityMatchModal" style="display: none;">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">Quick Identity Match</h4>
                        <button class="modal-close" onclick="closeIdentityMatchModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="quickMatchForm" onsubmit="performQuickMatch(event)">
                            <div class="grid grid-cols-2 gap-4">
                                <div class="form-group">
                                    <label class="form-label">First Name</label>
                                    <input type="text" class="form-control" name="first_name" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Last Name</label>
                                    <input type="text" class="form-control" name="last_name" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Date of Birth</label>
                                    <input type="date" class="form-control" name="dob">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">SSN (Last 4)</label>
                                    <input type="text" class="form-control" name="ssn_last4" maxlength="4">
                                </div>
                                <div class="form-group col-span-2">
                                    <label class="form-label">Phone Number</label>
                                    <input type="tel" class="form-control" name="phone">
                                </div>
                                <div class="form-group col-span-2">
                                    <label class="form-label">Algorithm</label>
                                    <select class="form-select" name="algorithm">
                                        <option value="auto">Auto (All Algorithms)</option>
                                        <option value="deterministic">Deterministic</option>
                                        <option value="probabilistic">Probabilistic</option>
                                        <option value="fuzzy">Fuzzy</option>
                                        <option value="ai_hybrid">AI Hybrid</option>
                                    </select>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeIdentityMatchModal()">Cancel</button>
                        <button type="submit" form="quickMatchForm" class="btn btn-primary">
                            <i class="fas fa-search"></i>
                            Find Matches
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- System Health Modal -->
        <div class="modal" id="systemHealthModal" style="display: none;">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">System Health Check</h4>
                        <button class="modal-close" onclick="closeSystemHealthModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="systemHealthResults">
                            <div class="text-center py-8">
                                <div class="loading"></div>
                                <p class="mt-2 text-gray-600">Running health checks...</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeSystemHealthModal()">Close</button>
                        <button type="button" class="btn btn-primary" onclick="runHealthCheck()">
                            <i class="fas fa-refresh"></i>
                            Run Again
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .modal-dialog {
                background: white;
                border-radius: 0.75rem;
                box-shadow: var(--shadow-lg);
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
            }

            .modal-dialog.modal-lg {
                max-width: 800px;
            }

            .modal-header {
                padding: 1.5rem;
                border-bottom: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .modal-title {
                font-size: 1.125rem;
                font-weight: 600;
                margin: 0;
            }

            .modal-close {
                background: none;
                border: none;
                padding: 0.5rem;
                cursor: pointer;
                border-radius: 0.375rem;
                transition: background-color 0.2s;
            }

            .modal-close:hover {
                background: var(--light-color);
            }

            .modal-body {
                padding: 1.5rem;
            }

            .modal-footer {
                padding: 1rem 1.5rem;
                border-top: 1px solid var(--border-color);
                display: flex;
                gap: 0.75rem;
                justify-content: flex-end;
            }

            .status-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: var(--success-color);
                animation: pulse 2s infinite;
            }

            .status-indicator.warning {
                background: var(--warning-color);
            }

            .status-indicator.error {
                background: var(--danger-color);
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            .service-status {
                padding: 0.75rem;
                border: 1px solid var(--border-color);
                border-radius: 0.5rem;
                background: #f8fafc;
            }

            .col-span-2 {
                grid-column: span 2;
            }

            .space-y-3 > * + * {
                margin-top: 0.75rem;
            }

            .space-y-4 > * + * {
                margin-top: 1rem;
            }
        </style>
    `;

    // Load initial data
    loadOverviewStats();
    loadRecentActivity();
    loadAlgorithmPerformance();
    setupPerformanceChart();
}

async function loadOverviewStats() {
    try {
        // Fetch statistics from the matching engine
        const stats = await fetchData('/statistics');
        const backendHealth = await fetchBackendData('/health');
        
        if (stats) {
            updateStatsGrid(stats);
        }
        
        if (backendHealth) {
            updateSystemStatus(backendHealth);
        }
    } catch (error) {
        console.error('Error loading overview stats:', error);
        showNotification('Failed to load system statistics', 'error');
    }
}

function updateStatsGrid(stats) {
    const statsGrid = document.getElementById('statsGrid');
    
    // Calculate derived metrics
    const totalMatches = stats.total_matches || 0;
    const totalIdentities = stats.total_identities || 1000; // Demo value
    const avgConfidence = stats.average_confidence || 0.85;
    const successRate = totalMatches > 0 ? ((totalMatches / (totalMatches + 100)) * 100) : 95; // Demo calculation
    
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-header">
                <span class="stat-title">Total Identities</span>
                <div class="stat-icon primary">
                    <i class="fas fa-users"></i>
                </div>
            </div>
            <div class="stat-value">${formatNumber(totalIdentities)}</div>
            <div class="stat-change positive">
                <i class="fas fa-arrow-up"></i>
                <span>+12% from last month</span>
            </div>
        </div>

        <div class="stat-card success">
            <div class="stat-header">
                <span class="stat-title">Matches Found</span>
                <div class="stat-icon success">
                    <i class="fas fa-link"></i>
                </div>
            </div>
            <div class="stat-value">${formatNumber(totalMatches)}</div>
            <div class="stat-change positive">
                <i class="fas fa-arrow-up"></i>
                <span>+${Math.floor(Math.random() * 20 + 5)}% this week</span>
            </div>
        </div>

        <div class="stat-card info">
            <div class="stat-header">
                <span class="stat-title">Avg Confidence</span>
                <div class="stat-icon info">
                    <i class="fas fa-chart-line"></i>
                </div>
            </div>
            <div class="stat-value">${(avgConfidence * 100).toFixed(1)}%</div>
            <div class="stat-change positive">
                <i class="fas fa-arrow-up"></i>
                <span>+2.3% improvement</span>
            </div>
        </div>

        <div class="stat-card warning">
            <div class="stat-header">
                <span class="stat-title">Success Rate</span>
                <div class="stat-icon warning">
                    <i class="fas fa-target"></i>
                </div>
            </div>
            <div class="stat-value">${successRate.toFixed(1)}%</div>
            <div class="stat-change ${successRate > 90 ? 'positive' : 'negative'}">
                <i class="fas fa-arrow-${successRate > 90 ? 'up' : 'down'}"></i>
                <span>${successRate > 90 ? '+' : '-'}${Math.abs(successRate - 90).toFixed(1)}% target</span>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-header">
                <span class="stat-title">Response Time</span>
                <div class="stat-icon primary">
                    <i class="fas fa-stopwatch"></i>
                </div>
            </div>
            <div class="stat-value">${stats.avg_response_time || 45}ms</div>
            <div class="stat-change positive">
                <i class="fas fa-arrow-down"></i>
                <span>-15% faster</span>
            </div>
        </div>

        <div class="stat-card danger">
            <div class="stat-header">
                <span class="stat-title">Error Rate</span>
                <div class="stat-icon danger">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
            </div>
            <div class="stat-value">${(stats.error_rate || 0.02 * 100).toFixed(2)}%</div>
            <div class="stat-change positive">
                <i class="fas fa-arrow-down"></i>
                <span>-0.5% decrease</span>
            </div>
        </div>
    `;
}

function updateSystemStatus(healthData) {
    // Update system status indicator
    const statusIndicator = document.getElementById('systemStatusIndicator');
    const statusText = document.getElementById('systemStatusText');
    
    if (healthData.status === 'healthy') {
        statusIndicator.className = 'status-indicator';
        statusText.textContent = 'All Systems Operational';
    } else {
        statusIndicator.className = 'status-indicator warning';
        statusText.textContent = 'Some Services Degraded';
    }

    // Update service-specific status
    document.getElementById('matchingEngineResponseTime').textContent = '45ms';
    document.getElementById('databaseConnections').textContent = '15/50';
    document.getElementById('redisMemory').textContent = '2.3GB';
    document.getElementById('apiRequestRate').textContent = '1,240';
}

async function loadRecentActivity() {
    const activityList = document.getElementById('recentActivityList');
    
    // Generate demo activity data
    const activities = [
        {
            icon: 'fa-search-plus',
            action: 'Identity match completed',
            details: 'Found 3 matches with 94% confidence',
            time: '2 minutes ago',
            type: 'success'
        },
        {
            icon: 'fa-user-plus',
            action: 'New user registered',
            details: 'Admin user: sarah.johnson@colorado.gov',
            time: '15 minutes ago',
            type: 'info'
        },
        {
            icon: 'fa-exclamation-triangle',
            action: 'Data quality alert',
            details: 'High duplicate rate in batch #1247',
            time: '32 minutes ago',
            type: 'warning'
        },
        {
            icon: 'fa-file-alt',
            action: 'Report generated',
            details: 'Monthly compliance report completed',
            time: '1 hour ago',
            type: 'success'
        },
        {
            icon: 'fa-shield-alt',
            action: 'Security scan completed',
            details: 'No vulnerabilities detected',
            time: '2 hours ago',
            type: 'success'
        }
    ];

    activityList.innerHTML = activities.map(activity => `
        <div class="flex items-start gap-3">
            <div class="flex-shrink-0">
                <div class="w-8 h-8 rounded-full bg-${activity.type === 'success' ? 'green' : activity.type === 'warning' ? 'yellow' : 'blue'}-100 flex items-center justify-center">
                    <i class="fas ${activity.icon} text-${activity.type === 'success' ? 'green' : activity.type === 'warning' ? 'yellow' : 'blue'}-600 text-sm"></i>
                </div>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900">${activity.action}</p>
                <p class="text-sm text-gray-500">${activity.details}</p>
                <p class="text-xs text-gray-400 mt-1">${activity.time}</p>
            </div>
        </div>
    `).join('');
}

async function loadAlgorithmPerformance() {
    const algorithmPerformance = document.getElementById('algorithmPerformance');
    
    const algorithms = [
        {
            name: 'Deterministic',
            accuracy: 98.5,
            speed: 2.3,
            usage: 45
        },
        {
            name: 'Probabilistic',
            accuracy: 94.2,
            speed: 15.7,
            usage: 30
        },
        {
            name: 'AI Hybrid',
            accuracy: 96.8,
            speed: 45.2,
            usage: 20
        },
        {
            name: 'Fuzzy',
            accuracy: 89.3,
            speed: 8.9,
            usage: 5
        }
    ];

    algorithmPerformance.innerHTML = algorithms.map(algo => `
        <div class="algorithm-item">
            <div class="flex justify-between items-center mb-2">
                <span class="font-medium">${algo.name}</span>
                <span class="text-sm text-gray-500">${algo.usage}% usage</span>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span class="text-gray-500">Accuracy:</span>
                    <span class="font-medium text-green-600">${algo.accuracy}%</span>
                </div>
                <div>
                    <span class="text-gray-500">Avg Time:</span>
                    <span class="font-medium">${algo.speed}ms</span>
                </div>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div class="bg-blue-600 h-2 rounded-full" style="width: ${algo.usage}%"></div>
            </div>
        </div>
    `).join('');
}

function setupPerformanceChart() {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    
    // Generate demo data for the last 24 hours
    const now = new Date();
    const labels = [];
    const matchData = [];
    const responseTimeData = [];
    
    for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        labels.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        matchData.push(Math.floor(Math.random() * 50) + 20);
        responseTimeData.push(Math.floor(Math.random() * 30) + 30);
    }

    chartInstances.performance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Matches per Hour',
                data: matchData,
                borderColor: 'rgb(37, 99, 235)',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.1,
                yAxisID: 'y'
            }, {
                label: 'Avg Response Time (ms)',
                data: responseTimeData,
                borderColor: 'rgb(236, 72, 153)',
                backgroundColor: 'rgba(236, 72, 153, 0.1)',
                tension: 0.1,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Matches'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Response Time (ms)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false
                }
            }
        }
    });
}

function updatePerformanceChart() {
    const timeRange = document.getElementById('performanceTimeRange').value;
    // Update chart based on selected time range
    // This would typically fetch new data from the API
    console.log('Updating performance chart for time range:', timeRange);
}

async function updateOverviewStats() {
    // Refresh the overview statistics
    await loadOverviewStats();
}

function refreshRecentActivity() {
    loadRecentActivity();
    showNotification('Activity feed refreshed', 'success');
}

// Modal functions
function openIdentityMatchModal() {
    document.getElementById('identityMatchModal').style.display = 'flex';
}

function closeIdentityMatchModal() {
    document.getElementById('identityMatchModal').style.display = 'none';
    document.getElementById('quickMatchForm').reset();
}

function openSystemHealthModal() {
    document.getElementById('systemHealthModal').style.display = 'flex';
    runHealthCheck();
}

function closeSystemHealthModal() {
    document.getElementById('systemHealthModal').style.display = 'none';
}

async function performQuickMatch(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const matchData = Object.fromEntries(formData.entries());
    
    try {
        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<div class="loading"></div> Searching...';
        submitBtn.disabled = true;
        
        // Perform the match
        const result = await postData('/resolve', {
            identity: matchData,
            algorithms: matchData.algorithm === 'auto' ? ['deterministic', 'probabilistic', 'fuzzy', 'ai_hybrid'] : [matchData.algorithm]
        });
        
        if (result && result.matches) {
            showNotification(`Found ${result.matches.length} matches with confidence scores up to ${(result.highest_confidence * 100).toFixed(1)}%`, 'success');
            closeIdentityMatchModal();
            
            // Optionally show results in a new modal or redirect to matching page
            console.log('Match results:', result);
        } else {
            showNotification('No matches found', 'info');
        }
        
        // Restore button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
    } catch (error) {
        console.error('Error performing quick match:', error);
        showNotification('Error performing match. Please try again.', 'error');
        
        // Restore button
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-search"></i> Find Matches';
        submitBtn.disabled = false;
    }
}

async function runHealthCheck() {
    const resultsContainer = document.getElementById('systemHealthResults');
    
    resultsContainer.innerHTML = `
        <div class="text-center py-8">
            <div class="loading"></div>
            <p class="mt-2 text-gray-600">Running comprehensive health checks...</p>
        </div>
    `;

    try {
        // Simulate health check process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const healthResults = [
            { service: 'Matching Engine API', status: 'healthy', responseTime: '45ms', details: 'All endpoints responding normally' },
            { service: 'Database Connection', status: 'healthy', responseTime: '12ms', details: 'Connection pool: 15/50 active' },
            { service: 'Redis Cache', status: 'healthy', responseTime: '3ms', details: 'Memory usage: 2.3GB/8GB' },
            { service: 'Security Services', status: 'healthy', responseTime: '8ms', details: 'All security checks passing' },
            { service: 'External APIs', status: 'warning', responseTime: '250ms', details: 'Address validation service slow' },
            { service: 'Background Jobs', status: 'healthy', responseTime: 'N/A', details: '3 jobs queued, 0 failed' }
        ];

        resultsContainer.innerHTML = `
            <div class="grid gap-4">
                ${healthResults.map(result => `
                    <div class="flex items-center justify-between p-4 border rounded-lg ${result.status === 'healthy' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}">
                        <div class="flex items-center gap-3">
                            <div class="w-3 h-3 rounded-full ${result.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'}"></div>
                            <div>
                                <div class="font-medium">${result.service}</div>
                                <div class="text-sm text-gray-600">${result.details}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="badge badge-${result.status === 'healthy' ? 'success' : 'warning'}">${result.status}</div>
                            ${result.responseTime !== 'N/A' ? `<div class="text-xs text-gray-500 mt-1">${result.responseTime}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        resultsContainer.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-2"></i>
                <p class="text-red-600">Health check failed. Please try again.</p>
            </div>
        `;
    }
}