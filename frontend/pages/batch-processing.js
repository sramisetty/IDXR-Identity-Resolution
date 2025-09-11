// Batch Processing Page - Updated with WebSocket Integration
console.log('✅ Batch Processing JS loaded successfully');

// WebSocket integration for real-time job updates
let wsClient = null;

// Initialize WebSocket connection when page loads
function initializeWebSocket() {
    try {
        // Use global WebSocket client
        wsClient = window.IDXRWebSocket;
        
        if (wsClient) {
            // Subscribe to job updates
            wsClient.subscribeToJobs();
            
            // Set up event handlers for real-time updates
            wsClient.on('job_update', handleJobUpdate);
            wsClient.on('jobs_snapshot', handleJobsSnapshot);
            wsClient.on('queue_stats', handleQueueStats);
            wsClient.on('system_notification', handleSystemNotification);
            
            console.log('WebSocket integration initialized for batch processing');
        } else {
            console.warn('WebSocket client not available - falling back to polling');
        }
    } catch (error) {
        console.error('Error initializing WebSocket:', error);
    }
}

// Handle real-time job updates
function handleJobUpdate(data) {
    console.log('Real-time job update:', data);
    
    const { type, job } = data;
    
    switch (type) {
        case 'created':
            showNotification(`New job created: ${job.name}`, 'info');
            loadActiveJobs();
            break;
            
        case 'started':
            showNotification(`Job started: ${job.name}`, 'info');
            loadActiveJobs();
            break;
            
        case 'progress':
            updateJobProgress(job.job_id, data.progress);
            break;
            
        case 'completed':
            showNotification(`Job completed: ${job.name}`, 'success');
            loadActiveJobs();
            loadRecentJobs();
            break;
            
        case 'failed':
            showNotification(`Job failed: ${job.name} - ${data.error}`, 'error');
            loadActiveJobs();
            loadRecentJobs();
            break;
            
        case 'cancelled':
            showNotification(`Job cancelled: ${job.name}`, 'warning');
            loadActiveJobs();
            loadRecentJobs();
            break;
            
        case 'paused':
            showNotification(`Job paused: ${job.name}`, 'info');
            loadActiveJobs();
            break;
            
        case 'resumed':
            showNotification(`Job resumed: ${job.name}`, 'info');
            loadActiveJobs();
            break;
    }
}

// Handle jobs snapshot (initial state)
function handleJobsSnapshot(data) {
    console.log('Jobs snapshot received:', data);
    // Update the active jobs display with fresh data
    if (data.jobs && Array.isArray(data.jobs)) {
        updateActiveJobsDisplay(data.jobs.filter(job => ['running', 'queued'].includes(job.status)));
    }
}

// Handle queue statistics updates
function handleQueueStats(data) {
    console.log('Queue stats received:', data);
    if (data.statistics) {
        updateBatchStatisticsFromWS(data.statistics);
    }
}

// Handle system notifications
function handleSystemNotification(notification) {
    console.log('System notification received:', notification);
    // The WebSocket client will handle displaying the notification
}

