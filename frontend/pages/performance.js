// Performance Monitoring Page
function loadPerformancePage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="space-y-6">
            <!-- Performance Overview -->
            <div class="stats-grid">
                <div class="stat-card primary">
                    <div class="stat-header">
                        <span class="stat-title">Average Response Time</span>
                        <div class="stat-icon primary">
                            <i class="fas fa-stopwatch"></i>
                        </div>
                    </div>
                    <div class="stat-value">185ms</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-down"></i>
                        <span>-12ms faster</span>
                    </div>
                </div>

                <div class="stat-card success">
                    <div class="stat-header">
                        <span class="stat-title">Throughput</span>
                        <div class="stat-icon success">
                            <i class="fas fa-chart-line"></i>
                        </div>
                    </div>
                    <div class="stat-value">2,500/sec</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>+15% increase</span>
                    </div>
                </div>

                <div class="stat-card info">
                    <div class="stat-header">
                        <span class="stat-title">CPU Usage</span>
                        <div class="stat-icon info">
                            <i class="fas fa-microchip"></i>
                        </div>
                    </div>
                    <div class="stat-value">67%</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-down"></i>
                        <span>-5% optimized</span>
                    </div>
                </div>

                <div class="stat-card warning">
                    <div class="stat-header">
                        <span class="stat-title">Memory Usage</span>
                        <div class="stat-icon warning">
                            <i class="fas fa-memory"></i>
                        </div>
                    </div>
                    <div class="stat-value">5.2GB</div>
                    <div class="stat-change negative">
                        <i class="fas fa-arrow-up"></i>
                        <span>+0.3GB increase</span>
                    </div>
                </div>
            </div>

            <!-- Performance Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Response Time Trends</h3>
                    </div>
                    <div class="card-body">
                        <canvas id="responseTimeChart" height="300"></canvas>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">System Resources</h3>
                    </div>
                    <div class="card-body">
                        <canvas id="systemResourcesChart" height="300"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;

    initializePerformance();
}

function initializePerformance() {
    setTimeout(() => {
        setupResponseTimeChart();
        setupSystemResourcesChart();
    }, 100);
}

function setupResponseTimeChart() {
    const canvas = document.getElementById('responseTimeChart');
    if (!canvas) {
        console.error('Response Time chart canvas not found');
        return;
    }
    const ctx = canvas.getContext('2d');

    chartInstances.responseTime = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['1h ago', '45m ago', '30m ago', '15m ago', 'Now'],
            datasets: [{
                label: 'Response Time (ms)',
                data: [220, 185, 195, 175, 185],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function setupSystemResourcesChart() {
    const canvas = document.getElementById('systemResourcesChart');
    if (!canvas) {
        console.error('System Resources chart canvas not found');
        return;
    }
    const ctx = canvas.getContext('2d');

    chartInstances.systemResources = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['CPU', 'Memory', 'Disk', 'Network'],
            datasets: [{
                data: [67, 58, 45, 23],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(236, 72, 153, 0.8)'
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