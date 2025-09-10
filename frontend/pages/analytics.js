// Analytics Dashboard Page
function loadAnalyticsPage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="space-y-6">
            <!-- Analytics Controls -->
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <select class="form-select" id="analyticsTimeRange" onchange="updateAnalytics()">
                        <option value="7d">Last 7 Days</option>
                        <option value="30d" selected>Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                        <option value="1y">Last Year</option>
                    </select>
                    <select class="form-select" id="analyticsMetric" onchange="updateAnalytics()">
                        <option value="all">All Metrics</option>
                        <option value="performance">Performance</option>
                        <option value="accuracy">Accuracy</option>
                        <option value="usage">Usage</option>
                    </select>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-outline" onclick="exportAnalytics()">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <button class="btn btn-primary" onclick="refreshAnalytics()">
                        <i class="fas fa-refresh"></i> Refresh
                    </button>
                </div>
            </div>

            <!-- Key Performance Indicators -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="stat-card success">
                    <div class="stat-header">
                        <span class="stat-title">Match Success Rate</span>
                        <div class="stat-icon success">
                            <i class="fas fa-bullseye"></i>
                        </div>
                    </div>
                    <div class="stat-value">94.2%</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>+2.1% vs last period</span>
                    </div>
                </div>

                <div class="stat-card info">
                    <div class="stat-header">
                        <span class="stat-title">Avg Confidence Score</span>
                        <div class="stat-icon info">
                            <i class="fas fa-chart-line"></i>
                        </div>
                    </div>
                    <div class="stat-value">87.5%</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>+1.8% improvement</span>
                    </div>
                </div>

                <div class="stat-card primary">
                    <div class="stat-header">
                        <span class="stat-title">Processing Speed</span>
                        <div class="stat-icon primary">
                            <i class="fas fa-tachometer-alt"></i>
                        </div>
                    </div>
                    <div class="stat-value">45ms</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-down"></i>
                        <span>-12ms faster</span>
                    </div>
                </div>

                <div class="stat-card warning">
                    <div class="stat-header">
                        <span class="stat-title">Manual Reviews</span>
                        <div class="stat-icon warning">
                            <i class="fas fa-eye"></i>
                        </div>
                    </div>
                    <div class="stat-value">5.8%</div>
                    <div class="stat-change negative">
                        <i class="fas fa-arrow-down"></i>
                        <span>-1.2% fewer reviews</span>
                    </div>
                </div>
            </div>

            <!-- Main Analytics Charts -->
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Matching Performance Trends</h3>
                    </div>
                    <div class="card-body">
                        <canvas id="performanceTrendsChart" height="300"></canvas>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Algorithm Effectiveness</h3>
                    </div>
                    <div class="card-body">
                        <canvas id="algorithmEffectivenessChart" height="300"></canvas>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Data Quality Trends</h3>
                    </div>
                    <div class="card-body">
                        <canvas id="dataQualityTrendsChart" height="300"></canvas>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">User Activity Patterns</h3>
                    </div>
                    <div class="card-body">
                        <canvas id="userActivityChart" height="300"></canvas>
                    </div>
                </div>
            </div>

            <!-- Detailed Analytics Table -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Detailed Performance Metrics</h3>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Algorithm</th>
                                    <th>Total Runs</th>
                                    <th>Success Rate</th>
                                    <th>Avg Confidence</th>
                                    <th>Avg Time (ms)</th>
                                    <th>Accuracy Score</th>
                                    <th>Trend</th>
                                </tr>
                            </thead>
                            <tbody id="analyticsTableBody">
                                <!-- Analytics data will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize analytics
    initializeAnalytics();
}

function initializeAnalytics() {
    setupAnalyticsCharts();
    loadAnalyticsTable();
}

function setupAnalyticsCharts() {
    setupPerformanceTrendsChart();
    setupAlgorithmEffectivenessChart();
    setupDataQualityTrendsChart();
    setupUserActivityChart();
}

function setupPerformanceTrendsChart() {
    const ctx = document.getElementById('performanceTrendsChart').getContext('2d');
    
    const labels = Array.from({length: 30}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    chartInstances.performanceTrends = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Success Rate (%)',
                data: Array.from({length: 30}, () => Math.random() * 5 + 90),
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                yAxisID: 'y'
            }, {
                label: 'Avg Response Time (ms)',
                data: Array.from({length: 30}, () => Math.random() * 20 + 35),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    min: 85,
                    max: 100
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    min: 0,
                    max: 100,
                    grid: {
                        drawOnChartArea: false,
                    }
                }
            }
        }
    });
}

function setupAlgorithmEffectivenessChart() {
    const ctx = document.getElementById('algorithmEffectivenessChart').getContext('2d');

    chartInstances.algorithmEffectiveness = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Accuracy', 'Speed', 'Confidence', 'Recall', 'Precision', 'F1-Score'],
            datasets: [{
                label: 'Deterministic',
                data: [95, 98, 92, 88, 94, 91],
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.2)'
            }, {
                label: 'Probabilistic',
                data: [88, 75, 85, 92, 87, 89],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.2)'
            }, {
                label: 'AI Hybrid',
                data: [92, 60, 95, 89, 93, 91],
                borderColor: 'rgb(236, 72, 153)',
                backgroundColor: 'rgba(236, 72, 153, 0.2)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: 0,
                    max: 100
                }
            }
        }
    });
}

