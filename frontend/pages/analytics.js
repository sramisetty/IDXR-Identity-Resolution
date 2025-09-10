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
            <div class="stats-grid">
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
    // Add small delay to ensure DOM is ready
    setTimeout(() => {
        setupAnalyticsCharts();
        loadAnalyticsTable();
    }, 100);
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
    const canvas = document.getElementById('algorithmEffectivenessChart');
    if (!canvas) {
        console.error('Algorithm Effectiveness chart canvas not found');
        return;
    }
    const ctx = canvas.getContext('2d');

    chartInstances.algorithmEffectiveness = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Accuracy', 'Speed', 'Confidence', 'Recall', 'Precision', 'F1-Score'],
            datasets: [{
                label: 'Deterministic',
                data: [95, 98, 92, 88, 94, 91],
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                pointBackgroundColor: 'rgb(34, 197, 94)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(34, 197, 94)'
            }, {
                label: 'Probabilistic',
                data: [88, 75, 85, 92, 87, 89],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                pointBackgroundColor: 'rgb(59, 130, 246)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(59, 130, 246)'
            }, {
                label: 'AI Hybrid',
                data: [92, 60, 95, 89, 93, 91],
                borderColor: 'rgb(236, 72, 153)',
                backgroundColor: 'rgba(236, 72, 153, 0.2)',
                pointBackgroundColor: 'rgb(236, 72, 153)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(236, 72, 153)'
            }, {
                label: 'Fuzzy Matching',
                data: [78, 85, 72, 75, 80, 77],
                borderColor: 'rgb(245, 158, 11)',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                pointBackgroundColor: 'rgb(245, 158, 11)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(245, 158, 11)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    },
                    pointLabels: {
                        font: {
                            size: 12
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.r + '%';
                        }
                    }
                }
            }
        }
    });
}

function setupDataQualityTrendsChart() {
    const canvas = document.getElementById('dataQualityTrendsChart');
    if (!canvas) {
        console.error('Data Quality Trends chart canvas not found');
        return;
    }
    const ctx = canvas.getContext('2d');

    // Generate more detailed timeline data
    const labels = [];
    const completenessData = [];
    const accuracyData = [];
    const consistencyData = [];
    const uniquenessData = [];
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        // Generate trending data with some variance
        completenessData.push(Math.max(85, Math.min(98, 92 + Math.random() * 6 - 3 + i * 0.1)));
        accuracyData.push(Math.max(82, Math.min(96, 88 + Math.random() * 4 - 2 + i * 0.08)));
        consistencyData.push(Math.max(80, Math.min(94, 85 + Math.random() * 5 - 2.5 + i * 0.12)));
        uniquenessData.push(Math.max(90, Math.min(99, 94 + Math.random() * 3 - 1.5)));
    }

    chartInstances.dataQualityTrends = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Completeness',
                data: completenessData,
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.2
            }, {
                label: 'Accuracy',
                data: accuracyData,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.2
            }, {
                label: 'Consistency',
                data: consistencyData,
                borderColor: 'rgb(168, 85, 247)',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                fill: true,
                tension: 0.2
            }, {
                label: 'Uniqueness',
                data: uniquenessData,
                borderColor: 'rgb(245, 158, 11)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.2
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
                y: {
                    min: 75,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Quality Score (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });
}

