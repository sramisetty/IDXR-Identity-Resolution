// Security Dashboard Page
function loadSecurityPage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="space-y-6">
            <!-- Security Status Overview -->
            <div class="stats-grid">
                <div class="stat-card success">
                    <div class="stat-header">
                        <span class="stat-title">Security Score</span>
                        <div class="stat-icon success">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                    </div>
                    <div class="stat-value">98.5%</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>+0.8% this month</span>
                    </div>
                </div>

                <div class="stat-card info">
                    <div class="stat-header">
                        <span class="stat-title">Active Sessions</span>
                        <div class="stat-icon info">
                            <i class="fas fa-users"></i>
                        </div>
                    </div>
                    <div class="stat-value">47</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>12 new today</span>
                    </div>
                </div>

                <div class="stat-card warning">
                    <div class="stat-header">
                        <span class="stat-title">Failed Logins</span>
                        <div class="stat-icon warning">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                    </div>
                    <div class="stat-value">23</div>
                    <div class="stat-change negative">
                        <i class="fas fa-arrow-down"></i>
                        <span>-5 from yesterday</span>
                    </div>
                </div>

                <div class="stat-card danger">
                    <div class="stat-header">
                        <span class="stat-title">Security Alerts</span>
                        <div class="stat-icon danger">
                            <i class="fas fa-bell"></i>
                        </div>
                    </div>
                    <div class="stat-value">2</div>
                    <div class="stat-change negative">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>Requires attention</span>
                    </div>
                </div>
            </div>

            <!-- Security Monitoring -->
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Authentication Activity</h3>
                    </div>
                    <div class="card-body">
                        <canvas id="authActivityChart" height="300"></canvas>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Security Events</h3>
                    </div>
                    <div class="card-body">
                        <div id="securityEvents">
                            <!-- Security events will be loaded here -->
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Access Patterns</h3>
                    </div>
                    <div class="card-body">
                        <canvas id="accessPatternsChart" height="300"></canvas>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Security Policies</h3>
                        <button class="btn btn-sm btn-outline" onclick="managePolicies()">
                            <i class="fas fa-cog"></i>
                            Manage
                        </button>
                    </div>
                    <div class="card-body">
                        <div id="securityPolicies">
                            <!-- Security policies will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    initializeSecurity();
}

function initializeSecurity() {
    setupSecurityCharts();
    loadSecurityEvents();
    loadSecurityPolicies();
}

function setupSecurityCharts() {
    setupAuthActivityChart();
    setupAccessPatternsChart();
}

function setupAuthActivityChart() {
    const ctx = document.getElementById('authActivityChart').getContext('2d');
    
    chartInstances.authActivity = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Successful Logins',
                data: [156, 143, 167, 134, 145, 45, 23],
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)'
            }, {
                label: 'Failed Attempts',
                data: [12, 8, 15, 23, 18, 5, 3],
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)'
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

function setupAccessPatternsChart() {
    const ctx = document.getElementById('accessPatternsChart').getContext('2d');
    
    chartInstances.accessPatterns = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Admin Dashboard', 'Identity Matching', 'Reports', 'Settings', 'API Access'],
            datasets: [{
                data: [35, 28, 20, 12, 5],
                backgroundColor: [
                    'rgb(59, 130, 246)',
                    'rgb(34, 197, 94)',
                    'rgb(168, 85, 247)',
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

function loadSecurityEvents() {
    const container = document.getElementById('securityEvents');
    
    const events = [
        {
            type: 'warning',
            title: 'Multiple failed login attempts',
            description: 'User: admin@example.com (5 attempts)',
            time: '15 minutes ago',
            severity: 'medium'
        },
        {
            type: 'info',
            title: 'New user registered',
            description: 'analyst@colorado.gov',
            time: '1 hour ago',
            severity: 'low'
        },
        {
            type: 'success',
            title: 'Security scan completed',
            description: 'No vulnerabilities detected',
            time: '3 hours ago',
            severity: 'low'
        },
        {
            type: 'warning',
            title: 'Unusual access pattern',
            description: 'API access from new location',
            time: '5 hours ago',
            severity: 'medium'
        }
    ];

    container.innerHTML = events.map(event => `
        <div class="border-l-4 ${getEventBorderColor(event.type)} p-3 mb-3 bg-${getEventBgColor(event.type)}">
            <div class="flex items-start">
                <i class="fas fa-${getEventIcon(event.type)} text-${getEventColor(event.type)}-600 mt-1 mr-3"></i>
                <div class="flex-1">
                    <div class="font-medium text-sm">${event.title}</div>
                    <div class="text-sm text-gray-600">${event.description}</div>
                    <div class="text-xs text-gray-500 mt-1">${event.time}</div>
                </div>
                <span class="badge badge-${event.severity === 'high' ? 'danger' : event.severity === 'medium' ? 'warning' : 'info'}">${event.severity}</span>
            </div>
        </div>
    `).join('');
}

function loadSecurityPolicies() {
    const container = document.getElementById('securityPolicies');
    
    const policies = [
        { name: 'Password Policy', status: 'active', compliance: '98%' },
        { name: 'MFA Requirement', status: 'active', compliance: '95%' },
        { name: 'Session Timeout', status: 'active', compliance: '100%' },
        { name: 'IP Whitelist', status: 'inactive', compliance: '0%' },
        { name: 'Data Encryption', status: 'active', compliance: '100%' }
    ];

    container.innerHTML = policies.map(policy => `
        <div class="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
            <div>
                <div class="font-medium">${policy.name}</div>
                <div class="text-sm text-gray-600">Compliance: ${policy.compliance}</div>
            </div>
            <span class="badge badge-${policy.status === 'active' ? 'success' : 'secondary'}">${policy.status}</span>
        </div>
    `).join('');
}

function getEventBorderColor(type) {
    switch(type) {
        case 'warning': return 'border-yellow-500';
        case 'error': return 'border-red-500';
        case 'success': return 'border-green-500';
        default: return 'border-blue-500';
    }
}

function getEventBgColor(type) {
    switch(type) {
        case 'warning': return 'yellow-50';
        case 'error': return 'red-50';
        case 'success': return 'green-50';
        default: return 'blue-50';
    }
}

function getEventIcon(type) {
    switch(type) {
        case 'warning': return 'exclamation-triangle';
        case 'error': return 'exclamation-circle';
        case 'success': return 'check-circle';
        default: return 'info-circle';
    }
}

function getEventColor(type) {
    switch(type) {
        case 'warning': return 'yellow';
        case 'error': return 'red';
        case 'success': return 'green';
        default: return 'blue';
    }
}

function managePolicies() {
    showNotification('Security policy management coming soon', 'info');
}