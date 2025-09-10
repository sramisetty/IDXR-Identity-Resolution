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
                    <div class="card-actions">
                        <a href="docs/batch-processing-guide.html" target="_blank" class="btn btn-secondary btn-sm">
                            <i class="fas fa-book"></i>
                            Documentation
                        </a>
                    </div>
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
                            
                            <div class="space-y-4">
                                <div class="form-group">
                                    <label class="form-label">Data Source</label>
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
                                        <label class="form-label">File Upload</label>
                                        <input type="file" class="form-control" name="dataFile" accept=".csv,.xlsx,.json,.parquet">
                                        <div class="text-xs text-gray-500 mt-1">Supported: CSV, XLSX, JSON, Parquet (max 100MB)</div>
                                    </div>
                                </div>
                                
                                <!-- Database Query Options -->
                                <div id="dataSourceDatabase" class="data-source-options" style="display: none;">
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
                                
                                <!-- API Endpoint Options -->
                                <div id="dataSourceAPI" class="data-source-options" style="display: none;">
                                    <div class="form-group">
                                        <label class="form-label">API URL</label>
                                        <input type="url" class="form-control" name="apiUrl" 
                                               placeholder="https://api.example.com/identities">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Authentication Method</label>
                                        <select class="form-select" name="authMethod">
                                            <option value="none">None</option>
                                            <option value="bearer">Bearer Token</option>
                                            <option value="api_key">API Key</option>
                                            <option value="basic">Basic Auth</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Authentication Value</label>
                                        <input type="password" class="form-control" name="authValue" 
                                               placeholder="Token, API key, or credentials">
                                    </div>
                                </div>
                                
                                <!-- Cloud Storage Options -->
                                <div id="dataSourceCloud" class="data-source-options" style="display: none;">
                                    <div class="form-group">
                                        <label class="form-label">Cloud Provider</label>
                                        <select class="form-select" name="cloudProvider">
                                            <option value="aws_s3">AWS S3</option>
                                            <option value="google_cloud">Google Cloud Storage</option>
                                            <option value="azure_blob">Azure Blob Storage</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Bucket/Container Name</label>
                                        <input type="text" class="form-control" name="bucketName" 
                                               placeholder="my-data-bucket">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">File Path</label>
                                        <input type="text" class="form-control" name="filePath" 
                                               placeholder="data/identities/batch_001.csv">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Access Credentials</label>
                                        <textarea class="form-control" name="cloudCredentials" rows="2" 
                                                  placeholder="Access key, secret, or service account JSON"></textarea>
                                    </div>
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
                                    <select class="form-select" name="outputFormat" onchange="updateOutputOptions()">
                                        <option value="csv">CSV</option>
                                        <option value="excel">Excel</option>
                                        <option value="json">JSON</option>
                                        <option value="xml">XML</option>
                                        <option value="pdf">PDF Report</option>
                                        <option value="database">Database</option>
                                    </select>
                                </div>
                                
                                <!-- Dynamic Output Configuration -->
                                <div id="outputConfiguration" class="mt-4">
                                    <div class="border rounded p-4 bg-gray-50">
                                        <h5 class="text-sm font-medium mb-3">Output Configuration</h5>
                                        
                                        <!-- Field Mapping (for bulk export) -->
                                        <div id="fieldMappingSection" style="display: none;">
                                            <div class="form-group">
                                                <label class="form-label">Field Mappings</label>
                                                <textarea class="form-control" name="fieldMappings" rows="3" 
                                                          placeholder='{"first_name": "FirstName", "last_name": "LastName", "dob": "DateOfBirth"}'></textarea>
                                                <div class="text-xs text-gray-500 mt-1">JSON format for field name mapping</div>
                                            </div>
                                        </div>
                                        
                                        <!-- Anonymization Options -->
                                        <div class="form-group">
                                            <label class="form-label">Anonymize Fields</label>
                                            <div class="flex flex-wrap gap-2 mt-2">
                                                <label class="flex items-center">
                                                    <input type="checkbox" name="anonymizeFields" value="ssn" class="mr-1">
                                                    <span class="text-sm">SSN</span>
                                                </label>
                                                <label class="flex items-center">
                                                    <input type="checkbox" name="anonymizeFields" value="phone" class="mr-1">
                                                    <span class="text-sm">Phone</span>
                                                </label>
                                                <label class="flex items-center">
                                                    <input type="checkbox" name="anonymizeFields" value="email" class="mr-1">
                                                    <span class="text-sm">Email</span>
                                                </label>
                                                <label class="flex items-center">
                                                    <input type="checkbox" name="anonymizeFields" value="address" class="mr-1">
                                                    <span class="text-sm">Address</span>
                                                </label>
                                            </div>
                                        </div>
                                        
                                        <!-- Include Metadata -->
                                        <div class="form-group">
                                            <label class="flex items-center">
                                                <input type="checkbox" name="includeMetadata" class="mr-2">
                                                <span class="text-sm">Include processing metadata</span>
                                            </label>
                                        </div>
                                        
                                        <!-- Database Output Options -->
                                        <div id="databaseOutputOptions" style="display: none;">
                                            <div class="form-group">
                                                <label class="form-label">Output Database</label>
                                                <select class="form-select" name="outputDatabase">
                                                    <option value="postgresql">PostgreSQL</option>
                                                    <option value="mysql">MySQL</option>
                                                    <option value="sqlserver">SQL Server</option>
                                                </select>
                                            </div>
                                            <div class="form-group">
                                                <label class="form-label">Table Name</label>
                                                <input type="text" class="form-control" name="outputTable" 
                                                       placeholder="batch_results_20241215">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Processing Type Specific Configuration -->
                        <div id="processingTypeConfiguration" class="mt-6">
                            <div class="border rounded p-4 bg-blue-50">
                                <h5 class="text-sm font-medium mb-3">Processing Configuration</h5>
                                
                                <!-- Identity Matching Config -->
                                <div id="identityMatchingConfig" class="processing-config">
                                    <div class="grid grid-cols-2 gap-4">
                                        <div class="form-group">
                                            <label class="form-label">Match Threshold</label>
                                            <input type="number" class="form-control" name="matchThreshold" 
                                                   value="0.80" min="0.1" max="1.0" step="0.01">
                                        </div>
                                        <div class="form-group">
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
                                
                                <!-- Data Validation Config -->
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
                                            <label class="form-label">Min Quality Threshold (%)</label>
                                            <input type="number" class="form-control" name="minQualityThreshold" 
                                                   value="70" min="0" max="100">
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Data Quality Config -->
                                <div id="dataQualityConfig" class="processing-config" style="display: none;">
                                    <div class="grid grid-cols-2 gap-4">
                                        <div class="form-group">
                                            <label class="flex items-center">
                                                <input type="checkbox" name="applyCleaning" checked class="mr-2">
                                                <span class="text-sm">Apply data cleaning</span>
                                            </label>
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Quality Level</label>
                                            <select class="form-select" name="qualityLevel">
                                                <option value="basic">Basic</option>
                                                <option value="standard" selected>Standard</option>
                                                <option value="enhanced">Enhanced</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Deduplication Config -->
                                <div id="deduplicationConfig" class="processing-config" style="display: none;">
                                    <div class="grid grid-cols-2 gap-4">
                                        <div class="form-group">
                                            <label class="form-label">Similarity Threshold</label>
                                            <input type="number" class="form-control" name="similarityThreshold" 
                                                   value="0.85" min="0.1" max="1.0" step="0.01">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Dedup Algorithms</label>
                                            <div class="flex flex-wrap gap-2 mt-1">
                                                <label class="flex items-center">
                                                    <input type="checkbox" name="dedupAlgorithms" value="deterministic" checked class="mr-1">
                                                    <span class="text-sm">Deterministic</span>
                                                </label>
                                                <label class="flex items-center">
                                                    <input type="checkbox" name="dedupAlgorithms" value="probabilistic" checked class="mr-1">
                                                    <span class="text-sm">Probabilistic</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Household Detection Config -->
                                <div id="householdDetectionConfig" class="processing-config" style="display: none;">
                                    <div class="grid grid-cols-2 gap-4">
                                        <div class="form-group">
                                            <label class="flex items-center">
                                                <input type="checkbox" name="addressGrouping" checked class="mr-2">
                                                <span class="text-sm">Group by address</span>
                                            </label>
                                        </div>
                                        <div class="form-group">
                                            <label class="flex items-center">
                                                <input type="checkbox" name="namePatternAnalysis" checked class="mr-2">
                                                <span class="text-sm">Analyze name patterns</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Bulk Export Config -->
                                <div id="bulkExportConfig" class="processing-config" style="display: none;">
                                    <div class="grid grid-cols-2 gap-4">
                                        <div class="form-group">
                                            <label class="form-label">Export Format</label>
                                            <select class="form-select" name="exportFormat">
                                                <option value="csv">CSV</option>
                                                <option value="excel">Excel</option>
                                                <option value="json">JSON</option>
                                                <option value="xml">XML</option>
                                                <option value="pdf">PDF</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label class="flex items-center">
                                                <input type="checkbox" name="includeExportMetadata" checked class="mr-2">
                                                <span class="text-sm">Include metadata</span>
                                            </label>
                                        </div>
                                    </div>
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

    // Add file upload handler
    document.querySelector('[name="dataFile"]').addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            validateFileUpload(file);
        }
    });

    // Add processing type change handler
    document.querySelector('[name="processingType"]').addEventListener('change', function() {
        updateJobOptions();
    });
    
    // Add data source change handler
    document.querySelector('[name="dataSource"]').addEventListener('change', function() {
        updateDataSourceOptions();
    });
    
    // Add output format change handler  
    document.querySelector('[name="outputFormat"]').addEventListener('change', function() {
        updateOutputOptions();
    });
    
    // Initialize dynamic sections
    updateJobOptions();
    updateDataSourceOptions();
    updateOutputOptions();
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
        container.innerHTML = '<div class="text-center py-4 text-red-500">Error loading active jobs</div>';
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
        container.innerHTML = '<div class="text-center py-4 text-red-500">Error loading recent jobs</div>';
    }
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
    const dataSource = document.querySelector('[name="dataSource"]').value;
    
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
    const outputFormat = document.querySelector('[name="outputFormat"]').value;
    const dbOptions = document.getElementById('databaseOutputOptions');
    
    // Show/hide database options
    if (outputFormat === 'database') {
        dbOptions.style.display = 'block';
    } else {
        dbOptions.style.display = 'none';
    }
    
    console.log('Output format changed to:', outputFormat);
}