function setupUserActivityChart() {
    const canvas = document.getElementById('userActivityChart');
    if (!canvas) {
        console.error('User Activity chart canvas not found');
        return;
    }
    const ctx = canvas.getContext('2d');

    chartInstances.userActivity = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Search Queries',
                data: [245, 198, 267, 234, 201, 89, 67],
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1
            }, {
                label: 'Successful Matches',
                data: [156, 134, 189, 167, 145, 67, 45],
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 1
            }, {
                label: 'Manual Reviews',
                data: [23, 18, 34, 28, 22, 8, 5],
                backgroundColor: 'rgba(245, 158, 11, 0.8)',
                borderColor: 'rgb(245, 158, 11)',
                borderWidth: 1
            }, {
                label: 'API Calls',
                data: [89, 76, 102, 94, 81, 34, 28],
                backgroundColor: 'rgba(168, 85, 247, 0.8)',
                borderColor: 'rgb(168, 85, 247)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        afterLabel: function(context) {
                            if (context.datasetIndex === 0) {
                                const matches = context.chart.data.datasets[1].data[context.dataIndex];
                                const searches = context.parsed.y;
                                const rate = searches > 0 ? ((matches / searches) * 100).toFixed(1) : '0.0';
                                return `Success Rate: ${rate}%`;
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Activity Count'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Day of Week'
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
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
            trend: 'up',
            recall: 88.4,
            precision: 96.7,
            f1Score: 92.3,
            errorRate: 1.5,
            throughput: 4348
        },
        {
            name: 'Probabilistic',
            runs: 12867,
            successRate: 94.2,
            avgConfidence: 87.6,
            avgTime: 15.7,
            accuracy: 89.3,
            trend: 'up',
            recall: 92.1,
            precision: 86.8,
            f1Score: 89.4,
            errorRate: 5.8,
            throughput: 820
        },
        {
            name: 'AI Hybrid',
            runs: 8934,
            successRate: 96.8,
            avgConfidence: 91.4,
            avgTime: 45.2,
            accuracy: 93.1,
            trend: 'up',
            recall: 89.6,
            precision: 94.2,
            f1Score: 91.8,
            errorRate: 3.2,
            throughput: 221
        },
        {
            name: 'Fuzzy Matching',
            runs: 4523,
            successRate: 89.3,
            avgConfidence: 78.9,
            avgTime: 8.9,
            accuracy: 82.7,
            trend: 'stable',
            recall: 75.3,
            precision: 79.8,
            f1Score: 77.5,
            errorRate: 10.7,
            throughput: 1124
        },
        {
            name: 'Phonetic',
            runs: 2156,
            successRate: 76.4,
            avgConfidence: 65.2,
            avgTime: 3.1,
            accuracy: 71.9,
            trend: 'down',
            recall: 68.7,
            precision: 74.2,
            f1Score: 71.3,
            errorRate: 23.6,
            throughput: 3226
        }
    ];

    tableBody.innerHTML = algorithms.map(algo => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td>
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-${getAlgorithmColor(algo.name)}"></div>
                    <span class="font-medium">${algo.name}</span>
                </div>
            </td>
            <td class="text-sm">${formatNumber(algo.runs)}</td>
            <td>
                <span class="badge badge-${algo.successRate > 95 ? 'success' : algo.successRate > 90 ? 'warning' : 'danger'} text-xs">
                    ${algo.successRate}%
                </span>
            </td>
            <td class="text-sm">${algo.avgConfidence}%</td>
            <td class="text-sm font-mono">${algo.avgTime}ms</td>
            <td>
                <div class="flex items-center gap-2">
                    <div class="w-12 bg-gray-200 rounded-full h-1.5">
                        <div class="bg-blue-500 h-1.5 rounded-full transition-all" style="width: ${algo.accuracy}%"></div>
                    </div>
                    <span class="text-xs font-medium">${algo.accuracy}%</span>
                </div>
            </td>
            <td class="text-center">
                <div class="flex items-center justify-center">
                    <i class="fas fa-arrow-${algo.trend === 'stable' ? 'right' : algo.trend} text-${getTrendColor(algo.trend)} text-sm"></i>
                    <span class="ml-1 text-xs text-gray-500">${algo.trend === 'stable' ? 'Stable' : algo.trend === 'up' ? 'Up' : 'Down'}</span>
                </div>
            </td>
        </tr>
        <tr class="bg-gray-25 border-t-0">
            <td colspan="7" class="px-4 py-2">
                <div class="grid grid-cols-5 gap-4 text-xs text-gray-600">
                    <div>
                        <span class="font-medium">Recall:</span>
                        <span class="text-green-600 font-medium">${algo.recall}%</span>
                    </div>
                    <div>
                        <span class="font-medium">Precision:</span>
                        <span class="text-blue-600 font-medium">${algo.precision}%</span>
                    </div>
                    <div>
                        <span class="font-medium">F1-Score:</span>
                        <span class="text-purple-600 font-medium">${algo.f1Score}%</span>
                    </div>
                    <div>
                        <span class="font-medium">Error Rate:</span>
                        <span class="text-red-600 font-medium">${algo.errorRate}%</span>
                    </div>
                    <div>
                        <span class="font-medium">Throughput:</span>
                        <span class="text-orange-600 font-medium">${formatNumber(algo.throughput)}/hr</span>
                    </div>
                </div>
            </td>
        </tr>
    `).join('');
}

function getAlgorithmColor(name) {
    switch(name.toLowerCase()) {
        case 'deterministic': return 'green-500';
        case 'probabilistic': return 'blue-500';
        case 'ai hybrid': return 'pink-500';
        case 'fuzzy matching': return 'yellow-500';
        case 'phonetic': return 'gray-500';
        default: return 'gray-500';
    }
}

function getTrendColor(trend) {
    switch(trend) {
        case 'up': return 'green-500';
        case 'down': return 'red-500';
        case 'stable': return 'gray-500';
        default: return 'gray-500';
    }
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