function setupDataQualityTrendsChart() {
    const ctx = document.getElementById('dataQualityTrendsChart').getContext('2d');

    chartInstances.dataQualityTrends = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Completeness',
                data: [92, 94, 93, 95],
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)'
            }, {
                label: 'Accuracy',
                data: [88, 89, 91, 90],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
            }, {
                label: 'Consistency',
                data: [85, 87, 88, 89],
                borderColor: 'rgb(168, 85, 247)',
                backgroundColor: 'rgba(168, 85, 247, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 80,
                    max: 100
                }
            }
        }
    });
}

function setupUserActivityChart() {
    const ctx = document.getElementById('userActivityChart').getContext('2d');

    chartInstances.userActivity = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Searches',
                data: [245, 198, 267, 234, 201, 89, 67],
                backgroundColor: 'rgba(59, 130, 246, 0.6)'
            }, {
                label: 'Matches',
                data: [156, 134, 189, 167, 145, 67, 45],
                backgroundColor: 'rgba(34, 197, 94, 0.6)'
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

function loadAnalyticsTable() {
    const tableBody = document.getElementById('analyticsTableBody');
    
    const algorithms = [
        {
            name: 'Deterministic',
            runs: 15420,
            successRate: 98.5,
            avgConfidence: 94.2,
            avgTime: 2.3,
            accuracy: 95.8,
            trend: 'up'
        },
        {
            name: 'Probabilistic',
            runs: 12867,
            successRate: 94.2,
            avgConfidence: 87.6,
            avgTime: 15.7,
            accuracy: 89.3,
            trend: 'up'
        },
        {
            name: 'AI Hybrid',
            runs: 8934,
            successRate: 96.8,
            avgConfidence: 91.4,
            avgTime: 45.2,
            accuracy: 93.1,
            trend: 'up'
        },
        {
            name: 'Fuzzy',
            runs: 4523,
            successRate: 89.3,
            avgConfidence: 78.9,
            avgTime: 8.9,
            accuracy: 82.7,
            trend: 'down'
        }
    ];

    tableBody.innerHTML = algorithms.map(algo => `
        <tr>
            <td>
                <span class="algorithm-badge ${algo.name.toLowerCase().replace(' ', '_')}">${algo.name}</span>
            </td>
            <td>${formatNumber(algo.runs)}</td>
            <td>
                <span class="badge badge-${algo.successRate > 95 ? 'success' : algo.successRate > 90 ? 'warning' : 'danger'}">
                    ${algo.successRate}%
                </span>
            </td>
            <td>${algo.avgConfidence}%</td>
            <td>${algo.avgTime}ms</td>
            <td>
                <div class="flex items-center gap-2">
                    <div class="w-16 bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${algo.accuracy}%"></div>
                    </div>
                    <span class="text-sm">${algo.accuracy}%</span>
                </div>
            </td>
            <td>
                <i class="fas fa-arrow-${algo.trend} text-${algo.trend === 'up' ? 'green' : 'red'}-500"></i>
            </td>
        </tr>
    `).join('');
}

function updateAnalytics() {
    const timeRange = document.getElementById('analyticsTimeRange').value;
    const metric = document.getElementById('analyticsMetric').value;
    
    showNotification(`Updating analytics for ${timeRange} (${metric})...`, 'info');
    
    // Simulate data update
    setTimeout(() => {
        // Update charts with new data based on selections
        updateAnalyticsCharts(timeRange, metric);
        loadAnalyticsTable();
        showNotification('Analytics updated', 'success');
    }, 1000);
}

function updateAnalyticsCharts(timeRange, metric) {
    // Update chart data based on time range and metric filter
    // This would typically fetch new data from the API
    console.log('Updating analytics charts:', timeRange, metric);
}

function refreshAnalytics() {
    showNotification('Refreshing analytics data...', 'info');
    
    setTimeout(() => {
        loadAnalyticsTable();
        // Refresh charts
        Object.values(chartInstances).forEach(chart => {
            if (chart && chart.update) {
                chart.update();
            }
        });
        showNotification('Analytics refreshed', 'success');
    }, 1500);
}

function exportAnalytics() {
    showNotification('Exporting analytics data...', 'info');
    
    // Generate CSV export
    const data = [
        ['Algorithm', 'Total Runs', 'Success Rate', 'Avg Confidence', 'Avg Time', 'Accuracy'],
        ['Deterministic', '15420', '98.5%', '94.2%', '2.3ms', '95.8%'],
        ['Probabilistic', '12867', '94.2%', '87.6%', '15.7ms', '89.3%'],
        ['AI Hybrid', '8934', '96.8%', '91.4%', '45.2ms', '93.1%'],
        ['Fuzzy', '4523', '89.3%', '78.9%', '8.9ms', '82.7%']
    ];
    
    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `idxr_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Analytics exported successfully', 'success');
}