async function submitBatchJob(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        // Show loading state
        showNotification('Creating batch job...', 'info');
        
        // Disable submit button
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Job...';
        
        // Build the job configuration object
        const jobConfig = buildJobConfiguration(formData);
        
        // If we have file upload, use FormData; otherwise use JSON
        const hasFileUpload = formData.get('dataFile') && formData.get('dataFile').size > 0;
        
        let response;
        if (hasFileUpload) {
            // Add job config to FormData
            formData.append('jobConfig', JSON.stringify(jobConfig));
            
            response = await fetch('/api/v1/batch/jobs', {
                method: 'POST',
                body: formData
            });
        } else {
            // Use JSON for non-file uploads
            response = await fetch('/api/v1/batch/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jobConfig)
            });
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            showNotification(`Batch job "${jobConfig.name}" created successfully`, 'success');
            form.reset();
            
            // Reset dynamic sections
            updateJobOptions();
            updateDataSourceOptions();
            updateOutputOptions();
            
            // Refresh job lists
            await loadActiveJobs();
            await loadRecentJobs();
            await updateBatchStatistics();
        } else {
            throw new Error(data.message || 'Failed to create batch job');
        }
        
    } catch (error) {
        console.error('Error creating batch job:', error);
        showNotification(`Error creating batch job: ${error.message}`, 'error');
    } finally {
        // Re-enable submit button
        const submitBtn = form.querySelector('button[type="submit"]');
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
                use_ai: getCheckedValues(formData, 'algorithms').includes('ai_hybrid'),
                algorithms: getCheckedValues(formData, 'algorithms')
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

async function downloadResults(jobId) {
    try {
        showNotification(`Preparing download for job ${jobId}...`, 'info');
        
        const response = await fetch(`/api/v1/batch/jobs/${jobId}/export?format=csv`);
        const data = await response.json();
        
        if (data.status === 'success') {
            showNotification('Download link prepared', 'success');
            // In a real implementation, you would handle file download here
            console.log('Download file path:', data.file_path);
        } else {
            throw new Error(data.message || 'Failed to export results');
        }
    } catch (error) {
        console.error('Error downloading results:', error);
        showNotification(`Error preparing download: ${error.message}`, 'error');
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