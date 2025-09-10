// Reports and Analytics Page
function loadReportsPage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="space-y-6">
            <!-- Report Controls -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Report Generator</h3>
                    <div class="flex items-center gap-2">
                        <button class="btn btn-sm btn-outline" onclick="loadReportTemplates()">
                            <i class="fas fa-templates"></i>
                            Templates
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="generateReport()">
                            <i class="fas fa-chart-bar"></i>
                            Generate Report
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <form id="reportForm">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div class="form-group">
                                <label class="form-label">Report Type</label>
                                <select class="form-select" name="report_type" onchange="updateReportOptions()">
                                    <option value="executive_summary">Executive Summary</option>
                                    <option value="matching_performance">Matching Performance</option>
                                    <option value="data_quality">Data Quality Assessment</option>
                                    <option value="compliance">Compliance Report</option>
                                    <option value="user_activity">User Activity</option>
                                    <option value="system_performance">System Performance</option>
                                    <option value="algorithm_comparison">Algorithm Comparison</option>
                                    <option value="household_analysis">Household Analysis</option>
                                    <option value="custom">Custom Report</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Time Period</label>
                                <select class="form-select" name="time_period">
                                    <option value="last_24h">Last 24 Hours</option>
                                    <option value="last_7d">Last 7 Days</option>
                                    <option value="last_30d" selected>Last 30 Days</option>
                                    <option value="last_90d">Last 90 Days</option>
                                    <option value="last_year">Last Year</option>
                                    <option value="custom">Custom Range</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Format</label>
                                <select class="form-select" name="format">
                                    <option value="dashboard">Interactive Dashboard</option>
                                    <option value="pdf">PDF Report</option>
                                    <option value="excel">Excel Spreadsheet</option>
                                    <option value="csv">CSV Data</option>
                                    <option value="json">JSON Data</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Recipient</label>
                                <select class="form-select" name="recipient">
                                    <option value="current_user">Current User</option>
                                    <option value="management">Management Team</option>
                                    <option value="compliance">Compliance Officers</option>
                                    <option value="technical">Technical Team</option>
                                    <option value="custom">Custom Recipients</option>
                                </select>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4" id="customDateRange" style="display: none;">
                            <div class="form-group">
                                <label class="form-label">Start Date</label>
                                <input type="date" class="form-control" name="start_date">
                            </div>
                            <div class="form-group">
                                <label class="form-label">End Date</label>
                                <input type="date" class="form-control" name="end_date">
                            </div>
                        </div>

                        <div class="form-group mt-4" id="reportOptions">
                            <!-- Dynamic options based on report type -->
                        </div>
                    </form>
                </div>
            </div>

            <!-- Report Dashboard -->
            <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <!-- Key Metrics -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Key Metrics</h3>
                        <span class="text-sm text-gray-600">Last 30 Days</span>
                    </div>
                    <div class="card-body">
                        <div class="space-y-4" id="keyMetrics">
                            <!-- Key metrics will be loaded here -->
                        </div>
                    </div>
                </div>

                <!-- Recent Reports -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Recent Reports</h3>
                        <button class="btn btn-sm btn-outline" onclick="refreshRecentReports()">
                            <i class="fas fa-refresh"></i>
                            Refresh
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="space-y-3" id="recentReports">
                            <!-- Recent reports will be loaded here -->
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Quick Reports</h3>
                    </div>
                    <div class="card-body">
                        <div class="space-y-3">
                            <button class="btn btn-outline w-full text-left" onclick="generateQuickReport('daily_summary')">
                                <i class="fas fa-clock mr-2"></i>
                                Daily Summary
                            </button>
                            <button class="btn btn-outline w-full text-left" onclick="generateQuickReport('matching_stats')">
                                <i class="fas fa-chart-line mr-2"></i>
                                Matching Statistics
                            </button>
                            <button class="btn btn-outline w-full text-left" onclick="generateQuickReport('data_quality')">
                                <i class="fas fa-check-circle mr-2"></i>
                                Data Quality Check
                            </button>
                            <button class="btn btn-outline w-full text-left" onclick="generateQuickReport('compliance_status')">
                                <i class="fas fa-shield-alt mr-2"></i>
                                Compliance Status
                            </button>
                            <button class="btn btn-outline w-full text-left" onclick="generateQuickReport('performance_trends')">
                                <i class="fas fa-trending-up mr-2"></i>
                                Performance Trends
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Analytics Charts -->
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <!-- Matching Performance Chart -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Matching Performance Trends</h3>
                        <div class="flex items-center gap-2">
                            <select class="form-select text-sm" id="performancePeriod" onchange="updatePerformanceTrends()">
                                <option value="7d">Last 7 Days</option>
                                <option value="30d" selected>Last 30 Days</option>
                                <option value="90d">Last 90 Days</option>
                            </select>
                        </div>
                    </div>
                    <div class="card-body">
                        <canvas id="performanceTrendsChart" height="300"></canvas>
                    </div>
                </div>

                <!-- Algorithm Distribution -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Algorithm Usage Distribution</h3>
                    </div>
                    <div class="card-body">
                        <canvas id="algorithmDistributionChart" height="300"></canvas>
                    </div>
                </div>

                <!-- Data Quality Metrics -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Data Quality Metrics</h3>
                    </div>
                    <div class="card-body">
                        <canvas id="dataQualityChart" height="300"></canvas>
                    </div>
                </div>

                <!-- System Usage Patterns -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">System Usage Patterns</h3>
                    </div>
                    <div class="card-body">
                        <canvas id="usagePatternsChart" height="300"></canvas>
                    </div>
                </div>
            </div>

            <!-- Detailed Analytics Table -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Detailed Analytics</h3>
                    <div class="flex items-center gap-2">
                        <button class="btn btn-sm btn-outline" onclick="exportAnalytics()">
                            <i class="fas fa-download"></i>
                            Export
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="refreshAnalytics()">
                            <i class="fas fa-refresh"></i>
                            Refresh
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="table" id="analyticsTable">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Total Searches</th>
                                    <th>Matches Found</th>
                                    <th>Success Rate</th>
                                    <th>Avg Confidence</th>
                                    <th>Avg Response Time</th>
                                    <th>Top Algorithm</th>
                                    <th>Data Quality</th>
                                </tr>
                            </thead>
                            <tbody id="analyticsTableBody">
                                <!-- Table data will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Report Preview Modal -->
        <div class="modal" id="reportPreviewModal" style="display: none;">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">Report Preview</h4>
                        <button class="modal-close" onclick="closeReportPreview()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="reportPreviewContent">
                            <!-- Report preview will be loaded here -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeReportPreview()">Close</button>
                        <button type="button" class="btn btn-outline" onclick="scheduleReport()">
                            <i class="fas fa-calendar"></i>
                            Schedule
                        </button>
                        <button type="button" class="btn btn-primary" onclick="downloadReport()">
                            <i class="fas fa-download"></i>
                            Download
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Report Templates Modal -->
        <div class="modal" id="templatesModal" style="display: none;">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">Report Templates</h4>
                        <button class="modal-close" onclick="closeTemplatesModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="reportTemplates">
                            <!-- Templates will be loaded here -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeTemplatesModal()">Close</button>
                        <button type="button" class="btn btn-primary" onclick="createCustomTemplate()">
                            <i class="fas fa-plus"></i>
                            Create Template
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .modal-xl {
                max-width: 95%;
            }

            .analytics-metric {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem 0;
                border-bottom: 1px solid var(--border-color);
            }

            .analytics-metric:last-child {
                border-bottom: none;
            }

            .metric-label {
                color: var(--text-secondary);
                font-size: 0.875rem;
            }

            .metric-value {
                font-weight: 600;
                font-size: 1.125rem;
            }

            .metric-change {
                font-size: 0.75rem;
                margin-left: 0.5rem;
            }

            .metric-change.positive {
                color: var(--success-color);
            }

            .metric-change.negative {
                color: var(--danger-color);
            }

            .report-template-card {
                border: 1px solid var(--border-color);
                border-radius: 0.5rem;
                padding: 1rem;
                cursor: pointer;
                transition: all 0.2s;
            }

            .report-template-card:hover {
                border-color: var(--primary-color);
                box-shadow: var(--shadow);
            }

            .report-template-card.selected {
                border-color: var(--primary-color);
                background: rgba(37, 99, 235, 0.05);
            }

            .chart-container {
                position: relative;
                height: 300px;
            }

            .report-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem;
                border: 1px solid var(--border-color);
                border-radius: 0.5rem;
                background: white;
                transition: all 0.2s;
            }

            .report-item:hover {
                border-color: var(--primary-color);
                box-shadow: var(--shadow);
            }

            .report-status {
                padding: 0.25rem 0.5rem;
                border-radius: 0.25rem;
                font-size: 0.75rem;
                font-weight: 500;
            }

            .report-status.completed {
                background: var(--success-color);
                color: white;
            }

            .report-status.pending {
                background: var(--warning-color);
                color: white;
            }

            .report-status.failed {
                background: var(--danger-color);
                color: white;
            }
        </style>
    `;

    // Initialize the reports page
    initializeReportsPage();
}

function initializeReportsPage() {
    // Load initial data
    loadKeyMetrics();
    loadRecentReports();
    setupAnalyticsCharts();
    loadAnalyticsTable();
    
    // Setup form event listeners
    setupReportForm();
}

function setupReportForm() {
    const form = document.getElementById('reportForm');
    
    // Handle time period change
    form.querySelector('[name="time_period"]').addEventListener('change', function() {
        const customRange = document.getElementById('customDateRange');
        if (this.value === 'custom') {
            customRange.style.display = 'grid';
        } else {
            customRange.style.display = 'none';
        }
    });
}

function updateReportOptions() {
    const reportType = document.querySelector('[name="report_type"]').value;
    const optionsContainer = document.getElementById('reportOptions');
    
    const reportTypeOptions = {
        executive_summary: `
            <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                    <label class="form-label">Include Sections</label>
                    <div class="space-y-2">
                        <label class="flex items-center">
                            <input type="checkbox" name="include_overview" checked class="mr-2">
                            <span class="text-sm">System Overview</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="include_performance" checked class="mr-2">
                            <span class="text-sm">Performance Metrics</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="include_trends" checked class="mr-2">
                            <span class="text-sm">Trend Analysis</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="include_recommendations" class="mr-2">
                            <span class="text-sm">Recommendations</span>
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Detail Level</label>
                    <select class="form-select" name="detail_level">
                        <option value="high_level">High Level</option>
                        <option value="detailed" selected>Detailed</option>
                        <option value="comprehensive">Comprehensive</option>
                    </select>
                </div>
            </div>
        `,
        matching_performance: `
            <div class="grid grid-cols-3 gap-4">
                <div class="form-group">
                    <label class="form-label">Include Algorithms</label>
                    <div class="space-y-2">
                        <label class="flex items-center">
                            <input type="checkbox" name="include_deterministic" checked class="mr-2">
                            <span class="text-sm">Deterministic</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="include_probabilistic" checked class="mr-2">
                            <span class="text-sm">Probabilistic</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="include_fuzzy" checked class="mr-2">
                            <span class="text-sm">Fuzzy</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="include_ai_hybrid" checked class="mr-2">
                            <span class="text-sm">AI Hybrid</span>
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Metrics</label>
                    <div class="space-y-2">
                        <label class="flex items-center">
                            <input type="checkbox" name="metric_accuracy" checked class="mr-2">
                            <span class="text-sm">Accuracy</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="metric_speed" checked class="mr-2">
                            <span class="text-sm">Performance</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="metric_confidence" checked class="mr-2">
                            <span class="text-sm">Confidence</span>
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Grouping</label>
                    <select class="form-select" name="grouping">
                        <option value="daily">Daily</option>
                        <option value="weekly" selected>Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
            </div>
        `,
        data_quality: `
            <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                    <label class="form-label">Quality Dimensions</label>
                    <div class="space-y-2">
                        <label class="flex items-center">
                            <input type="checkbox" name="completeness" checked class="mr-2">
                            <span class="text-sm">Completeness</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="accuracy" checked class="mr-2">
                            <span class="text-sm">Accuracy</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="consistency" checked class="mr-2">
                            <span class="text-sm">Consistency</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="validity" checked class="mr-2">
                            <span class="text-sm">Validity</span>
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Data Sources</label>
                    <select class="form-select" name="data_sources" multiple>
                        <option value="all" selected>All Sources</option>
                        <option value="dmv">DMV Records</option>
                        <option value="voter">Voter Registration</option>
                        <option value="census">Census Data</option>
                        <option value="external">External APIs</option>
                    </select>
                </div>
            </div>
        `,
        compliance: `
            <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                    <label class="form-label">Compliance Frameworks</label>
                    <div class="space-y-2">
                        <label class="flex items-center">
                            <input type="checkbox" name="fisma" checked class="mr-2">
                            <span class="text-sm">FISMA</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="nist" checked class="mr-2">
                            <span class="text-sm">NIST</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="colorado_privacy" checked class="mr-2">
                            <span class="text-sm">Colorado Privacy Act</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="ferpa" class="mr-2">
                            <span class="text-sm">FERPA</span>
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Audit Scope</label>
                    <select class="form-select" name="audit_scope">
                        <option value="full">Full Audit</option>
                        <option value="high_risk" selected>High Risk Areas</option>
                        <option value="recent_changes">Recent Changes</option>
                        <option value="user_access">User Access</option>
                    </select>
                </div>
            </div>
        `
    };

    optionsContainer.innerHTML = reportTypeOptions[reportType] || '';
}

async function loadKeyMetrics() {
    const metricsContainer = document.getElementById('keyMetrics');
    
    try {
        // Fetch metrics from API
        const stats = await fetchData('/statistics');
        
        // Generate demo metrics
        const metrics = [
            {
                label: 'Total Identities Processed',
                value: formatNumber(stats?.total_identities || 45672),
                change: '+12.3%',
                trend: 'positive'
            },
            {
                label: 'Successful Matches',
                value: formatNumber(stats?.total_matches || 8943),
                change: '+8.7%',
                trend: 'positive'
            },
            {
                label: 'Average Confidence Score',
                value: `${((stats?.average_confidence || 0.87) * 100).toFixed(1)}%`,
                change: '+2.1%',
                trend: 'positive'
            },
            {
                label: 'System Uptime',
                value: '99.8%',
                change: '+0.2%',
                trend: 'positive'
            },
            {
                label: 'Data Quality Score',
                value: '94.2%',
                change: '+1.5%',
                trend: 'positive'
            },
            {
                label: 'Average Response Time',
                value: `${stats?.avg_response_time || 45}ms`,
                change: '-15.2%',
                trend: 'positive'
            }
        ];

        metricsContainer.innerHTML = metrics.map(metric => `
            <div class="analytics-metric">
                <div>
                    <div class="metric-label">${metric.label}</div>
                </div>
                <div class="text-right">
                    <div class="metric-value">${metric.value}</div>
                    <span class="metric-change ${metric.trend}">${metric.change}</span>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading key metrics:', error);
        metricsContainer.innerHTML = '<div class="text-center text-gray-500 py-4">Failed to load metrics</div>';
    }
}

