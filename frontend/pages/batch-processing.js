// Batch Processing Page
function loadBatchProcessingPage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="space-y-6">
            <!-- Batch Processing Overview -->
            <div class="stats-grid">
                <div class="stat-card primary">
                    <div class="stat-header">
                        <span class="stat-title">Active Jobs</span>
                        <div class="stat-icon primary">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                    <div class="stat-value">3</div>
                    <div class="stat-change positive">
                        <i class="fas fa-clock"></i>
                        <span>Est. 2h remaining</span>
                    </div>
                </div>

                <div class="stat-card success">
                    <div class="stat-header">
                        <span class="stat-title">Completed Today</span>
                        <div class="stat-icon success">
                            <i class="fas fa-check"></i>
                        </div>
                    </div>
                    <div class="stat-value">12</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>+3 from yesterday</span>
                    </div>
                </div>

                <div class="stat-card warning">
                    <div class="stat-header">
                        <span class="stat-title">Queued Jobs</span>
                        <div class="stat-icon warning">
                            <i class="fas fa-clock"></i>
                        </div>
                    </div>
                    <div class="stat-value">7</div>
                    <div class="stat-change negative">
                        <i class="fas fa-arrow-up"></i>
                        <span>Queue building up</span>
                    </div>
                </div>

                <div class="stat-card info">
                    <div class="stat-header">
                        <span class="stat-title">Records/Hour</span>
                        <div class="stat-icon info">
                            <i class="fas fa-tachometer-alt"></i>
                        </div>
                    </div>
                    <div class="stat-value">2.3K</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>15% faster</span>
                    </div>
                </div>
            </div>

            <!-- New Batch Job Creation -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Create New Batch Job</h3>
                </div>
                <div class="card-body">
                    <form id="batchJobForm" onsubmit="submitBatchJob(event)">
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div class="space-y-4">
                                <div class="form-group">
                                    <label class="form-label">Job Name</label>
                                    <input type="text" class="form-control" name="jobName" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Processing Type</label>
                                    <select class="form-select" name="processingType" onchange="updateJobOptions()">
                                        <option value="identity_matching">Identity Matching</option>
                                        <option value="data_validation">Data Validation</option>
                                        <option value="household_detection">Household Detection</option>
                                        <option value="data_quality">Data Quality Assessment</option>
                                        <option value="deduplication">Record Deduplication</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Priority</label>
                                    <select class="form-select" name="priority">
                                        <option value="low">Low</option>
                                        <option value="normal" selected>Normal</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="space-y-4">
                                <div class="form-group">
                                    <label class="form-label">Data Source</label>
                                    <select class="form-select" name="dataSource">
                                        <option value="file_upload">File Upload</option>
                                        <option value="database_query">Database Query</option>
                                        <option value="api_endpoint">API Endpoint</option>
                                        <option value="existing_dataset">Existing Dataset</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">File Upload</label>
                                    <input type="file" class="form-control" name="dataFile" accept=".csv,.xlsx,.json">
                                    <div class="text-xs text-gray-500 mt-1">Supported formats: CSV, XLSX, JSON</div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Batch Size</label>
                                    <input type="number" class="form-control" name="batchSize" value="1000" min="100" max="10000">
                                </div>
                            </div>
                            
                            <div class="space-y-4">
                                <div class="form-group">
                                    <label class="form-label">Schedule</label>
                                    <select class="form-select" name="schedule">
                                        <option value="immediate">Run Immediately</option>
                                        <option value="scheduled">Schedule for Later</option>
                                        <option value="recurring">Recurring Job</option>
                                    </select>
                                </div>
                                <div class="form-group" id="scheduleOptions" style="display: none;">
                                    <label class="form-label">Run At</label>
                                    <input type="datetime-local" class="form-control" name="scheduledTime">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Output Format</label>
                                    <select class="form-select" name="outputFormat">
                                        <option value="csv">CSV</option>
                                        <option value="excel">Excel</option>
                                        <option value="json">JSON</option>
                                        <option value="database">Database</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-6">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-play"></i>
                                Submit Batch Job
                            </button>
                            <button type="button" class="btn btn-outline ml-2" onclick="previewBatchJob()">
                                <i class="fas fa-eye"></i>
                                Preview
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Active and Recent Jobs -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Active Jobs</h3>
                        <button class="btn btn-sm btn-outline" onclick="refreshJobs()">
                            <i class="fas fa-refresh"></i>
                            Refresh
                        </button>
                    </div>
                    <div class="card-body">
                        <div id="activeJobs">
                            <!-- Active jobs will be loaded here -->
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Recent Jobs</h3>
                    </div>
                    <div class="card-body">
                        <div id="recentJobs">
                            <!-- Recent jobs will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Job Queue and Performance -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Job Queue & Performance</h3>
                    <div class="flex gap-2">
                        <button class="btn btn-sm btn-outline" onclick="pauseQueue()">
                            <i class="fas fa-pause"></i>
                            Pause Queue
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="clearCompleted()">
                            <i class="fas fa-trash"></i>
                            Clear Completed
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <canvas id="batchPerformanceChart" height="200"></canvas>
                </div>
            </div>
        </div>
    `;

    initializeBatchProcessing();
}

function initializeBatchProcessing() {
    loadActiveJobs();
    loadRecentJobs();
    setupBatchPerformanceChart();
    setupFormHandlers();
}

function setupFormHandlers() {
    document.querySelector('[name="schedule"]').addEventListener('change', function() {
        const scheduleOptions = document.getElementById('scheduleOptions');
        if (this.value === 'scheduled' || this.value === 'recurring') {
            scheduleOptions.style.display = 'block';
        } else {
            scheduleOptions.style.display = 'none';
        }
    });
}

function loadActiveJobs() {
    const container = document.getElementById('activeJobs');
    
    const activeJobs = [
        {
            id: 'JOB-2025-001',
            name: 'Daily Identity Matching',
            type: 'identity_matching',
            progress: 65,
            recordsProcessed: 13000,
            totalRecords: 20000,
            startTime: '10:30 AM',
            estimatedCompletion: '2:15 PM'
        },
        {
            id: 'JOB-2025-002',
            name: 'Household Detection Batch',
            type: 'household_detection',
            progress: 25,
            recordsProcessed: 2500,
            totalRecords: 10000,
            startTime: '11:45 AM',
            estimatedCompletion: '4:30 PM'
        },
        {
            id: 'JOB-2025-003',
            name: 'Data Quality Assessment',
            type: 'data_quality',
            progress: 90,
            recordsProcessed: 9000,
            totalRecords: 10000,
            startTime: '9:00 AM',
            estimatedCompletion: '1:00 PM'
        }
    ];

    container.innerHTML = activeJobs.map(job => `
        <div class="border rounded p-4 mb-4">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h4 class="font-medium">${job.name}</h4>
                    <div class="text-sm text-gray-600">${job.id} • Started ${job.startTime}</div>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-sm btn-outline" onclick="viewJobDetails('${job.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="cancelJob('${job.id}')">
                        <i class="fas fa-stop"></i>
                    </button>
                </div>
            </div>
            
            <div class="mb-3">
                <div class="flex justify-between text-sm mb-1">
                    <span>Progress: ${job.progress}%</span>
                    <span>${formatNumber(job.recordsProcessed)} / ${formatNumber(job.totalRecords)} records</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: ${job.progress}%"></div>
                </div>
            </div>
            
            <div class="text-xs text-gray-500">
                Estimated completion: ${job.estimatedCompletion}
            </div>
        </div>
    `).join('');
}

function loadRecentJobs() {
    const container = document.getElementById('recentJobs');
    
    const recentJobs = [
        {
            id: 'JOB-2025-000',
            name: 'Weekly Deduplication',
            type: 'deduplication',
            status: 'completed',
            completedTime: '8:45 AM',
            records: 50000,
            duration: '2h 15m',
            matches: 1247
        },
        {
            id: 'JOB-2024-999',
            name: 'Address Validation',
            type: 'data_validation',
            status: 'completed',
            completedTime: 'Yesterday',
            records: 25000,
            duration: '1h 30m',
            matches: 523
        },
        {
            id: 'JOB-2024-998',
            name: 'Monthly Report Data',
            type: 'identity_matching',
            status: 'failed',
            completedTime: 'Yesterday',
            records: 15000,
            duration: '45m',
            error: 'Database connection timeout'
        }
    ];

    container.innerHTML = recentJobs.map(job => `
        <div class="border rounded p-4 mb-4">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <h4 class="font-medium">${job.name}</h4>
                    <div class="text-sm text-gray-600">${job.id}</div>
                </div>
                <span class="badge badge-${getJobStatusColor(job.status)}">${job.status}</span>
            </div>
            
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span class="text-gray-500">Completed:</span>
                    <span class="font-medium">${job.completedTime}</span>
                </div>
                <div>
                    <span class="text-gray-500">Duration:</span>
                    <span class="font-medium">${job.duration}</span>
                </div>
                <div>
                    <span class="text-gray-500">Records:</span>
                    <span class="font-medium">${formatNumber(job.records)}</span>
                </div>
                <div>
                    <span class="text-gray-500">${job.status === 'failed' ? 'Error:' : 'Matches:'}</span>
                    <span class="font-medium">${job.status === 'failed' ? job.error : formatNumber(job.matches)}</span>
                </div>
            </div>
            
            <div class="mt-3 flex gap-2">
                <button class="btn btn-sm btn-outline" onclick="viewJobDetails('${job.id}')">
                    <i class="fas fa-eye"></i>
                    View Details
                </button>
                ${job.status === 'completed' ? `
                    <button class="btn btn-sm btn-outline" onclick="downloadResults('${job.id}')">
                        <i class="fas fa-download"></i>
                        Download
                    </button>
                ` : ''}
                ${job.status === 'failed' ? `
                    <button class="btn btn-sm btn-primary" onclick="retryJob('${job.id}')">
                        <i class="fas fa-redo"></i>
                        Retry
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function setupBatchPerformanceChart() {
    const ctx = document.getElementById('batchPerformanceChart').getContext('2d');
    
    const labels = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    
    chartInstances.batchPerformance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Records Processed/Hour',
                data: [0, 0, 0, 0, 0, 500, 1200, 2300, 2800, 3100, 2900, 3200, 3400, 3100, 2800, 2600, 2400, 2100, 1800, 1200, 800, 400, 200, 100],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
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

function getJobStatusColor(status) {
    switch(status) {
        case 'completed': return 'success';
        case 'running': return 'primary';
        case 'queued': return 'warning';
        case 'failed': return 'danger';
        case 'cancelled': return 'secondary';
        default: return 'info';
    }
}

function updateJobOptions() {
    const processingType = document.querySelector('[name="processingType"]').value;
    // Update form options based on processing type
    console.log('Processing type changed to:', processingType);
}

function submitBatchJob(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const jobData = Object.fromEntries(formData.entries());
    
    showNotification('Creating batch job...', 'info');
    
    setTimeout(() => {
        showNotification(`Batch job "${jobData.jobName}" created successfully`, 'success');
        event.target.reset();
        loadActiveJobs();
    }, 2000);
}

function previewBatchJob() {
    showNotification('Job preview feature coming soon', 'info');
}

function refreshJobs() {
    loadActiveJobs();
    loadRecentJobs();
    showNotification('Job lists refreshed', 'success');
}

function viewJobDetails(jobId) {
    showNotification(`Loading details for ${jobId}...`, 'info');
}

function cancelJob(jobId) {
    if (confirm(`Are you sure you want to cancel job ${jobId}?`)) {
        showNotification(`Job ${jobId} cancelled`, 'warning');
        loadActiveJobs();
    }
}

function downloadResults(jobId) {
    showNotification(`Downloading results for ${jobId}...`, 'info');
    
    // Simulate download
    setTimeout(() => {
        showNotification('Download completed', 'success');
    }, 1500);
}

function retryJob(jobId) {
    showNotification(`Retrying job ${jobId}...`, 'info');
    
    setTimeout(() => {
        showNotification(`Job ${jobId} queued for retry`, 'success');
        loadActiveJobs();
    }, 1000);
}

function pauseQueue() {
    showNotification('Job queue paused', 'warning');
}

function clearCompleted() {
    if (confirm('Clear all completed jobs from the list?')) {
        showNotification('Completed jobs cleared', 'success');
        loadRecentJobs();
    }
}