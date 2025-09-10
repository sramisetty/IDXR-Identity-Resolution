// Data Quality Monitoring Page
function loadDataQualityPage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="space-y-6">
            <!-- Data Quality Overview -->
            <div class="stats-grid">
                <div class="stat-card success">
                    <div class="stat-header">
                        <span class="stat-title">Overall Score</span>
                        <div class="stat-icon success">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </div>
                    <div class="stat-value">92.4%</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>+1.8% improvement</span>
                    </div>
                </div>

                <div class="stat-card warning">
                    <div class="stat-header">
                        <span class="stat-title">Issues Detected</span>
                        <div class="stat-icon warning">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                    </div>
                    <div class="stat-value">156</div>
                    <div class="stat-change negative">
                        <i class="fas fa-arrow-down"></i>
                        <span>-23 from last week</span>
                    </div>
                </div>

                <div class="stat-card info">
                    <div class="stat-header">
                        <span class="stat-title">Records Processed</span>
                        <div class="stat-icon info">
                            <i class="fas fa-database"></i>
                        </div>
                    </div>
                    <div class="stat-value">45.7K</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>+2.3K this week</span>
                    </div>
                </div>

                <div class="stat-card primary">
                    <div class="stat-header">
                        <span class="stat-title">Validation Rate</span>
                        <div class="stat-icon primary">
                            <i class="fas fa-shield-check"></i>
                        </div>
                    </div>
                    <div class="stat-value">98.7%</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>+0.5% improvement</span>
                    </div>
                </div>
            </div>

            <!-- Quality Dimensions Chart -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Data Quality Dimensions</h3>
                    <button class="btn btn-sm btn-primary" onclick="runQualityCheck()">
                        <i class="fas fa-play"></i>
                        Run Quality Check
                    </button>
                </div>
                <div class="card-body">
                    <canvas id="qualityDimensionsChart" height="300"></canvas>
                </div>
            </div>

            <!-- Quality Issues and Validation Rules -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Top Quality Issues</h3>
                    </div>
                    <div class="card-body">
                        <div id="qualityIssues">
                            <!-- Quality issues will be loaded here -->
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Validation Rules</h3>
                        <button class="btn btn-sm btn-outline" onclick="manageValidationRules()">
                            <i class="fas fa-cog"></i>
                            Manage
                        </button>
                    </div>
                    <div class="card-body">
                        <div id="validationRules">
                            <!-- Validation rules will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize data quality monitoring
    initializeDataQuality();
}

function initializeDataQuality() {
    setupQualityChart();
    loadQualityIssues();
    loadValidationRules();
}

function setupQualityChart() {
    const ctx = document.getElementById('qualityDimensionsChart').getContext('2d');
    
    chartInstances.qualityDimensions = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Completeness', 'Accuracy', 'Consistency', 'Validity', 'Timeliness', 'Uniqueness'],
            datasets: [{
                label: 'Current Score',
                data: [92, 88, 94, 90, 86, 95],
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

function loadQualityIssues() {
    const container = document.getElementById('qualityIssues');
    
    const issues = [
        { type: 'Missing Values', count: 45, severity: 'medium', trend: 'down' },
        { type: 'Invalid Format', count: 32, severity: 'high', trend: 'up' },
        { type: 'Duplicate Records', count: 28, severity: 'low', trend: 'down' },
        { type: 'Inconsistent Data', count: 21, severity: 'medium', trend: 'stable' },
        { type: 'Outliers', count: 18, severity: 'low', trend: 'down' }
    ];

    container.innerHTML = issues.map(issue => `
        <div class="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
            <div>
                <div class="font-medium">${issue.type}</div>
                <div class="text-sm text-gray-600">${issue.count} occurrences</div>
            </div>
            <div class="flex items-center gap-2">
                <span class="badge badge-${issue.severity === 'high' ? 'danger' : issue.severity === 'medium' ? 'warning' : 'info'}">${issue.severity}</span>
                <i class="fas fa-arrow-${issue.trend === 'up' ? 'up text-red-500' : issue.trend === 'down' ? 'down text-green-500' : 'right text-gray-500'}"></i>
            </div>
        </div>
    `).join('');
}

function loadValidationRules() {
    const container = document.getElementById('validationRules');
    
    const rules = [
        { name: 'SSN Format', status: 'active', coverage: '98%' },
        { name: 'Phone Number', status: 'active', coverage: '95%' },
        { name: 'Email Format', status: 'active', coverage: '97%' },
        { name: 'Date Range', status: 'active', coverage: '92%' },
        { name: 'Address Validation', status: 'inactive', coverage: '0%' }
    ];

    container.innerHTML = rules.map(rule => `
        <div class="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
            <div>
                <div class="font-medium">${rule.name}</div>
                <div class="text-sm text-gray-600">Coverage: ${rule.coverage}</div>
            </div>
            <span class="badge badge-${rule.status === 'active' ? 'success' : 'secondary'}">${rule.status}</span>
        </div>
    `).join('');
}

function runQualityCheck() {
    showNotification('Running comprehensive data quality check...', 'info');
    setTimeout(() => {
        loadQualityIssues();
        showNotification('Quality check completed', 'success');
    }, 3000);
}

function manageValidationRules() {
    showNotification('Validation rule management coming soon', 'info');
}