function loadRecentReports() {
    const reportsContainer = document.getElementById('recentReports');
    
    // Generate demo recent reports
    const recentReports = [
        {
            name: 'Daily Matching Summary',
            type: 'daily_summary',
            created: '2 hours ago',
            status: 'completed',
            size: '2.1 MB'
        },
        {
            name: 'Weekly Data Quality Report',
            type: 'data_quality',
            created: '1 day ago',
            status: 'completed',
            size: '5.3 MB'
        },
        {
            name: 'Monthly Compliance Audit',
            type: 'compliance',
            created: '3 days ago',
            status: 'completed',
            size: '12.7 MB'
        },
        {
            name: 'Algorithm Performance Analysis',
            type: 'matching_performance',
            created: '5 days ago',
            status: 'completed',
            size: '8.9 MB'
        },
        {
            name: 'Executive Summary Q3',
            type: 'executive_summary',
            created: '1 week ago',
            status: 'completed',
            size: '15.2 MB'
        }
    ];

    reportsContainer.innerHTML = recentReports.map(report => `
        <div class="report-item">
            <div>
                <div class="font-medium text-sm">${report.name}</div>
                <div class="text-xs text-gray-500">${report.created} • ${report.size}</div>
            </div>
            <div class="flex items-center gap-2">
                <span class="report-status ${report.status}">${report.status}</span>
                <button class="btn btn-sm btn-outline" onclick="downloadReport('${report.type}')">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function setupAnalyticsCharts() {
    setupPerformanceTrendsChart();
    setupAlgorithmDistributionChart();
    setupDataQualityChart();
    setupUsagePatternsChart();
}

function setupPerformanceTrendsChart() {
    const ctx = document.getElementById('performanceTrendsChart').getContext('2d');
    
    // Generate demo data for the last 30 days
    const labels = [];
    const successRate = [];
    const avgConfidence = [];
    const responseTime = [];
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        successRate.push(Math.random() * 10 + 85); // 85-95%
        avgConfidence.push(Math.random() * 10 + 85); // 85-95%
        responseTime.push(Math.random() * 20 + 30); // 30-50ms
    }

    chartInstances.performanceTrends = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Success Rate (%)',
                data: successRate,
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                yAxisID: 'y'
            }, {
                label: 'Avg Confidence (%)',
                data: avgConfidence,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                yAxisID: 'y'
            }, {
                label: 'Response Time (ms)',
                data: responseTime,
                borderColor: 'rgb(236, 72, 153)',
                backgroundColor: 'rgba(236, 72, 153, 0.1)',
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
                    min: 0,
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

function setupAlgorithmDistributionChart() {
    const ctx = document.getElementById('algorithmDistributionChart').getContext('2d');
    
    chartInstances.algorithmDistribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Deterministic', 'Probabilistic', 'Fuzzy', 'AI Hybrid'],
            datasets: [{
                data: [45, 30, 15, 10],
                backgroundColor: [
                    'rgb(34, 197, 94)',
                    'rgb(59, 130, 246)',
                    'rgb(168, 85, 247)',
                    'rgb(236, 72, 153)'
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

function setupDataQualityChart() {
    const ctx = document.getElementById('dataQualityChart').getContext('2d');
    
    chartInstances.dataQuality = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Completeness', 'Accuracy', 'Consistency', 'Validity', 'Timeliness', 'Relevance'],
            datasets: [{
                label: 'Current Score',
                data: [92, 88, 94, 90, 86, 89],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                pointBackgroundColor: 'rgb(59, 130, 246)'
            }, {
                label: 'Target Score',
                data: [95, 95, 95, 95, 95, 95],
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                pointBackgroundColor: 'rgb(34, 197, 94)'
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

function setupUsagePatternsChart() {
    const ctx = document.getElementById('usagePatternsChart').getContext('2d');
    
    // Generate hourly usage data
    const hours = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    const usage = [
        5, 3, 2, 1, 1, 2, 4, 8, 15, 25, 35, 42,
        45, 48, 44, 40, 38, 35, 30, 25, 20, 15, 10, 7
    ];

    chartInstances.usagePatterns = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hours,
            datasets: [{
                label: 'Searches per Hour',
                data: usage,
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgb(59, 130, 246)',
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

function loadAnalyticsTable() {
    const tableBody = document.getElementById('analyticsTableBody');
    
    // Generate demo analytics data
    const analyticsData = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        analyticsData.push({
            date: date.toLocaleDateString(),
            totalSearches: Math.floor(Math.random() * 200) + 50,
            matchesFound: Math.floor(Math.random() * 150) + 30,
            successRate: (Math.random() * 10 + 85).toFixed(1),
            avgConfidence: (Math.random() * 10 + 85).toFixed(1),
            avgResponseTime: Math.floor(Math.random() * 20 + 30),
            topAlgorithm: ['Deterministic', 'Probabilistic', 'Fuzzy', 'AI Hybrid'][Math.floor(Math.random() * 4)],
            dataQuality: (Math.random() * 10 + 85).toFixed(1)
        });
    }

    tableBody.innerHTML = analyticsData.map(row => `
        <tr>
            <td>${row.date}</td>
            <td>${row.totalSearches}</td>
            <td>${row.matchesFound}</td>
            <td><span class="badge badge-success">${row.successRate}%</span></td>
            <td>${row.avgConfidence}%</td>
            <td>${row.avgResponseTime}ms</td>
            <td><span class="algorithm-badge ${row.topAlgorithm.toLowerCase().replace(' ', '_')}">${row.topAlgorithm}</span></td>
            <td><span class="badge badge-${parseFloat(row.dataQuality) > 90 ? 'success' : 'warning'}">${row.dataQuality}%</span></td>
        </tr>
    `).join('');
}

async function generateReport() {
    const form = document.getElementById('reportForm');
    const formData = new FormData(form);
    
    try {
        // Show loading state
        showNotification('Generating report...', 'info');
        
        // Simulate report generation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Show preview
        const reportType = formData.get('report_type');
        const format = formData.get('format');
        
        if (format === 'dashboard') {
            showReportPreview(reportType);
        } else {
            // Simulate download for other formats
            showNotification(`${reportType.replace('_', ' ')} report generated successfully`, 'success');
        }
        
    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('Failed to generate report', 'error');
    }
}

function showReportPreview(reportType) {
    const modal = document.getElementById('reportPreviewModal');
    const content = document.getElementById('reportPreviewContent');
    
    // Generate preview based on report type
    const previewContent = {
        executive_summary: generateExecutiveSummaryPreview(),
        matching_performance: generateMatchingPerformancePreview(),
        data_quality: generateDataQualityPreview(),
        compliance: generateCompliancePreview()
    };

    content.innerHTML = previewContent[reportType] || '<p>Report preview not available</p>';
    modal.style.display = 'flex';
}

function generateExecutiveSummaryPreview() {
    return `
        <div class="space-y-6">
            <div class="text-center border-b pb-4">
                <h2 class="text-2xl font-bold">IDXR Executive Summary</h2>
                <p class="text-gray-600">Identity Cross-Resolution System</p>
                <p class="text-sm text-gray-500">Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="grid grid-cols-2 gap-6">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-blue-800 mb-2">System Performance</h3>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span>Uptime:</span>
                            <span class="font-medium">99.8%</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Avg Response Time:</span>
                            <span class="font-medium">45ms</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Success Rate:</span>
                            <span class="font-medium">94.2%</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-green-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-green-800 mb-2">Matching Statistics</h3>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span>Total Matches:</span>
                            <span class="font-medium">8,943</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Avg Confidence:</span>
                            <span class="font-medium">87.5%</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Manual Reviews:</span>
                            <span class="font-medium">156</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div>
                <h3 class="font-semibold mb-3">Key Insights</h3>
                <ul class="list-disc list-inside space-y-2 text-sm">
                    <li>System performance improved by 15% over the last month</li>
                    <li>AI Hybrid algorithm showing 12% better accuracy in edge cases</li>
                    <li>Data quality scores remain consistently above 90%</li>
                    <li>Zero security incidents reported during this period</li>
                    <li>Compliance score: 98.5% across all frameworks</li>
                </ul>
            </div>
        </div>
    `;
}

function generateMatchingPerformancePreview() {
    return `
        <div class="space-y-6">
            <div class="text-center border-b pb-4">
                <h2 class="text-2xl font-bold">Matching Performance Report</h2>
                <p class="text-sm text-gray-500">Last 30 Days Analysis</p>
            </div>
            
            <div class="grid grid-cols-4 gap-4">
                <div class="text-center bg-gray-50 p-4 rounded">
                    <div class="text-2xl font-bold text-blue-600">94.2%</div>
                    <div class="text-sm text-gray-600">Overall Accuracy</div>
                </div>
                <div class="text-center bg-gray-50 p-4 rounded">
                    <div class="text-2xl font-bold text-green-600">45ms</div>
                    <div class="text-sm text-gray-600">Avg Response</div>
                </div>
                <div class="text-center bg-gray-50 p-4 rounded">
                    <div class="text-2xl font-bold text-purple-600">87.5%</div>
                    <div class="text-sm text-gray-600">Avg Confidence</div>
                </div>
                <div class="text-center bg-gray-50 p-4 rounded">
                    <div class="text-2xl font-bold text-orange-600">8,943</div>
                    <div class="text-sm text-gray-600">Total Matches</div>
                </div>
            </div>
            
            <div>
                <h3 class="font-semibold mb-3">Algorithm Performance Breakdown</h3>
                <div class="space-y-3">
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span class="font-medium">Deterministic</span>
                        <div class="flex items-center gap-2">
                            <span class="text-sm">98.5% accuracy</span>
                            <span class="text-sm text-gray-500">2.3ms avg</span>
                            <span class="badge badge-success">45% usage</span>
                        </div>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span class="font-medium">Probabilistic</span>
                        <div class="flex items-center gap-2">
                            <span class="text-sm">94.2% accuracy</span>
                            <span class="text-sm text-gray-500">15.7ms avg</span>
                            <span class="badge badge-primary">30% usage</span>
                        </div>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span class="font-medium">AI Hybrid</span>
                        <div class="flex items-center gap-2">
                            <span class="text-sm">96.8% accuracy</span>
                            <span class="text-sm text-gray-500">45.2ms avg</span>
                            <span class="badge badge-info">20% usage</span>
                        </div>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span class="font-medium">Fuzzy</span>
                        <div class="flex items-center gap-2">
                            <span class="text-sm">89.3% accuracy</span>
                            <span class="text-sm text-gray-500">8.9ms avg</span>
                            <span class="badge badge-warning">5% usage</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateDataQualityPreview() {
    return `
        <div class="space-y-6">
            <div class="text-center border-b pb-4">
                <h2 class="text-2xl font-bold">Data Quality Assessment</h2>
                <p class="text-sm text-gray-500">Comprehensive Quality Analysis</p>
            </div>
            
            <div class="grid grid-cols-3 gap-4">
                <div class="text-center bg-green-50 p-4 rounded">
                    <div class="text-2xl font-bold text-green-600">92.4%</div>
                    <div class="text-sm text-gray-600">Overall Quality Score</div>
                </div>
                <div class="text-center bg-blue-50 p-4 rounded">
                    <div class="text-2xl font-bold text-blue-600">156</div>
                    <div class="text-sm text-gray-600">Issues Identified</div>
                </div>
                <div class="text-center bg-purple-50 p-4 rounded">
                    <div class="text-2xl font-bold text-purple-600">98.7%</div>
                    <div class="text-sm text-gray-600">Validation Pass Rate</div>
                </div>
            </div>
            
            <div>
                <h3 class="font-semibold mb-3">Quality Dimensions</h3>
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span>Completeness</span>
                        <div class="flex items-center gap-2">
                            <div class="w-32 bg-gray-200 rounded-full h-2">
                                <div class="bg-green-500 h-2 rounded-full" style="width: 92%"></div>
                            </div>
                            <span class="text-sm font-medium">92%</span>
                        </div>
                    </div>
                    <div class="flex justify-between items-center">
                        <span>Accuracy</span>
                        <div class="flex items-center gap-2">
                            <div class="w-32 bg-gray-200 rounded-full h-2">
                                <div class="bg-green-500 h-2 rounded-full" style="width: 88%"></div>
                            </div>
                            <span class="text-sm font-medium">88%</span>
                        </div>
                    </div>
                    <div class="flex justify-between items-center">
                        <span>Consistency</span>
                        <div class="flex items-center gap-2">
                            <div class="w-32 bg-gray-200 rounded-full h-2">
                                <div class="bg-green-500 h-2 rounded-full" style="width: 94%"></div>
                            </div>
                            <span class="text-sm font-medium">94%</span>
                        </div>
                    </div>
                    <div class="flex justify-between items-center">
                        <span>Validity</span>
                        <div class="flex items-center gap-2">
                            <div class="w-32 bg-gray-200 rounded-full h-2">
                                <div class="bg-green-500 h-2 rounded-full" style="width: 90%"></div>
                            </div>
                            <span class="text-sm font-medium">90%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateCompliancePreview() {
    return `
        <div class="space-y-6">
            <div class="text-center border-b pb-4">
                <h2 class="text-2xl font-bold">Compliance Report</h2>
                <p class="text-sm text-gray-500">Regulatory Compliance Status</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-green-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-green-800 mb-2">FISMA Compliance</h3>
                    <div class="text-2xl font-bold text-green-600 mb-2">98.5%</div>
                    <div class="text-sm text-green-700">3 minor findings</div>
                </div>
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-blue-800 mb-2">NIST Framework</h3>
                    <div class="text-2xl font-bold text-blue-600 mb-2">97.2%</div>
                    <div class="text-sm text-blue-700">5 recommendations</div>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-purple-800 mb-2">Colorado Privacy Act</h3>
                    <div class="text-2xl font-bold text-purple-600 mb-2">99.1%</div>
                    <div class="text-sm text-purple-700">Fully compliant</div>
                </div>
                <div class="bg-orange-50 p-4 rounded-lg">
                    <h3 class="font-semibold text-orange-800 mb-2">Data Protection</h3>
                    <div class="text-2xl font-bold text-orange-600 mb-2">96.8%</div>
                    <div class="text-sm text-orange-700">2 action items</div>
                </div>
            </div>
            
            <div>
                <h3 class="font-semibold mb-3">Recent Audit Findings</h3>
                <div class="space-y-2 text-sm">
                    <div class="flex items-start gap-2 p-2 bg-yellow-50 rounded">
                        <i class="fas fa-exclamation-triangle text-yellow-600 mt-0.5"></i>
                        <div>
                            <div class="font-medium">Password complexity policy</div>
                            <div class="text-gray-600">Review password requirements for service accounts</div>
                        </div>
                    </div>
                    <div class="flex items-start gap-2 p-2 bg-green-50 rounded">
                        <i class="fas fa-check-circle text-green-600 mt-0.5"></i>
                        <div>
                            <div class="font-medium">Encryption standards</div>
                            <div class="text-gray-600">All data encrypted using AES-256</div>
                        </div>
                    </div>
                    <div class="flex items-start gap-2 p-2 bg-blue-50 rounded">
                        <i class="fas fa-info-circle text-blue-600 mt-0.5"></i>
                        <div>
                            <div class="font-medium">Access logging</div>
                            <div class="text-gray-600">Comprehensive audit trail maintained</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Additional functions
function closeReportPreview() {
    document.getElementById('reportPreviewModal').style.display = 'none';
}

function downloadReport() {
    showNotification('Report download started', 'success');
    closeReportPreview();
}

function scheduleReport() {
    showNotification('Report scheduling feature coming soon', 'info');
}

function loadReportTemplates() {
    document.getElementById('templatesModal').style.display = 'flex';
    // Load templates would be implemented here
}

function closeTemplatesModal() {
    document.getElementById('templatesModal').style.display = 'none';
}

function createCustomTemplate() {
    showNotification('Custom template creation coming soon', 'info');
}

function generateQuickReport(type) {
    showNotification(`Generating ${type.replace('_', ' ')} report...`, 'info');
    setTimeout(() => {
        showNotification(`${type.replace('_', ' ')} report ready for download`, 'success');
    }, 2000);
}

function updatePerformanceTrends() {
    const period = document.getElementById('performancePeriod').value;
    // Update chart based on selected period
    console.log('Updating performance trends for period:', period);
}

function refreshRecentReports() {
    loadRecentReports();
    showNotification('Recent reports refreshed', 'success');
}

function refreshAnalytics() {
    loadAnalyticsTable();
    showNotification('Analytics data refreshed', 'success');
}

function exportAnalytics() {
    // Generate CSV export
    const headers = ['Date', 'Total Searches', 'Matches Found', 'Success Rate', 'Avg Confidence', 'Avg Response Time', 'Top Algorithm', 'Data Quality'];
    const csvContent = headers.join(',') + '\n';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `idxr_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Analytics data exported', 'success');
}