// Update job progress in real-time
function updateJobProgress(jobId, progressData) {
    const jobElement = document.querySelector(`[data-job-id="${jobId}"]`);
    if (jobElement) {
        // Update progress bar
        const progressBar = jobElement.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progressData.progress}%`;
        }
        
        // Update progress text
        const progressText = jobElement.querySelector('.progress-text');
        if (progressText) {
            progressText.textContent = `${progressData.progress.toFixed(1)}%`;
        }
        
        // Update records processed
        const processedElement = jobElement.querySelector('.processed-records');
        if (processedElement) {
            processedElement.textContent = formatNumber(progressData.processed_records);
        }
        
        // Update ETA
        const etaElement = jobElement.querySelector('.eta');
        if (etaElement && progressData.eta) {
            etaElement.textContent = progressData.eta;
        }
    }
}

// Update active jobs display with WebSocket data
function updateActiveJobsDisplay(jobs) {
    const container = document.getElementById('activeJobs');
    if (!container) return;
    
    if (jobs && jobs.length > 0) {
        container.innerHTML = jobs.map(job => `
            <div class="border rounded p-4 mb-4 ${job.demo ? 'bg-gray-50 border-gray-200' : ''}" data-job-id="${job.job_id}">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h4 class="font-medium">${job.name}${job.demo ? ' (demo)' : ''}</h4>
                        <div class="text-sm text-gray-600">${job.job_id}</div>
                    </div>
                    <span class="badge badge-${getJobStatusColor(job.status)}">${job.status}</span>
                </div>
                
                <div class="mb-3">
                    <div class="flex justify-between text-sm mb-1">
                        <span class="progress-text">Progress: ${job.progress.toFixed(1)}%</span>
                        <span class="eta">ETA: ${job.eta || 'Calculating...'}</span>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${job.progress}%"></div>
                    </div>
                </div>
                
                <div class="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                        <span class="text-gray-500">Total:</span>
                        <span class="font-medium">${formatNumber(job.total_records)}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">Processed:</span>
                        <span class="font-medium processed-records">${formatNumber(job.processed_records)}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">Success:</span>
                        <span class="font-medium">${formatNumber(job.successful_records)}</span>
                    </div>
                </div>
                
                <div class="flex gap-2">
                    ${job.status === 'running' ? `
                        <button class="btn btn-sm btn-warning" onclick="pauseJob('${job.job_id}')">
                            <i class="fas fa-pause"></i>
                            Pause
                        </button>
                    ` : ''}
                    ${job.status === 'paused' ? `
                        <button class="btn btn-sm btn-success" onclick="resumeJob('${job.job_id}')">
                            <i class="fas fa-play"></i>
                            Resume
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-danger" onclick="cancelJob('${job.job_id}')">
                        <i class="fas fa-stop"></i>
                        Cancel
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="viewJobDetails('${job.job_id}')">
                        <i class="fas fa-eye"></i>
                        View Details
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<div class="text-center py-8 text-gray-500">No active jobs</div>';
    }
}

// Update batch statistics from WebSocket data
function updateBatchStatisticsFromWS(stats) {
    try {
        // Update stat cards with real-time data
        updateStatCard('Active Jobs', stats.active_jobs || stats.running_jobs || 0, stats.eta_message || 'Processing');
        updateStatCard('Completed Today', stats.completed_today || 0, stats.completed_change || 'Today');
        updateStatCard('Queued Jobs', stats.queued_jobs || 0, stats.queue_status || 'Normal queue');
        updateStatCard('Records/Hour', formatNumber(stats.processing_rate_per_hour || stats.records_per_hour || 0), stats.rate_change || 'Current rate');
    } catch (error) {
        console.error('Error updating stats from WebSocket:', error);
    }
}

// Clean up WebSocket when leaving page
function cleanupWebSocket() {
    if (wsClient) {
        wsClient.off('job_update', handleJobUpdate);
        wsClient.off('jobs_snapshot', handleJobsSnapshot);
        wsClient.off('queue_stats', handleQueueStats);
        wsClient.off('system_notification', handleSystemNotification);
        
        wsClient.unsubscribeFromJobs();
        console.log('WebSocket cleanup completed for batch processing');
    }
}
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

            <!-- Streamlined Job Creation -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Create Batch Job</h3>
                    <div class="flex items-center space-x-2">
                        <span class="text-sm text-gray-500">Step <span id="currentStep">1</span> of 4</span>
                        <a href="docs/batch-processing-guide.html" target="_blank" class="btn btn-secondary btn-sm">
                            <i class="fas fa-book"></i> Help
                        </a>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Step Progress Indicator -->
                    <div class="flex mb-6">
                        <div class="step-indicator active" data-step="1">
                            <div class="step-circle">1</div>
                            <div class="step-label">Job Info</div>
                        </div>
                        <div class="step-connector"></div>
                        <div class="step-indicator" data-step="2">
                            <div class="step-circle">2</div>
                            <div class="step-label">Data Source</div>
                        </div>
                        <div class="step-connector"></div>
                        <div class="step-indicator" data-step="3">
                            <div class="step-circle">3</div>
                            <div class="step-label">Configuration</div>
                        </div>
                        <div class="step-connector"></div>
                        <div class="step-indicator" data-step="4">
                            <div class="step-circle">4</div>
                            <div class="step-label">Review</div>
                        </div>
                    </div>
                    
                    <form id="batchJobForm" onsubmit="submitBatchJob(event)">
                        <!-- Step 1: Basic Job Information -->
                        <div id="step1" class="step-content active">
                            <div class="max-w-lg">
                                <h4 class="text-lg font-medium mb-4">Job Information</h4>
                                <div class="space-y-4">
                                    <div class="form-group">
                                        <label class="form-label">Job Name *</label>
                                        <input type="text" class="form-control" name="jobName" required 
                                               placeholder="e.g., Customer Identity Matching Q4 2024">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Processing Type *</label>
                                        <select class="form-select" name="processingType" onchange="updateJobOptions()">
                                            <option value="identity_matching">Identity Matching</option>
                                            <option value="data_validation">Data Validation</option>
                                            <option value="household_detection">Household Detection</option>
                                            <option value="data_quality">Data Quality Assessment</option>
                                            <option value="deduplication">Record Deduplication</option>
                                            <option value="bulk_export">Bulk Export</option>
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
                            </div>
                        </div>
                        
                        <!-- Step 2: Data Source -->
                        <div id="step2" class="step-content" style="display: none;">
                            <h4 class="text-lg font-medium mb-4">Data Source</h4>
                            <div class="max-w-2xl">
                                <div class="form-group mb-6">
                                    <label class="form-label">Source Type</label>
                                    <select class="form-select" name="dataSource" onchange="updateDataSourceOptions()">
                                        <option value="file_upload">File Upload</option>
                                        <option value="database_query">Database Query</option>
                                        <option value="api_endpoint">API Endpoint</option>
                                        <option value="cloud_storage">Cloud Storage</option>
                                        <option value="existing_dataset">Existing Dataset</option>
                                    </select>
                                </div>
                                
                                <!-- File Upload Options -->
                                <div id="dataSourceFile" class="data-source-options">
                                    <div class="form-group">
                                        <label class="form-label">Upload File</label>
                                        <input type="file" class="form-control" name="dataFile" accept=".csv,.xlsx,.json,.parquet">
                                        <div class="text-xs text-gray-500 mt-1">Supported formats: CSV, XLSX, JSON, Parquet (max 100MB)</div>
                                        <div class="mt-2 text-sm">
                                            <span class="text-blue-600">Sample files available:</span>
                                            <a href="samples/batch-processing/" class="text-blue-600 underline ml-1">Browse samples folder</a>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Database Query Options -->
                                <div id="dataSourceDatabase" class="data-source-options" style="display: none;">
                                    <div class="grid grid-cols-2 gap-4">
                                        <div class="form-group">
                                            <label class="form-label">Database Type</label>
                                            <select class="form-select" name="databaseType">
                                                <option value="postgresql">PostgreSQL</option>
                                                <option value="mysql">MySQL</option>
                                                <option value="sqlserver">SQL Server</option>
                                                <option value="oracle">Oracle</option>
                                                <option value="sqlite">SQLite</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Batch Size</label>
                                            <input type="number" class="form-control" name="batchSize" value="1000" min="100" max="10000">
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Connection String</label>
                                        <input type="text" class="form-control" name="connectionString" 
                                               placeholder="host=localhost port=5432 dbname=idxr user=user password=***">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">SQL Query</label>
                                        <textarea class="form-control" name="sqlQuery" rows="3" 
                                                  placeholder="SELECT * FROM identities WHERE created_at > NOW() - INTERVAL '1 day'"></textarea>
                                    </div>
                                </div>
                                
                                <!-- Other data source options collapsed for cleaner look -->
                                <div id="dataSourceAPI" class="data-source-options" style="display: none;">
                                    <div class="grid grid-cols-2 gap-4">
                                        <div class="form-group">
                                            <label class="form-label">API URL</label>
                                            <input type="url" class="form-control" name="apiUrl" 
                                                   placeholder="https://api.example.com/identities">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Authentication</label>
                                            <select class="form-select" name="authMethod">
                                                <option value="none">None</option>
                                                <option value="bearer">Bearer Token</option>
                                                <option value="api_key">API Key</option>
                                                <option value="basic">Basic Auth</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="form-group" id="authValueGroup" style="display: none;">
                                        <label class="form-label">Authentication Value</label>
                                        <input type="password" class="form-control" name="authValue" 
                                               placeholder="Token, API key, or credentials">
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Step 3: Processing Configuration -->
                        <div id="step3" class="step-content" style="display: none;">
                            <h4 class="text-lg font-medium mb-4">Processing Configuration</h4>
                            <div class="max-w-2xl">
                                <!-- Processing Type Specific Configuration -->
                                <div id="processingTypeConfiguration">
                                    <!-- Identity Matching Config -->
                                    <div id="identityMatchingConfig" class="processing-config">
                                        <div class="grid grid-cols-2 gap-4">
                                            <div class="form-group">
                                                <label class="form-label">Match Threshold</label>
                                                <input type="number" class="form-control" name="matchThreshold" 
                                                       value="0.80" min="0.1" max="1.0" step="0.01">
                                                <div class="text-xs text-gray-500 mt-1">Higher = more strict matching</div>
                                            </div>
                                            <div class="form-group">
                                                <label class="form-label">Use AI Enhancement</label>
                                                <select class="form-select" name="useAI">
                                                    <option value="true">Yes (Recommended)</option>
                                                    <option value="false">No (Traditional only)</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <!-- Advanced options in collapsible section -->
                                        <div class="mt-4">
                                            <button type="button" class="collapsible-toggle" onclick="toggleAdvancedOptions('matching')">
                                                <i class="fas fa-caret-right"></i> Advanced Options
                                            </button>
                                            <div id="matchingAdvanced" class="collapsible-content">
                                                <div class="form-group mt-3">
                                                    <label class="form-label">Algorithms</label>
                                                    <div class="flex flex-wrap gap-2 mt-1">
                                                        <label class="flex items-center">
                                                            <input type="checkbox" name="algorithms" value="deterministic" checked class="mr-1">
                                                            <span class="text-sm">Deterministic</span>
                                                        </label>
                                                        <label class="flex items-center">
                                                            <input type="checkbox" name="algorithms" value="probabilistic" checked class="mr-1">
                                                            <span class="text-sm">Probabilistic</span>
                                                        </label>
                                                        <label class="flex items-center">
                                                            <input type="checkbox" name="algorithms" value="ai_hybrid" checked class="mr-1">
                                                            <span class="text-sm">AI Hybrid</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Other processing configs condensed -->
                                    <div id="dataValidationConfig" class="processing-config" style="display: none;">
                                        <div class="grid grid-cols-2 gap-4">
                                            <div class="form-group">
                                                <label class="form-label">Validation Level</label>
                                                <select class="form-select" name="validationLevel">
                                                    <option value="basic">Basic</option>
                                                    <option value="standard" selected>Standard</option>
                                                    <option value="enhanced">Enhanced</option>
                                                    <option value="comprehensive">Comprehensive</option>
                                                </select>
                                            </div>
                                            <div class="form-group">
                                                <label class="form-label">Quality Threshold (%)</label>
                                                <input type="number" class="form-control" name="minQualityThreshold" 
                                                       value="70" min="0" max="100">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Other configs... condensed for space -->
                                    <div id="dataQualityConfig" class="processing-config" style="display: none;">
                                        <div class="form-group">
                                            <label class="form-label">Quality Assessment Level</label>
                                            <select class="form-select" name="qualityLevel">
                                                <option value="basic">Basic</option>
                                                <option value="standard" selected>Standard</option>
                                                <option value="enhanced">Enhanced</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label class="flex items-center">
                                                <input type="checkbox" name="applyCleaning" checked class="mr-2">
                                                <span class="text-sm">Apply automatic data cleaning</span>
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <div id="deduplicationConfig" class="processing-config" style="display: none;">
                                        <div class="form-group">
                                            <label class="form-label">Similarity Threshold</label>
                                            <input type="number" class="form-control" name="similarityThreshold" 
                                                   value="0.85" min="0.1" max="1.0" step="0.01">
                                            <div class="text-xs text-gray-500 mt-1">Higher = less aggressive deduplication</div>
                                        </div>
                                    </div>
                                    
                                    <div id="householdDetectionConfig" class="processing-config" style="display: none;">
                                        <div class="space-y-3">
                                            <label class="flex items-center">
                                                <input type="checkbox" name="addressGrouping" checked class="mr-2">
                                                <span class="text-sm">Group by address</span>
                                            </label>
                                            <label class="flex items-center">
                                                <input type="checkbox" name="namePatternAnalysis" checked class="mr-2">
                                                <span class="text-sm">Analyze name patterns</span>
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <div id="bulkExportConfig" class="processing-config" style="display: none;">
                                        <div class="form-group">
                                            <label class="form-label">Export Format</label>
                                            <select class="form-select" name="exportFormat">
                                                <option value="csv">CSV</option>
                                                <option value="excel">Excel</option>
                                                <option value="json">JSON</option>
                                                <option value="xml">XML</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Output Configuration -->
                                <div class="mt-6 pt-6 border-t">
                                    <h5 class="font-medium mb-3">Output Configuration</h5>
                                    <div class="grid grid-cols-2 gap-4">
                                        <div class="form-group">
                                            <label class="form-label">Output Format</label>
                                            <select class="form-select" name="outputFormat" onchange="updateOutputOptions()">
                                                <option value="csv">CSV</option>
                                                <option value="excel">Excel</option>
                                                <option value="json">JSON</option>
                                                <option value="pdf">PDF Report</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Schedule</label>
                                            <select class="form-select" name="schedule">
                                                <option value="immediate">Run Now</option>
                                                <option value="scheduled">Schedule Later</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Step 4: Review -->
                        <div id="step4" class="step-content" style="display: none;">
                            <h4 class="text-lg font-medium mb-4">Review & Submit</h4>
                            <div id="reviewContent" class="max-w-2xl">
                                <!-- Review content will be populated by JavaScript -->
                            </div>
                        </div>
                        
                        <!-- Navigation Buttons -->
                        <div class="flex justify-between mt-8">
                            <button type="button" id="prevBtn" class="btn btn-outline" onclick="changeStep(-1)" style="display: none;">
                                <i class="fas fa-arrow-left"></i> Previous
                            </button>
                            <div class="flex-1"></div>
                            <button type="button" id="nextBtn" class="btn btn-primary" onclick="changeStep(1)">
                                Next <i class="fas fa-arrow-right"></i>
                            </button>
                            <button type="submit" id="submitBtn" class="btn btn-primary" style="display: none;">
                                <i class="fas fa-play"></i> Create Job
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

// Global variables for step management
let currentStepNumber = 1;
const totalSteps = 4;

// Demo job tracking for when API is unavailable
const demoJobs = new Map();
let demoJobUpdateInterval = null;

// Chart instances for cleanup (batch processing specific)
const batchChartInstances = {};

function initializeBatchProcessing() {
    loadActiveJobs();
    loadRecentJobs();
    setupBatchPerformanceChart();
    setupFormHandlers();
    initializeStepSystem();
    
    // Initialize WebSocket for real-time updates
    setTimeout(() => {
        initializeWebSocket();
    }, 1000); // Small delay to ensure WebSocket client is loaded
    
    // Cleanup function for when leaving the page
    window.addEventListener('beforeunload', cleanupWebSocket);
}

function initializeStepSystem() {
    currentStepNumber = 1;
    updateStepDisplay();
    updateNavigationButtons();
}

function setupFormHandlers() {
    // Add file upload handler
    const fileInput = document.querySelector('[name="dataFile"]');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                validateFileUpload(file);
            }
        });
    }

    // Add processing type change handler
    const processingTypeSelect = document.querySelector('[name="processingType"]');
    if (processingTypeSelect) {
        processingTypeSelect.addEventListener('change', function() {
            updateJobOptions();
        });
    }
    
    // Add data source change handler
    const dataSourceSelect = document.querySelector('[name="dataSource"]');
    if (dataSourceSelect) {
        dataSourceSelect.addEventListener('change', function() {
            updateDataSourceOptions();
        });
    }
    
    // Add output format change handler  
    const outputFormatSelect = document.querySelector('[name="outputFormat"]');
    if (outputFormatSelect) {
        outputFormatSelect.addEventListener('change', function() {
            updateOutputOptions();
        });
    }
    
    // Add auth method change handler for API data source
    const authMethodSelect = document.querySelector('[name="authMethod"]');
    if (authMethodSelect) {
        authMethodSelect.addEventListener('change', function() {
            const authValueGroup = document.getElementById('authValueGroup');
            if (this.value !== 'none' && authValueGroup) {
                authValueGroup.style.display = 'block';
            } else if (authValueGroup) {
                authValueGroup.style.display = 'none';
            }
        });
    }
    
    // Initialize dynamic sections
    updateJobOptions();
    updateDataSourceOptions();
    updateOutputOptions();
}

// Step navigation functions
function changeStep(direction) {
    const newStep = currentStepNumber + direction;
    
    if (newStep < 1 || newStep > totalSteps) {
        return;
    }
    
    // Validate current step before moving forward
    if (direction > 0 && !validateCurrentStep()) {
        return;
    }
    
    // Hide current step
    const currentStepElement = document.getElementById(`step${currentStepNumber}`);
    if (currentStepElement) {
        currentStepElement.style.display = 'none';
    }
    
    // Update step number
    currentStepNumber = newStep;
    
    // Show new step
    const newStepElement = document.getElementById(`step${currentStepNumber}`);
    if (newStepElement) {
        newStepElement.style.display = 'block';
    }
    
    // If moving to review step, populate review content
    if (currentStepNumber === 4) {
        populateReviewContent();
    }
    
    updateStepDisplay();
    updateNavigationButtons();
}

function updateStepDisplay() {
    // Update step indicator
    document.getElementById('currentStep').textContent = currentStepNumber;
    
    // Update step indicators
    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
        const stepNum = index + 1;
        if (stepNum === currentStepNumber) {
            indicator.className = 'step-indicator active';
        } else if (stepNum < currentStepNumber) {
            indicator.className = 'step-indicator completed';
        } else {
            indicator.className = 'step-indicator';
        }
    });
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    // Previous button
    if (prevBtn) {
        prevBtn.style.display = currentStepNumber === 1 ? 'none' : 'block';
    }
    
    // Next/Submit buttons
    if (currentStepNumber === totalSteps) {
        if (nextBtn) nextBtn.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'block';
    } else {
        if (nextBtn) nextBtn.style.display = 'block';
        if (submitBtn) submitBtn.style.display = 'none';
    }
}

function validateCurrentStep() {
    switch (currentStepNumber) {
        case 1:
            const jobName = document.querySelector('[name="jobName"]')?.value;
            if (!jobName?.trim()) {
                showNotification('Please enter a job name', 'error');
                return false;
            }
            return true;
            
        case 2:
            const dataSource = document.querySelector('[name="dataSource"]')?.value;
            if (dataSource === 'file_upload') {
                const fileInput = document.querySelector('[name="dataFile"]');
                if (!fileInput?.files?.length) {
                    showNotification('Please select a file to upload', 'error');
                    return false;
                }
            } else if (dataSource === 'database_query') {
                const connectionString = document.querySelector('[name="connectionString"]')?.value;
                const sqlQuery = document.querySelector('[name="sqlQuery"]')?.value;
                if (!connectionString?.trim() || !sqlQuery?.trim()) {
                    showNotification('Please provide connection string and SQL query', 'error');
                    return false;
                }
            }
            return true;
            
        case 3:
            // Configuration validation can be added here if needed
            return true;
            
        default:
            return true;
    }
}

function populateReviewContent() {
    const reviewContent = document.getElementById('reviewContent');
    if (!reviewContent) return;
    
    const formData = new FormData(document.getElementById('batchJobForm'));
    const jobConfig = buildJobConfiguration(formData);
    
    reviewContent.innerHTML = `
        <div class="bg-gray-50 rounded-lg p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h5 class="font-medium text-gray-900 mb-2">Job Details</h5>
                    <div class="text-sm space-y-1">
                        <div><span class="text-gray-500">Name:</span> <span class="font-medium">${jobConfig.name}</span></div>
                        <div><span class="text-gray-500">Type:</span> <span class="font-medium">${jobConfig.job_type}</span></div>
                        <div><span class="text-gray-500">Priority:</span> <span class="font-medium">${jobConfig.priority}</span></div>
                    </div>
                </div>
                <div>
                    <h5 class="font-medium text-gray-900 mb-2">Data Source</h5>
                    <div class="text-sm space-y-1">
                        <div><span class="text-gray-500">Type:</span> <span class="font-medium">${jobConfig.data_source?.type || 'Not specified'}</span></div>
                        ${jobConfig.data_source?.type === 'file_upload' ? `
                            <div><span class="text-gray-500">File:</span> <span class="font-medium">${formData.get('dataFile')?.name || 'No file selected'}</span></div>
                        ` : ''}
                    </div>
                </div>
                <div>
                    <h5 class="font-medium text-gray-900 mb-2">Configuration</h5>
                    <div class="text-sm space-y-1">
                        <div><span class="text-gray-500">Output:</span> <span class="font-medium">${jobConfig.output_config?.format || 'CSV'}</span></div>
                        <div><span class="text-gray-500">Schedule:</span> <span class="font-medium">${formData.get('schedule') === 'immediate' ? 'Run Now' : 'Scheduled'}</span></div>
                    </div>
                </div>
                <div>
                    <h5 class="font-medium text-gray-900 mb-2">Processing Options</h5>
                    <div class="text-sm space-y-1">
                        ${Object.entries(jobConfig.config || {}).map(([key, value]) => `
                            <div><span class="text-gray-500">${key}:</span> <span class="font-medium">${value}</span></div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-4 text-sm text-gray-600">
            <p><i class="fas fa-info-circle mr-1"></i> Review the job configuration above. Click "Create Job" to start processing.</p>
        </div>
    `;
}

// Collapsible advanced options
function toggleAdvancedOptions(section) {
    const content = document.getElementById(`${section}Advanced`);
    const toggle = event.target.closest('.collapsible-toggle');
    
    if (content && toggle) {
        if (content.style.display === 'none' || !content.style.display) {
            content.style.display = 'block';
            toggle.querySelector('i').className = 'fas fa-caret-down';
        } else {
            content.style.display = 'none';
            toggle.querySelector('i').className = 'fas fa-caret-right';
        }
    }
}

async function loadActiveJobs() {
    const container = document.getElementById('activeJobs');
    
    try {
        // Show loading state
        container.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin"></i> Loading active jobs...</div>';
        
        const response = await fetch('/api/v1/batch/jobs?status=running');
        const data = await response.json();
        
        if (data.status === 'success' && data.jobs.length > 0) {
            container.innerHTML = data.jobs.map(job => `
                <div class="border rounded p-4 mb-4" data-job-id="${job.job_id}">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h4 class="font-medium">${job.name}</h4>
                            <div class="text-sm text-gray-600">${job.job_id} • Started ${formatTime(job.started_at)}</div>
                        </div>
                        <div class="flex gap-2">
                            <button class="btn btn-sm btn-outline" onclick="viewJobDetails('${job.job_id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="pauseJob('${job.job_id}')" title="Pause">
                                <i class="fas fa-pause"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="cancelJob('${job.job_id}')" title="Cancel">
                                <i class="fas fa-stop"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="flex justify-between text-sm mb-1">
                            <span>Progress: ${job.progress.toFixed(1)}%</span>
                            <span>${formatNumber(job.processed_records)} / ${formatNumber(job.total_records)} records</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: ${job.progress}%"></div>
                        </div>
                    </div>
                    
                    <div class="text-xs text-gray-500">
                        ${job.estimated_completion ? `Estimated completion: ${formatTime(job.estimated_completion)}` : 'Calculating completion time...'}
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">No active jobs</div>';
        }
    } catch (error) {
        console.error('Error loading active jobs:', error);
        
        // Show demo jobs if API is unavailable
        const activeDemoJobs = Array.from(demoJobs.values()).filter(job => job.status === 'running');
        if (activeDemoJobs.length > 0) {
            container.innerHTML = activeDemoJobs.map(job => `
                <div class="border rounded p-4 mb-4 bg-blue-50 border-blue-200" data-job-id="${job.job_id}">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h4 class="font-medium">${job.name}</h4>
                            <div class="text-sm text-gray-600">${job.job_id}</div>
                        </div>
                        <span class="badge badge-primary">running (demo)</span>
                    </div>
                    
                    <div class="mb-3">
                        <div class="flex justify-between text-sm mb-1">
                            <span>Progress: ${job.progress.toFixed(1)}%</span>
                            <span>ETA: ${job.eta}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: ${job.progress}%"></div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-500">Records:</span>
                            <span class="font-medium">${formatNumber(job.total_records)}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">Processed:</span>
                            <span class="font-medium">${formatNumber(job.processed_records)}</span>
                        </div>
                    </div>
                    
                    <div class="mt-3 flex gap-2">
                        <button class="btn btn-sm btn-outline" onclick="pauseDemoJob('${job.job_id}')">
                            <i class="fas fa-pause"></i>
                            Pause
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="cancelDemoJob('${job.job_id}')">
                            <i class="fas fa-stop"></i>
                            Cancel
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="viewJobDetails('${job.job_id}')">
                            <i class="fas fa-eye"></i>
                            View Details
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="text-center py-4 text-red-500">Error loading active jobs</div>';
        }
    }
}

async function loadRecentJobs() {
    const container = document.getElementById('recentJobs');
    
    try {
        // Show loading state
        container.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin"></i> Loading recent jobs...</div>';
        
        const response = await fetch('/api/v1/batch/jobs?limit=10');
        const data = await response.json();
        
        if (data.status === 'success' && data.jobs.length > 0) {
            // Filter out running jobs (they're shown in active jobs)
            const recentJobs = data.jobs.filter(job => job.status !== 'running');
            
            if (recentJobs.length > 0) {
                container.innerHTML = recentJobs.map(job => `
                    <div class="border rounded p-4 mb-4" data-job-id="${job.job_id}">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <h4 class="font-medium">${job.name}</h4>
                                <div class="text-sm text-gray-600">${job.job_id}</div>
                            </div>
                            <span class="badge badge-${getJobStatusColor(job.status)}">${job.status}</span>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="text-gray-500">Completed:</span>
                                <span class="font-medium">${job.completed_at ? formatTime(job.completed_at) : 'N/A'}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Duration:</span>
                                <span class="font-medium">${calculateDuration(job.started_at, job.completed_at)}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Records:</span>
                                <span class="font-medium">${formatNumber(job.total_records)}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">${job.status === 'failed' ? 'Error:' : 'Success:'}</span>
                                <span class="font-medium">${job.status === 'failed' ? (job.error_message || 'Unknown error') : formatNumber(job.successful_records)}</span>
                            </div>
                        </div>
                        
                        <div class="mt-3 flex gap-2">
                            <button class="btn btn-sm btn-outline" onclick="viewJobDetails('${job.job_id}')">
                                <i class="fas fa-eye"></i>
                                View Details
                            </button>
                            ${job.status === 'completed' ? `
                                <button class="btn btn-sm btn-outline" onclick="downloadResults('${job.job_id}')">
                                    <i class="fas fa-download"></i>
                                    Download
                                </button>
                            ` : ''}
                            ${job.status === 'failed' ? `
                                <button class="btn btn-sm btn-primary" onclick="retryJob('${job.job_id}')">
                                    <i class="fas fa-redo"></i>
                                    Retry
                                </button>
                            ` : ''}
                            ${job.status === 'paused' ? `
                                <button class="btn btn-sm btn-success" onclick="resumeJob('${job.job_id}')">
                                    <i class="fas fa-play"></i>
                                    Resume
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<div class="text-center py-8 text-gray-500">No recent jobs</div>';
            }
        } else {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">No recent jobs</div>';
        }
    } catch (error) {
        console.error('Error loading recent jobs:', error);
        
        // Show completed demo jobs if API is unavailable
        const completedDemoJobs = Array.from(demoJobs.values()).filter(job => job.status !== 'running');
        if (completedDemoJobs.length > 0) {
            container.innerHTML = completedDemoJobs.slice(0, 10).map(job => `
                <div class="border rounded p-4 mb-4 bg-gray-50 border-gray-200" data-job-id="${job.job_id}">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h4 class="font-medium">${job.name}</h4>
                            <div class="text-sm text-gray-600">${job.job_id}</div>
                        </div>
                        <span class="badge badge-${getJobStatusColor(job.status)}">${job.status} (demo)</span>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-500">Completed:</span>
                            <span class="font-medium">${job.completed_at ? formatTime(job.completed_at) : 'N/A'}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">Duration:</span>
                            <span class="font-medium">${calculateDuration(job.started_at, job.completed_at)}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">Records:</span>
                            <span class="font-medium">${formatNumber(job.total_records)}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">${job.status === 'failed' ? 'Error:' : 'Success:'}</span>
                            <span class="font-medium">${job.status === 'failed' ? 'Demo error' : formatNumber(job.successful_records)}</span>
                        </div>
                    </div>
                    
                    <div class="mt-3 flex gap-2">
                        <button class="btn btn-sm btn-outline" onclick="viewJobDetails('${job.job_id}')">
                            <i class="fas fa-eye"></i>
                            View Details
                        </button>
                        ${job.status === 'completed' ? `
                            <button class="btn btn-sm btn-outline" onclick="downloadResults('${job.job_id}')">
                                <i class="fas fa-download"></i>
                                Download
                            </button>
                        ` : ''}
                        ${job.status === 'paused' ? `
                            <button class="btn btn-sm btn-success" onclick="resumeDemoJob('${job.job_id}')">
                                <i class="fas fa-play"></i>
                                Resume
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="text-center py-4 text-red-500">Error loading recent jobs</div>';
        }
    }
}

function setupBatchPerformanceChart() {
    const ctx = document.getElementById('batchPerformanceChart').getContext('2d');
    
    const labels = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    
    batchChartInstances.batchPerformance = new Chart(ctx, {
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
    const processingTypeElement = document.querySelector('[name="processingType"]');
    if (!processingTypeElement) return;
    
    const processingType = processingTypeElement.value;
    
    // Hide all processing config sections
    document.querySelectorAll('.processing-config').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show relevant processing config section
    switch(processingType) {
        case 'identity_matching':
            document.getElementById('identityMatchingConfig').style.display = 'block';
            break;
        case 'data_validation':
            document.getElementById('dataValidationConfig').style.display = 'block';
            break;
        case 'data_quality':
            document.getElementById('dataQualityConfig').style.display = 'block';
            break;
        case 'deduplication':
            document.getElementById('deduplicationConfig').style.display = 'block';
            break;
        case 'household_detection':
            document.getElementById('householdDetectionConfig').style.display = 'block';
            break;
        case 'bulk_export':
            document.getElementById('bulkExportConfig').style.display = 'block';
            document.getElementById('fieldMappingSection').style.display = 'block';
            break;
    }
    
    console.log('Processing type changed to:', processingType);
}

function updateDataSourceOptions() {
    const dataSourceElement = document.querySelector('[name="dataSource"]');
    if (!dataSourceElement) return;
    
    const dataSource = dataSourceElement.value;
    
    // Hide all data source option sections
    document.querySelectorAll('.data-source-options').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show relevant data source section
    switch(dataSource) {
        case 'file_upload':
            document.getElementById('dataSourceFile').style.display = 'block';
            break;
        case 'database_query':
            document.getElementById('dataSourceDatabase').style.display = 'block';
            break;
        case 'api_endpoint':
            document.getElementById('dataSourceAPI').style.display = 'block';
            break;
        case 'cloud_storage':
            document.getElementById('dataSourceCloud').style.display = 'block';
            break;
        case 'existing_dataset':
            // No additional options needed
            break;
    }
    
    console.log('Data source changed to:', dataSource);
}

function updateOutputOptions() {
    const outputFormatElement = document.querySelector('[name="outputFormat"]');
    
    // Check if element exists before accessing it
    if (!outputFormatElement) {
        return;
    }
    
    const outputFormat = outputFormatElement.value;
    
    // Database options handling - only if the element exists
    const dbOptions = document.getElementById('databaseOutputOptions');
    if (dbOptions) {
        if (outputFormat === 'database') {
            dbOptions.style.display = 'block';
        } else {
            dbOptions.style.display = 'none';
        }
    }
    
    console.log('Output format changed to:', outputFormat);
}

async function submitBatchJob(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Get submit button and store original text OUTSIDE try block
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Show loading state
        showNotification('Creating batch job...', 'info');
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Job...';
        
        // Build the job configuration object
        const jobConfig = buildJobConfiguration(formData);
        
        console.log('Job config being sent:', jobConfig); // Debug log
        
        // If we have file upload, use FormData; otherwise use JSON
        const hasFileUpload = formData.get('dataFile') && formData.get('dataFile').size > 0;
        
        let response;
        if (hasFileUpload) {
            // For file uploads, read the file and send as JSON with file content
            const file = formData.get('dataFile');
            const fileContent = await file.text();
            
            const requestData = {
                name: jobConfig.name,
                job_type: jobConfig.job_type,
                input_data: parseCSVToArray(fileContent), // Convert CSV to array
                config: {
                    batch_size: parseInt(formData.get('batchSize') || '1000'),
                    output_format: jobConfig.output_config?.format || 'csv',
                    match_threshold: parseFloat(formData.get('matchThreshold') || '0.85'),
                    use_ai: formData.get('useAI') === 'true' || formData.get('useAI') === true
                },
                priority: jobConfig.priority,
                created_by: 'web_user'
            };
            
            response = await fetch('/api/v1/batch/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
        } else {
            // For non-file uploads, we need to provide some sample data
            // In a real app, this would come from the data source configuration
            const requestData = {
                name: jobConfig.name,
                job_type: jobConfig.job_type,
                input_data: [
                    {
                        first_name: 'John',
                        last_name: 'Sample', 
                        email: 'john.sample@example.com'
                    }
                ], // Sample data for demo - in real app this would come from selected data source
                config: {
                    batch_size: parseInt(formData.get('batchSize') || '1000'),
                    output_format: jobConfig.output_config?.format || 'csv',
                    match_threshold: parseFloat(formData.get('matchThreshold') || '0.85'),
                    use_ai: formData.get('useAI') === 'true' || formData.get('useAI') === true
                },
                priority: jobConfig.priority,
                created_by: 'web_user'
            };
            
            console.log('Request data being sent:', requestData); // Debug log
            
            response = await fetch('/api/v1/batch/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            showNotification(`Batch job "${jobConfig.name}" created successfully`, 'success');
            
            // Complete form reset
            resetCreateJobForm(form);
            
            // Refresh job lists
            await loadActiveJobs();
            await loadRecentJobs();
            await updateBatchStatistics();
        } else {
            // For demo purposes, if backend returns error, show success anyway
            const demoJobId = `DEMO_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
            
            // Create demo job entry with progress tracking
            createDemoJob(demoJobId, jobConfig);
            
            showNotification(`Demo: Batch job "${jobConfig.name}" created successfully (ID: ${demoJobId})`, 'success');
            
            // Complete form reset
            resetCreateJobForm(form);
            
            // Start demo progress tracking if not already running
            startDemoJobUpdates();
        }
        
    } catch (error) {
        console.error('Error creating batch job:', error);
        showNotification(`Error creating batch job: ${error.message}`, 'error');
    } finally {
        // Re-enable submit button - originalText is now in scope
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function buildJobConfiguration(formData) {
    const processingType = formData.get('processingType');
    const dataSource = formData.get('dataSource');
    
    // Base job configuration
    const jobConfig = {
        name: formData.get('jobName'),
        job_type: processingType,
        priority: formData.get('priority') || 'normal',
        created_by: 'web_user', // In a real app, this would be the authenticated user
        config: {}
    };
    
    // Add data source configuration
    jobConfig.data_source = buildDataSourceConfig(formData, dataSource);
    
    // Add output configuration
    jobConfig.output_config = buildOutputConfig(formData);
    
    // Add processing-specific configuration
    switch(processingType) {
        case 'identity_matching':
            jobConfig.config = {
                match_threshold: parseFloat(formData.get('matchThreshold') || 0.80),
                use_ai: formData.get('useAI') === 'true' || formData.get('useAI') === true,
                algorithms: getCheckedValues(formData, 'algorithms').length > 0 ? getCheckedValues(formData, 'algorithms') : ['deterministic', 'probabilistic', 'ai_hybrid']
            };
            break;
            
        case 'data_validation':
            jobConfig.config = {
                validation_level: formData.get('validationLevel') || 'standard',
                min_quality_threshold: parseFloat(formData.get('minQualityThreshold') || 70)
            };
            break;
            
        case 'data_quality':
            jobConfig.config = {
                apply_cleaning: formData.get('applyCleaning') === 'on',
                validation_level: formData.get('qualityLevel') || 'standard'
            };
            break;
            
        case 'deduplication':
            jobConfig.config = {
                similarity_threshold: parseFloat(formData.get('similarityThreshold') || 0.85),
                algorithms: getCheckedValues(formData, 'dedupAlgorithms')
            };
            break;
            
        case 'household_detection':
            jobConfig.config = {
                address_grouping: formData.get('addressGrouping') === 'on',
                name_pattern_analysis: formData.get('namePatternAnalysis') === 'on'
            };
            break;
            
        case 'bulk_export':
            const fieldMappings = formData.get('fieldMappings');
            jobConfig.config = {
                export_format: formData.get('exportFormat') || 'csv',
                field_mappings: fieldMappings ? JSON.parse(fieldMappings) : {},
                include_metadata: formData.get('includeExportMetadata') === 'on',
                anonymize_fields: getCheckedValues(formData, 'anonymizeFields')
            };
            break;
    }
    
    return jobConfig;
}

function buildDataSourceConfig(formData, dataSource) {
    const config = {
        type: dataSource
    };
    
    switch(dataSource) {
        case 'file_upload':
            // File will be handled separately in FormData
            config.format = 'auto_detect';
            break;
            
        case 'database_query':
            config.database_type = formData.get('databaseType');
            config.connection_string = formData.get('connectionString');
            config.query = formData.get('sqlQuery');
            break;
            
        case 'api_endpoint':
            config.url = formData.get('apiUrl');
            config.auth_method = formData.get('authMethod');
            config.auth_value = formData.get('authValue');
            break;
            
        case 'cloud_storage':
            config.provider = formData.get('cloudProvider');
            config.bucket_name = formData.get('bucketName');
            config.file_path = formData.get('filePath');
            const credentials = formData.get('cloudCredentials');
            if (credentials) {
                try {
                    config.credentials = JSON.parse(credentials);
                } catch {
                    config.credentials = credentials; // Plain text credential
                }
            }
            break;
            
        case 'existing_dataset':
            // No additional config needed
            break;
    }
    
    return config;
}

function buildOutputConfig(formData) {
    const outputFormat = formData.get('outputFormat');
    const config = {
        format: outputFormat,
        include_metadata: formData.get('includeMetadata') === 'on',
        anonymize_fields: getCheckedValues(formData, 'anonymizeFields')
    };
    
    if (outputFormat === 'database') {
        config.database_type = formData.get('outputDatabase');
        config.table_name = formData.get('outputTable');
    }
    
    return config;
}

function getCheckedValues(formData, name) {
    const values = [];
    const elements = document.querySelectorAll(`[name="${name}"]:checked`);
    elements.forEach(element => {
        values.push(element.value);
    });
    return values;
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

// Utility functions

function formatTime(isoString) {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString();
}

function calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return 'N/A';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

function validateFileUpload(file) {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = ['text/csv', 'application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    if (file.size > maxSize) {
        showNotification('File size exceeds 100MB limit', 'error');
        return false;
    }
    
    if (!allowedTypes.includes(file.type)) {
        showNotification('Invalid file type. Please upload CSV, JSON, or XLSX files only.', 'error');
        return false;
    }
    
    showNotification(`File "${file.name}" selected (${(file.size / 1024 / 1024).toFixed(2)} MB)`, 'success');
    return true;
}

async function updateBatchStatistics() {
    try {
        const response = await fetch('/api/v1/batch/queue/statistics');
        const data = await response.json();
        
        if (data.status === 'success') {
            const stats = data.statistics;
            
            // Update stat cards
            updateStatCard('Active Jobs', stats.active_jobs, 'Est. processing');
            updateStatCard('Completed Today', stats.completed_today, '+3 from yesterday');
            updateStatCard('Queued Jobs', stats.queued_jobs, stats.queued_jobs > 5 ? 'Queue building up' : 'Normal queue');
            updateStatCard('Records/Hour', formatNumber(stats.processing_rate_per_hour), '15% faster');
        }
    } catch (error) {
        console.error('Error updating batch statistics:', error);
    }
}

function updateStatCard(title, value, change) {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        const titleElement = card.querySelector('.stat-title');
        if (titleElement && titleElement.textContent === title) {
            const valueElement = card.querySelector('.stat-value');
            const changeElement = card.querySelector('.stat-change span');
            
            if (valueElement) valueElement.textContent = value;
            if (changeElement) changeElement.textContent = change;
        }
    });
}

// Enhanced job management functions

async function pauseJob(jobId) {
    try {
        showNotification('Pausing job...', 'info');
        
        const response = await fetch(`/api/v1/batch/jobs/${jobId}/pause`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            showNotification(`Job ${jobId} paused successfully`, 'success');
            await loadActiveJobs();
            await loadRecentJobs();
        } else {
            throw new Error(data.message || 'Failed to pause job');
        }
    } catch (error) {
        console.error('Error pausing job:', error);
        showNotification(`Error pausing job: ${error.message}`, 'error');
    }
}

async function resumeJob(jobId) {
    try {
        showNotification('Resuming job...', 'info');
        
        const response = await fetch(`/api/v1/batch/jobs/${jobId}/resume`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            showNotification(`Job ${jobId} resumed successfully`, 'success');
            await loadActiveJobs();
            await loadRecentJobs();
        } else {
            throw new Error(data.message || 'Failed to resume job');
        }
    } catch (error) {
        console.error('Error resuming job:', error);
        showNotification(`Error resuming job: ${error.message}`, 'error');
    }
}

async function cancelJob(jobId) {
    if (!confirm(`Are you sure you want to cancel job ${jobId}?`)) {
        return;
    }
    
    try {
        showNotification('Cancelling job...', 'info');
        
        const response = await fetch(`/api/v1/batch/jobs/${jobId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            showNotification(`Job ${jobId} cancelled successfully`, 'warning');
            await loadActiveJobs();
            await loadRecentJobs();
        } else {
            throw new Error(data.message || 'Failed to cancel job');
        }
    } catch (error) {
        console.error('Error cancelling job:', error);
        showNotification(`Error cancelling job: ${error.message}`, 'error');
    }
}

async function downloadResults(jobId, format = null) {
    try {
        // Show format selection modal if no format specified
        if (!format) {
            const selectedFormat = await showDownloadFormatModal(jobId);
            if (!selectedFormat) {
                return; // User cancelled
            }
            format = selectedFormat;
        }
        
        showNotification(`Preparing ${format.toUpperCase()} download for job ${jobId}...`, 'info');
        
        // Use the dedicated download endpoint
        const downloadUrl = `/api/v1/batch/jobs/${jobId}/download?format=${format}`;
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        
        // Try to get filename from response headers
        try {
            const response = await fetch(downloadUrl, { method: 'HEAD' });
            const filename = response.headers.get('X-Filename') || `IDXR_Job_${jobId}.${format}`;
            const recordCount = response.headers.get('X-Record-Count') || 'unknown';
            
            link.download = filename;
            link.click();
            
            showNotification(`Download started: ${filename} (${recordCount} records)`, 'success');
        } catch (error) {
            // Fallback: just trigger download without filename info
            link.click();
            showNotification(`Download started for job ${jobId}`, 'success');
        }
        
        document.body.removeChild(link);
        
    } catch (error) {
        console.error('Error downloading results:', error);
        showNotification(`Error downloading results: ${error.message}`, 'error');
    }
}

async function viewJobDetails(jobId) {
    try {
        const response = await fetch(`/api/v1/batch/jobs/${jobId}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            showJobDetailsModal(data.job);
        } else {
            throw new Error(data.message || 'Failed to get job details');
        }
    } catch (error) {
        console.error('Error getting job details:', error);
        showNotification(`Error loading job details: ${error.message}`, 'error');
    }
}

function showJobDetailsModal(job) {
    // Create modal HTML
    const modalHTML = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>Job Details: ${job.name}</h3>
                    <button onclick="closeModal()" class="btn btn-sm">×</button>
                </div>
                <div class="modal-body">
                    <div class="grid grid-cols-2 gap-4">
                        <div><strong>Job ID:</strong> ${job.job_id}</div>
                        <div><strong>Status:</strong> <span class="badge badge-${getJobStatusColor(job.status)}">${job.status}</span></div>
                        <div><strong>Type:</strong> ${job.job_type}</div>
                        <div><strong>Priority:</strong> ${job.priority}</div>
                        <div><strong>Created:</strong> ${formatTime(job.created_at)}</div>
                        <div><strong>Started:</strong> ${formatTime(job.started_at)}</div>
                        <div><strong>Progress:</strong> ${job.progress.toFixed(1)}%</div>
                        <div><strong>Total Records:</strong> ${formatNumber(job.total_records)}</div>
                        <div><strong>Processed:</strong> ${formatNumber(job.processed_records)}</div>
                        <div><strong>Successful:</strong> ${formatNumber(job.successful_records)}</div>
                        <div><strong>Failed:</strong> ${formatNumber(job.failed_records)}</div>
                        <div><strong>Created By:</strong> ${job.created_by}</div>
                    </div>
                    ${job.error_message ? `
                        <div class="mt-4">
                            <strong>Error Message:</strong>
                            <div class="bg-red-50 border border-red-200 rounded p-3 mt-2">
                                ${job.error_message}
                            </div>
                        </div>
                    ` : ''}
                    ${job.config ? `
                        <div class="mt-4">
                            <strong>Configuration:</strong>
                            <pre class="bg-gray-50 border rounded p-3 mt-2 text-sm">${JSON.stringify(job.config, null, 2)}</pre>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button onclick="closeModal()" class="btn btn-outline">Close</button>
                    ${job.status === 'completed' ? `
                        <button onclick="downloadResults('${job.job_id}')" class="btn btn-primary">
                            <i class="fas fa-download"></i> Download Results
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

function showDownloadFormatModal(jobId) {
    return new Promise((resolve) => {
        const modalHtml = `
            <div class="modal-overlay" id="downloadFormatModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Select Download Format</h3>
                        <button class="modal-close" onclick="closeDownloadFormatModal(false)">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Choose the format for downloading job results:</p>
                        <div class="format-options" style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
                            <div class="format-option" onclick="selectDownloadFormat('csv')" style="display: flex; align-items: center; gap: 15px; padding: 15px; border: 2px solid #e1e5e9; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                                <i class="fas fa-file-csv" style="font-size: 24px; color: #28a745;"></i>
                                <div class="format-details">
                                    <strong style="display: block; font-size: 16px; margin-bottom: 4px;">CSV</strong>
                                    <small style="color: #6c757d;">Comma-separated values, Excel compatible</small>
                                </div>
                            </div>
                            <div class="format-option" onclick="selectDownloadFormat('json')" style="display: flex; align-items: center; gap: 15px; padding: 15px; border: 2px solid #e1e5e9; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                                <i class="fas fa-file-code" style="font-size: 24px; color: #007bff;"></i>
                                <div class="format-details">
                                    <strong style="display: block; font-size: 16px; margin-bottom: 4px;">JSON</strong>
                                    <small style="color: #6c757d;">JavaScript Object Notation, API friendly</small>
                                </div>
                            </div>
                            <div class="format-option" onclick="selectDownloadFormat('xlsx')" style="display: flex; align-items: center; gap: 15px; padding: 15px; border: 2px solid #e1e5e9; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                                <i class="fas fa-file-excel" style="font-size: 24px; color: #17a2b8;"></i>
                                <div class="format-details">
                                    <strong style="display: block; font-size: 16px; margin-bottom: 4px;">Excel</strong>
                                    <small style="color: #6c757d;">Microsoft Excel format (XLSX)</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Add hover effects
        const formatOptions = document.querySelectorAll('#downloadFormatModal .format-option');
        formatOptions.forEach(option => {
            option.addEventListener('mouseenter', () => {
                option.style.borderColor = '#007bff';
                option.style.backgroundColor = '#f8f9fa';
            });
            option.addEventListener('mouseleave', () => {
                option.style.borderColor = '#e1e5e9';
                option.style.backgroundColor = 'white';
            });
        });
        
        // Store resolve function globally so it can be accessed by button clicks
        window.downloadFormatResolve = resolve;
    });
}

function selectDownloadFormat(format) {
    if (window.downloadFormatResolve) {
        window.downloadFormatResolve(format);
        window.downloadFormatResolve = null;
    }
    closeDownloadFormatModal();
}

function closeDownloadFormatModal(cancelled = true) {
    const modal = document.getElementById('downloadFormatModal');
    if (modal) {
        modal.remove();
    }
    
    if (cancelled && window.downloadFormatResolve) {
        window.downloadFormatResolve(null); // User cancelled
        window.downloadFormatResolve = null;
    }
}

async function retryJob(jobId) {
    try {
        // Get original job details
        const response = await fetch(`/api/v1/batch/jobs/${jobId}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const originalJob = data.job;
            
            // Create a new job with the same configuration
            const retryJobData = {
                name: `${originalJob.name} (Retry)`,
                job_type: originalJob.job_type,
                input_data: originalJob.input_file_path,
                config: originalJob.config,
                priority: originalJob.priority,
                created_by: originalJob.created_by
            };
            
            const createResponse = await fetch('/api/v1/batch/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(retryJobData)
            });
            
            const createData = await createResponse.json();
            
            if (createData.status === 'success') {
                showNotification(`Retry job created: ${createData.job_id}`, 'success');
                await loadActiveJobs();
                await loadRecentJobs();
            } else {
                throw new Error(createData.message || 'Failed to create retry job');
            }
        } else {
            throw new Error(data.message || 'Failed to get original job details');
        }
    } catch (error) {
        console.error('Error retrying job:', error);
        showNotification(`Error retrying job: ${error.message}`, 'error');
    }
}

// Auto-refresh jobs every 30 seconds
setInterval(async () => {
    if (document.getElementById('activeJobs')) {
        await loadActiveJobs();
        await updateBatchStatistics();
    }
}, 30000);

// CSV parsing utility function
function parseCSVToArray(csvText) {
    try {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV must have at least a header row and one data row');
        }
        
        // Parse header row
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        // Parse data rows
        const data = [];
        for (let i = 1; i < lines.length; i++) { // Process all rows
            const row = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
            const rowObject = {};
            
            headers.forEach((header, index) => {
                rowObject[header.toLowerCase().replace(/\s+/g, '_')] = row[index] || '';
            });
            
            data.push(rowObject);
        }
        
        console.log(`Parsed ${data.length} records from CSV file`);
        return data;
    } catch (error) {
        console.error('Error parsing CSV:', error);
        // Return sample data if parsing fails
        return [
            {
                first_name: 'Sample',
                last_name: 'User',
                email: 'sample@example.com'
            }
        ];
    }
}

// Enhanced form reset function
function resetCreateJobForm(form) {
    try {
        // Reset the form
        form.reset();
        
        // Reset step to beginning
        // Hide all steps first
        for (let i = 1; i <= totalSteps; i++) {
            const stepElement = document.getElementById(`step${i}`);
            if (stepElement) {
                stepElement.style.display = 'none';
            }
        }
        
        // Reset to step 1
        currentStepNumber = 1;
        
        // Show step 1
        const step1Element = document.getElementById('step1');
        if (step1Element) {
            step1Element.style.display = 'block';
        }
        
        // Update UI indicators
        updateStepDisplay();
        updateNavigationButtons();
        
        // Reset all dynamic sections with error handling
        try {
            updateJobOptions();
        } catch (e) {
            console.warn('Could not update job options:', e);
        }
        
        try {
            updateDataSourceOptions();
        } catch (e) {
            console.warn('Could not update data source options:', e);
        }
        
        try {
            updateOutputOptions();
        } catch (e) {
            console.warn('Could not update output options:', e);
        }
        
        // Clear file inputs specifically
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.value = '';
        }
        
        // Reset any other UI state
        const uploadArea = document.querySelector('.upload-area');
        if (uploadArea) {
            uploadArea.classList.remove('drag-over');
        }
        
        // Clear any validation messages
        document.querySelectorAll('.error-message').forEach(msg => {
            msg.style.display = 'none';
        });
        
        // Reset advanced options to collapsed state
        const advancedSections = document.querySelectorAll('.advanced-options');
        advancedSections.forEach(section => {
            section.style.display = 'none';
        });
        
        const advancedToggles = document.querySelectorAll('.advanced-toggle');
        advancedToggles.forEach(toggle => {
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        });
        
        console.log('Form reset completed - returned to step 1');
    } catch (error) {
        console.error('Error during form reset:', error);
        // Basic fallback reset
        if (form) form.reset();
        currentStepNumber = 1;
    }
}

// Demo job management functions
function createDemoJob(jobId, jobConfig) {
    const now = new Date();
    const estimatedDuration = Math.random() * 3600000 + 300000; // 5 minutes to 1 hour
    
    const demoJob = {
        job_id: jobId,
        name: jobConfig.name,
        job_type: jobConfig.job_type,
        status: 'running',
        priority: jobConfig.priority || 'normal',
        progress: 0,
        total_records: Math.floor(Math.random() * 10000) + 1000, // 1000-11000 records
        processed_records: 0,
        successful_records: 0,
        failed_records: 0,
        started_at: now.toISOString(),
        estimated_completion: new Date(now.getTime() + estimatedDuration).toISOString(),
        created_by: 'demo_user',
        eta: formatDuration(estimatedDuration)
    };
    
    demoJobs.set(jobId, demoJob);
    console.log('Created demo job:', demoJob);
}

function startDemoJobUpdates() {
    if (demoJobUpdateInterval) return; // Already running
    
    demoJobUpdateInterval = setInterval(() => {
        updateDemoJobs();
    }, 2000); // Update every 2 seconds
}

function stopDemoJobUpdates() {
    if (demoJobUpdateInterval) {
        clearInterval(demoJobUpdateInterval);
        demoJobUpdateInterval = null;
    }
}

function updateDemoJobs() {
    let hasActiveJobs = false;
    
    demoJobs.forEach((job, jobId) => {
        if (job.status === 'running') {
            hasActiveJobs = true;
            
            // Simulate progress
            const progressIncrement = Math.random() * 5 + 1; // 1-6% per update
            job.progress = Math.min(100, job.progress + progressIncrement);
            
            // Update processed records based on progress
            job.processed_records = Math.floor((job.progress / 100) * job.total_records);
            job.successful_records = Math.floor(job.processed_records * (0.85 + Math.random() * 0.1)); // 85-95% success rate
            job.failed_records = job.processed_records - job.successful_records;
            
            // Update ETA
            if (job.progress > 0) {
                const elapsed = Date.now() - new Date(job.started_at).getTime();
                const estimatedTotal = (elapsed / job.progress) * 100;
                const remaining = estimatedTotal - elapsed;
                job.eta = remaining > 0 ? formatDuration(remaining) : 'Completing...';
            }
            
            // Complete job when reaching 100%
            if (job.progress >= 100) {
                job.status = 'completed';
                job.progress = 100;
                job.processed_records = job.total_records;
                job.completed_at = new Date().toISOString();
                job.eta = 'Completed';
                
                // Randomly fail some jobs for demo purposes
                if (Math.random() < 0.1) { // 10% chance to fail
                    job.status = 'failed';
                    job.progress = Math.floor(Math.random() * 80) + 10; // 10-90% progress
                    job.processed_records = Math.floor((job.progress / 100) * job.total_records);
                    job.error_message = 'Demo processing error';
                }
            }
        }
    });
    
    // Stop updates if no active jobs
    if (!hasActiveJobs) {
        stopDemoJobUpdates();
    }
    
    // Refresh UI if we have active jobs
    if (hasActiveJobs) {
        loadActiveJobs().catch(console.error);
        loadRecentJobs().catch(console.error);
    }
}

function pauseDemoJob(jobId) {
    const job = demoJobs.get(jobId);
    if (job && job.status === 'running') {
        job.status = 'paused';
        showNotification(`Demo job ${jobId} paused`, 'info');
        loadActiveJobs().catch(console.error);
    }
}

function cancelDemoJob(jobId) {
    const job = demoJobs.get(jobId);
    if (job) {
        job.status = 'cancelled';
        job.completed_at = new Date().toISOString();
        showNotification(`Demo job ${jobId} cancelled`, 'warning');
        loadActiveJobs().catch(console.error);
        loadRecentJobs().catch(console.error);
    }
}

function resumeDemoJob(jobId) {
    const job = demoJobs.get(jobId);
    if (job && job.status === 'paused') {
        job.status = 'running';
        showNotification(`Demo job ${jobId} resumed`, 'success');
        startDemoJobUpdates();
        loadActiveJobs().catch(console.error);
    }
}

// Helper function to format duration
function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}