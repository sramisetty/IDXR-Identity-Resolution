// System Configuration Management Page
function loadSystemConfigPage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="space-y-6">
            <!-- Configuration Overview -->
            <div class="stats-grid">
                <div class="stat-card info">
                    <div class="stat-header">
                        <span class="stat-title">Active Configs</span>
                        <div class="stat-icon info">
                            <i class="fas fa-cogs"></i>
                        </div>
                    </div>
                    <div class="stat-value">47</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>3 updated today</span>
                    </div>
                </div>

                <div class="stat-card success">
                    <div class="stat-header">
                        <span class="stat-title">Deployment Status</span>
                        <div class="stat-icon success">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </div>
                    <div class="stat-value">Stable</div>
                    <div class="stat-change positive">
                        <i class="fas fa-clock"></i>
                        <span>Last: 2h ago</span>
                    </div>
                </div>

                <div class="stat-card warning">
                    <div class="stat-header">
                        <span class="stat-title">Pending Changes</span>
                        <div class="stat-icon warning">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                    </div>
                    <div class="stat-value">5</div>
                    <div class="stat-change negative">
                        <i class="fas fa-clock"></i>
                        <span>Requires review</span>
                    </div>
                </div>

                <div class="stat-card primary">
                    <div class="stat-header">
                        <span class="stat-title">Config Version</span>
                        <div class="stat-icon primary">
                            <i class="fas fa-code-branch"></i>
                        </div>
                    </div>
                    <div class="stat-value">v2.1.3</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>Latest</span>
                    </div>
                </div>
            </div>

            <!-- Configuration Sections -->
            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <!-- Quick Actions -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Quick Actions</h3>
                    </div>
                    <div class="card-body">
                        <div class="space-y-3">
                            <button class="btn btn-primary w-full" onclick="backupConfiguration()">
                                <i class="fas fa-download mr-2"></i>
                                Backup Configuration
                            </button>
                            <button class="btn btn-outline w-full" onclick="restoreConfiguration()">
                                <i class="fas fa-upload mr-2"></i>
                                Restore from Backup
                            </button>
                            <button class="btn btn-outline w-full" onclick="validateConfiguration()">
                                <i class="fas fa-check-double mr-2"></i>
                                Validate Configuration
                            </button>
                            <button class="btn btn-outline w-full" onclick="deployConfiguration()">
                                <i class="fas fa-rocket mr-2"></i>
                                Deploy Changes
                            </button>
                            <button class="btn btn-outline w-full" onclick="viewConfigHistory()">
                                <i class="fas fa-history mr-2"></i>
                                View History
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Environment Status -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Environment Status</h3>
                    </div>
                    <div class="card-body">
                        <div class="space-y-4" id="environmentStatus">
                            <!-- Environment status will be loaded here -->
                        </div>
                    </div>
                </div>

                <!-- Recent Changes -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Recent Changes</h3>
                    </div>
                    <div class="card-body">
                        <div class="space-y-3" id="recentChanges">
                            <!-- Recent changes will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Configuration Tabs -->
            <div class="card">
                <div class="card-header">
                    <div class="flex space-x-4" id="configTabs">
                        <button class="config-tab active" onclick="switchConfigTab('application')" data-tab="application">
                            <i class="fas fa-desktop mr-2"></i>
                            Application
                        </button>
                        <button class="config-tab" onclick="switchConfigTab('database')" data-tab="database">
                            <i class="fas fa-database mr-2"></i>
                            Database
                        </button>
                        <button class="config-tab" onclick="switchConfigTab('security')" data-tab="security">
                            <i class="fas fa-shield-alt mr-2"></i>
                            Security
                        </button>
                        <button class="config-tab" onclick="switchConfigTab('matching')" data-tab="matching">
                            <i class="fas fa-search-plus mr-2"></i>
                            Matching
                        </button>
                        <button class="config-tab" onclick="switchConfigTab('monitoring')" data-tab="monitoring">
                            <i class="fas fa-chart-line mr-2"></i>
                            Monitoring
                        </button>
                        <button class="config-tab" onclick="switchConfigTab('external')" data-tab="external">
                            <i class="fas fa-plug mr-2"></i>
                            External APIs
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div id="configTabContent">
                        <!-- Tab content will be loaded here -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Configuration History Modal -->
        <div class="modal" id="configHistoryModal" style="display: none;">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">Configuration History</h4>
                        <button class="modal-close" onclick="closeConfigHistoryModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="configHistoryContent">
                            <!-- History will be loaded here -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeConfigHistoryModal()">Close</button>
                        <button type="button" class="btn btn-primary" onclick="compareConfigurations()">
                            <i class="fas fa-columns"></i>
                            Compare
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Backup/Restore Modal -->
        <div class="modal" id="backupRestoreModal" style="display: none;">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title" id="backupRestoreTitle">Configuration Backup</h4>
                        <button class="modal-close" onclick="closeBackupRestoreModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="backupRestoreContent">
                            <!-- Content will be loaded here -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeBackupRestoreModal()">Cancel</button>
                        <button type="button" class="btn btn-primary" id="backupRestoreAction">
                            Execute
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .config-tab {
                padding: 0.75rem 1rem;
                border: none;
                background: none;
                color: var(--text-secondary);
                cursor: pointer;
                border-bottom: 2px solid transparent;
                transition: all 0.2s;
                display: flex;
                align-items: center;
            }

            .config-tab:hover {
                color: var(--primary-color);
            }

            .config-tab.active {
                color: var(--primary-color);
                border-bottom-color: var(--primary-color);
            }

            .config-section {
                margin-bottom: 2rem;
                padding: 1.5rem;
                border: 1px solid var(--border-color);
                border-radius: 0.5rem;
                background: white;
            }

            .config-section-title {
                font-size: 1.125rem;
                font-weight: 600;
                margin-bottom: 1rem;
                color: var(--text-primary);
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .config-field {
                display: grid;
                grid-template-columns: 200px 1fr auto;
                gap: 1rem;
                align-items: center;
                padding: 0.75rem 0;
                border-bottom: 1px solid #f1f5f9;
            }

            .config-field:last-child {
                border-bottom: none;
            }

            .config-label {
                font-weight: 500;
                color: var(--text-primary);
            }

            .config-value {
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 0.875rem;
                padding: 0.5rem 0.75rem;
                border: 1px solid var(--border-color);
                border-radius: 0.375rem;
                background: white;
            }

            .config-actions {
                display: flex;
                gap: 0.5rem;
            }

            .environment-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem;
                border: 1px solid var(--border-color);
                border-radius: 0.375rem;
                background: #f8fafc;
            }

            .environment-name {
                font-weight: 500;
            }

            .environment-status {
                padding: 0.25rem 0.75rem;
                border-radius: 9999px;
                font-size: 0.75rem;
                font-weight: 500;
            }

            .environment-status.active {
                background: var(--success-color);
                color: white;
            }

            .environment-status.inactive {
                background: var(--text-secondary);
                color: white;
            }

            .environment-status.staging {
                background: var(--warning-color);
                color: white;
            }

            .change-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem;
                border: 1px solid var(--border-color);
                border-radius: 0.375rem;
                background: white;
            }

            .change-icon {
                width: 2rem;
                height: 2rem;
                border-radius: 0.375rem;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.875rem;
            }

            .change-icon.modified {
                background: rgba(59, 130, 246, 0.1);
                color: var(--primary-color);
            }

            .change-icon.added {
                background: rgba(34, 197, 94, 0.1);
                color: var(--success-color);
            }

            .change-icon.deleted {
                background: rgba(239, 68, 68, 0.1);
                color: var(--danger-color);
            }

            .validation-result {
                padding: 1rem;
                border-radius: 0.5rem;
                margin: 1rem 0;
            }

            .validation-result.success {
                background: rgba(34, 197, 94, 0.1);
                border: 1px solid rgba(34, 197, 94, 0.2);
                color: var(--success-color);
            }

            .validation-result.error {
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.2);
                color: var(--danger-color);
            }

            .validation-result.warning {
                background: rgba(245, 158, 11, 0.1);
                border: 1px solid rgba(245, 158, 11, 0.2);
                color: var(--warning-color);
            }
        </style>
    `;

    // Initialize the page
    initializeSystemConfigPage();
}

function initializeSystemConfigPage() {
    loadEnvironmentStatus();
    loadRecentChanges();
    switchConfigTab('application');
}

function loadEnvironmentStatus() {
    const statusContainer = document.getElementById('environmentStatus');
    
    const environments = [
        { name: 'Production', status: 'active', version: 'v2.1.3' },
        { name: 'Staging', status: 'staging', version: 'v2.1.4-beta' },
        { name: 'Development', status: 'active', version: 'v2.2.0-dev' },
        { name: 'Testing', status: 'inactive', version: 'v2.1.2' }
    ];

    statusContainer.innerHTML = environments.map(env => `
        <div class="environment-item">
            <div>
                <div class="environment-name">${env.name}</div>
                <div class="text-sm text-gray-500">${env.version}</div>
            </div>
            <span class="environment-status ${env.status}">${env.status}</span>
        </div>
    `).join('');
}

function loadRecentChanges() {
    const changesContainer = document.getElementById('recentChanges');
    
    const changes = [
        {
            type: 'modified',
            icon: 'fa-edit',
            description: 'Updated matching threshold',
            user: 'admin',
            time: '2 hours ago'
        },
        {
            type: 'added',
            icon: 'fa-plus',
            description: 'Added new algorithm config',
            user: 'developer',
            time: '1 day ago'
        },
        {
            type: 'modified',
            icon: 'fa-edit',
            description: 'Security policy update',
            user: 'security',
            time: '2 days ago'
        },
        {
            type: 'deleted',
            icon: 'fa-trash',
            description: 'Removed deprecated setting',
            user: 'admin',
            time: '3 days ago'
        }
    ];

    changesContainer.innerHTML = changes.map(change => `
        <div class="change-item">
            <div class="change-icon ${change.type}">
                <i class="fas ${change.icon}"></i>
            </div>
            <div class="flex-1">
                <div class="text-sm font-medium">${change.description}</div>
                <div class="text-xs text-gray-500">by ${change.user} • ${change.time}</div>
            </div>
        </div>
    `).join('');
}

function switchConfigTab(tabName) {
    // Update active tab
    document.querySelectorAll('.config-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Load tab content
    const content = document.getElementById('configTabContent');
    
    switch(tabName) {
        case 'application':
            content.innerHTML = generateApplicationConfig();
            break;
        case 'database':
            content.innerHTML = generateDatabaseConfig();
            break;
        case 'security':
            content.innerHTML = generateSecurityConfig();
            break;
        case 'matching':
            content.innerHTML = generateMatchingConfig();
            break;
        case 'monitoring':
            content.innerHTML = generateMonitoringConfig();
            break;
        case 'external':
            content.innerHTML = generateExternalConfig();
            break;
    }
}

function generateApplicationConfig() {
    return `
        <div class="space-y-6">
            <div class="config-section">
                <div class="config-section-title">
                    <i class="fas fa-desktop"></i>
                    Application Settings
                </div>
                <div class="space-y-0">
                    <div class="config-field">
                        <div class="config-label">App Name</div>
                        <input type="text" class="config-value" value="IDXR Production" onchange="markConfigChanged('app_name', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('app_name')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Environment</div>
                        <select class="config-value" onchange="markConfigChanged('environment', this.value)">
                            <option value="development">Development</option>
                            <option value="staging">Staging</option>
                            <option value="production" selected>Production</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('environment')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Debug Mode</div>
                        <select class="config-value" onchange="markConfigChanged('debug', this.value)">
                            <option value="false" selected>False</option>
                            <option value="true">True</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('debug')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Host</div>
                        <input type="text" class="config-value" value="0.0.0.0" onchange="markConfigChanged('host', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('host')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Port</div>
                        <input type="number" class="config-value" value="3000" onchange="markConfigChanged('port', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('port')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Workers</div>
                        <input type="number" class="config-value" value="4" min="1" max="16" onchange="markConfigChanged('workers', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('workers')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="config-section">
                <div class="config-section-title">
                    <i class="fas fa-toggle-on"></i>
                    Feature Flags
                </div>
                <div class="space-y-0">
                    <div class="config-field">
                        <div class="config-label">Advanced Matching</div>
                        <select class="config-value" onchange="markConfigChanged('features.advanced_matching', this.value)">
                            <option value="true" selected>Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('features.advanced_matching')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Household Detection</div>
                        <select class="config-value" onchange="markConfigChanged('features.household_detection', this.value)">
                            <option value="true" selected>Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('features.household_detection')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Real-time Processing</div>
                        <select class="config-value" onchange="markConfigChanged('features.real_time_processing', this.value)">
                            <option value="true" selected>Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('features.real_time_processing')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">API Rate Limiting</div>
                        <select class="config-value" onchange="markConfigChanged('features.api_rate_limiting', this.value)">
                            <option value="true" selected>Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('features.api_rate_limiting')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateDatabaseConfig() {
    return `
        <div class="space-y-6">
            <div class="config-section">
                <div class="config-section-title">
                    <i class="fas fa-database"></i>
                    Database Connection
                </div>
                <div class="space-y-0">
                    <div class="config-field">
                        <div class="config-label">Host</div>
                        <input type="text" class="config-value" value="\${DB_HOST}" onchange="markConfigChanged('database.host', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="testDatabaseConnection()">
                                <i class="fas fa-link"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Port</div>
                        <input type="number" class="config-value" value="5432" onchange="markConfigChanged('database.port', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('database.port')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Database Name</div>
                        <input type="text" class="config-value" value="\${DB_NAME}" onchange="markConfigChanged('database.database', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('database.database')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Username</div>
                        <input type="text" class="config-value" value="\${DB_USER}" onchange="markConfigChanged('database.user', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('database.user')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">SSL Mode</div>
                        <select class="config-value" onchange="markConfigChanged('database.ssl_mode', this.value)">
                            <option value="disable">Disable</option>
                            <option value="allow">Allow</option>
                            <option value="prefer">Prefer</option>
                            <option value="require" selected>Require</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('database.ssl_mode')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="config-section">
                <div class="config-section-title">
                    <i class="fas fa-swimming-pool"></i>
                    Connection Pool
                </div>
                <div class="space-y-0">
                    <div class="config-field">
                        <div class="config-label">Pool Size</div>
                        <input type="number" class="config-value" value="50" min="5" max="200" onchange="markConfigChanged('database.pool_size', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('database.pool_size')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Max Overflow</div>
                        <input type="number" class="config-value" value="100" min="10" max="500" onchange="markConfigChanged('database.max_overflow', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('database.max_overflow')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Pool Timeout (s)</div>
                        <input type="number" class="config-value" value="30" min="5" max="300" onchange="markConfigChanged('database.pool_timeout', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('database.pool_timeout')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Pool Recycle (s)</div>
                        <input type="number" class="config-value" value="3600" min="300" max="86400" onchange="markConfigChanged('database.pool_recycle', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('database.pool_recycle')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateSecurityConfig() {
    return `
        <div class="space-y-6">
            <div class="config-section">
                <div class="config-section-title">
                    <i class="fas fa-key"></i>
                    Authentication
                </div>
                <div class="space-y-0">
                    <div class="config-field">
                        <div class="config-label">JWT Expire Hours</div>
                        <input type="number" class="config-value" value="8" min="1" max="24" onchange="markConfigChanged('security.jwt_expire_hours', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('security.jwt_expire_hours')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Max Login Attempts</div>
                        <input type="number" class="config-value" value="3" min="1" max="10" onchange="markConfigChanged('security.max_login_attempts', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('security.max_login_attempts')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Lockout Duration (min)</div>
                        <input type="number" class="config-value" value="30" min="5" max="1440" onchange="markConfigChanged('security.lockout_duration_minutes', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('security.lockout_duration_minutes')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="config-section">
                <div class="config-section-title">
                    <i class="fas fa-lock"></i>
                    Password Policy
                </div>
                <div class="space-y-0">
                    <div class="config-field">
                        <div class="config-label">Minimum Length</div>
                        <input type="number" class="config-value" value="12" min="8" max="64" onchange="markConfigChanged('security.password_min_length', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('security.password_min_length')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Require Uppercase</div>
                        <select class="config-value" onchange="markConfigChanged('security.password_require_uppercase', this.value)">
                            <option value="true" selected>Yes</option>
                            <option value="false">No</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('security.password_require_uppercase')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Require Numbers</div>
                        <select class="config-value" onchange="markConfigChanged('security.password_require_numbers', this.value)">
                            <option value="true" selected>Yes</option>
                            <option value="false">No</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('security.password_require_numbers')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Require Special Characters</div>
                        <select class="config-value" onchange="markConfigChanged('security.password_require_special', this.value)">
                            <option value="true" selected>Yes</option>
                            <option value="false">No</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('security.password_require_special')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="config-section">
                <div class="config-section-title">
                    <i class="fas fa-globe"></i>
                    CORS & Security Headers
                </div>
                <div class="space-y-0">
                    <div class="config-field">
                        <div class="config-label">CORS Origins</div>
                        <textarea class="config-value" rows="3" onchange="markConfigChanged('security.cors_origins', this.value)">https://idxr.colorado.gov
https://admin.idxr.colorado.gov</textarea>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('security.cors_origins')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Security Headers</div>
                        <select class="config-value" onchange="markConfigChanged('security.security_headers', this.value)">
                            <option value="true" selected>Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('security.security_headers')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Rate Limiting</div>
                        <select class="config-value" onchange="markConfigChanged('security.rate_limit_enabled', this.value)">
                            <option value="true" selected>Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('security.rate_limit_enabled')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateMatchingConfig() {
    return `
        <div class="space-y-6">
            <div class="config-section">
                <div class="config-section-title">
                    <i class="fas fa-search-plus"></i>
                    Algorithm Settings
                </div>
                <div class="space-y-0">
                    <div class="config-field">
                        <div class="config-label">Enabled Algorithms</div>
                        <div class="config-value" style="padding: 0.75rem;">
                            <label class="flex items-center mb-2">
                                <input type="checkbox" checked class="mr-2"> Deterministic
                            </label>
                            <label class="flex items-center mb-2">
                                <input type="checkbox" checked class="mr-2"> Probabilistic
                            </label>
                            <label class="flex items-center mb-2">
                                <input type="checkbox" checked class="mr-2"> AI Hybrid
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" checked class="mr-2"> Fuzzy
                            </label>
                        </div>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('matching.enabled_algorithms')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Default Confidence Threshold</div>
                        <input type="number" class="config-value" value="0.85" min="0.5" max="1.0" step="0.05" onchange="markConfigChanged('matching.default_confidence_threshold', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('matching.default_confidence_threshold')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Auto Match Threshold</div>
                        <input type="number" class="config-value" value="0.95" min="0.8" max="1.0" step="0.05" onchange="markConfigChanged('matching.auto_match_threshold', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('matching.auto_match_threshold')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Manual Review Threshold</div>
                        <input type="number" class="config-value" value="0.70" min="0.5" max="0.9" step="0.05" onchange="markConfigChanged('matching.manual_review_threshold', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('matching.manual_review_threshold')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="config-section">
                <div class="config-section-title">
                    <i class="fas fa-weight-hanging"></i>
                    Algorithm Weights
                </div>
                <div class="space-y-0">
                    <div class="config-field">
                        <div class="config-label">Deterministic Weight</div>
                        <input type="number" class="config-value" value="0.4" min="0.0" max="1.0" step="0.1" onchange="markConfigChanged('matching.deterministic_weight', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('matching.deterministic_weight')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Probabilistic Weight</div>
                        <input type="number" class="config-value" value="0.3" min="0.0" max="1.0" step="0.1" onchange="markConfigChanged('matching.probabilistic_weight', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('matching.probabilistic_weight')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">AI Hybrid Weight</div>
                        <input type="number" class="config-value" value="0.2" min="0.0" max="1.0" step="0.1" onchange="markConfigChanged('matching.ai_hybrid_weight', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('matching.ai_hybrid_weight')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Fuzzy Weight</div>
                        <input type="number" class="config-value" value="0.1" min="0.0" max="1.0" step="0.1" onchange="markConfigChanged('matching.fuzzy_weight', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('matching.fuzzy_weight')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="config-section">
                <div class="config-section-title">
                    <i class="fas fa-cogs"></i>
                    Processing Settings
                </div>
                <div class="space-y-0">
                    <div class="config-field">
                        <div class="config-label">Batch Size</div>
                        <input type="number" class="config-value" value="1000" min="100" max="10000" step="100" onchange="markConfigChanged('matching.batch_size', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('matching.batch_size')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Max Matches Returned</div>
                        <input type="number" class="config-value" value="10" min="1" max="100" onchange="markConfigChanged('matching.max_matches_returned', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('matching.max_matches_returned')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Enable Caching</div>
                        <select class="config-value" onchange="markConfigChanged('matching.enable_caching', this.value)">
                            <option value="true" selected>Yes</option>
                            <option value="false">No</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('matching.enable_caching')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Cache TTL (seconds)</div>
                        <input type="number" class="config-value" value="300" min="60" max="3600" onchange="markConfigChanged('matching.cache_ttl_seconds', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('matching.cache_ttl_seconds')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateMonitoringConfig() {
    return `
        <div class="space-y-6">
            <div class="config-section">
                <div class="config-section-title">
                    <i class="fas fa-chart-bar"></i>
                    Prometheus Metrics
                </div>
                <div class="space-y-0">
                    <div class="config-field">
                        <div class="config-label">Enable Prometheus</div>
                        <select class="config-value" onchange="markConfigChanged('monitoring.prometheus_enabled', this.value)">
                            <option value="true" selected>Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('monitoring.prometheus_enabled')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Prometheus Port</div>
                        <input type="number" class="config-value" value="9090" min="1024" max="65535" onchange="markConfigChanged('monitoring.prometheus_port', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('monitoring.prometheus_port')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Collection Interval (s)</div>
                        <input type="number" class="config-value" value="30" min="5" max="300" onchange="markConfigChanged('monitoring.metrics_collection_interval', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('monitoring.metrics_collection_interval')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="config-section">
                <div class="config-section-title">
                    <i class="fas fa-heartbeat"></i>
                    Health Checks
                </div>
                <div class="space-y-0">
                    <div class="config-field">
                        <div class="config-label">Enable Health Checks</div>
                        <select class="config-value" onchange="markConfigChanged('monitoring.health_check_enabled', this.value)">
                            <option value="true" selected>Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('monitoring.health_check_enabled')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Check Interval (s)</div>
                        <input type="number" class="config-value" value="60" min="10" max="600" onchange="markConfigChanged('monitoring.health_check_interval', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('monitoring.health_check_interval')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="config-section">
                <div class="config-section-title">
                    <i class="fas fa-file-alt"></i>
                    Logging
                </div>
                <div class="space-y-0">
                    <div class="config-field">
                        <div class="config-label">Log Level</div>
                        <select class="config-value" onchange="markConfigChanged('monitoring.log_level', this.value)">
                            <option value="DEBUG">DEBUG</option>
                            <option value="INFO" selected>INFO</option>
                            <option value="WARNING">WARNING</option>
                            <option value="ERROR">ERROR</option>
                            <option value="CRITICAL">CRITICAL</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('monitoring.log_level')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Log Format</div>
                        <select class="config-value" onchange="markConfigChanged('monitoring.log_format', this.value)">
                            <option value="text">Text</option>
                            <option value="json" selected>JSON</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('monitoring.log_format')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Log File Path</div>
                        <input type="text" class="config-value" value="/var/log/idxr/application.log" onchange="markConfigChanged('monitoring.log_file', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('monitoring.log_file')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Max Log File Size (MB)</div>
                        <input type="number" class="config-value" value="100" min="10" max="1000" onchange="markConfigChanged('monitoring.max_log_file_size', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('monitoring.max_log_file_size')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Log Retention (days)</div>
                        <input type="number" class="config-value" value="30" min="7" max="365" onchange="markConfigChanged('monitoring.log_retention_days', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('monitoring.log_retention_days')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateExternalConfig() {
    return `
        <div class="space-y-6">
            <div class="config-section">
                <div class="config-section-title">
                    <i class="fas fa-map-marker-alt"></i>
                    Address Validation
                </div>
                <div class="space-y-0">
                    <div class="config-field">
                        <div class="config-label">Enable Service</div>
                        <select class="config-value" onchange="markConfigChanged('external_services.address_validation.enabled', this.value)">
                            <option value="true" selected>Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="testExternalService('address_validation')">
                                <i class="fas fa-link"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Provider</div>
                        <select class="config-value" onchange="markConfigChanged('external_services.address_validation.provider', this.value)">
                            <option value="usps" selected>USPS</option>
                            <option value="smartystreets">SmartyStreets</option>
                            <option value="google">Google Maps</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('external_services.address_validation.provider')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Timeout (s)</div>
                        <input type="number" class="config-value" value="30" min="5" max="120" onchange="markConfigChanged('external_services.address_validation.timeout', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('external_services.address_validation.timeout')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="config-section">
                <div class="config-section-title">
                    <i class="fas fa-phone"></i>
                    Phone Validation
                </div>
                <div class="space-y-0">
                    <div class="config-field">
                        <div class="config-label">Enable Service</div>
                        <select class="config-value" onchange="markConfigChanged('external_services.phone_validation.enabled', this.value)">
                            <option value="true" selected>Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="testExternalService('phone_validation')">
                                <i class="fas fa-link"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Provider</div>
                        <select class="config-value" onchange="markConfigChanged('external_services.phone_validation.provider', this.value)">
                            <option value="twilio" selected>Twilio</option>
                            <option value="numverify">NumVerify</option>
                            <option value="phonevalidator">PhoneValidator</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('external_services.phone_validation.provider')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Timeout (s)</div>
                        <input type="number" class="config-value" value="10" min="5" max="60" onchange="markConfigChanged('external_services.phone_validation.timeout', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('external_services.phone_validation.timeout')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="config-section">
                <div class="config-section-title">
                    <i class="fas fa-envelope"></i>
                    Email Validation
                </div>
                <div class="space-y-0">
                    <div class="config-field">
                        <div class="config-label">Enable Service</div>
                        <select class="config-value" onchange="markConfigChanged('external_services.email_validation.enabled', this.value)">
                            <option value="true" selected>Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="testExternalService('email_validation')">
                                <i class="fas fa-link"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Provider</div>
                        <select class="config-value" onchange="markConfigChanged('external_services.email_validation.provider', this.value)">
                            <option value="sendgrid" selected>SendGrid</option>
                            <option value="mailgun">Mailgun</option>
                            <option value="zerobounce">ZeroBounce</option>
                        </select>
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('external_services.email_validation.provider')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <div class="config-label">Timeout (s)</div>
                        <input type="number" class="config-value" value="10" min="5" max="60" onchange="markConfigChanged('external_services.email_validation.timeout', this.value)">
                        <div class="config-actions">
                            <button class="btn btn-sm btn-outline" onclick="resetConfigValue('external_services.email_validation.timeout')">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Global variables for tracking changes
let configChanges = {};
let originalConfig = {};

function markConfigChanged(key, value) {
    configChanges[key] = value;
    console.log('Configuration changed:', key, '=', value);
    
    // Show unsaved changes indicator
    showUnsavedChangesIndicator();
}

function showUnsavedChangesIndicator() {
    // Add visual indicator for unsaved changes
    if (Object.keys(configChanges).length > 0) {
        const pageTitle = document.getElementById('pageTitle');
        if (!pageTitle.textContent.includes('*')) {
            pageTitle.textContent += ' *';
        }
    }
}

function resetConfigValue(key) {
    if (configChanges[key]) {
        delete configChanges[key];
    }
    
    // Reset to original value (would need to implement actual reset logic)
    showNotification(`Reset ${key} to original value`, 'info');
    
    // Remove unsaved indicator if no more changes
    if (Object.keys(configChanges).length === 0) {
        const pageTitle = document.getElementById('pageTitle');
        pageTitle.textContent = pageTitle.textContent.replace(' *', '');
    }
}

async function validateConfiguration() {
    try {
        showNotification('Validating configuration...', 'info');
        
        // Simulate validation process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Show validation results
        const resultsHtml = `
            <div class="validation-result success">
                <i class="fas fa-check-circle mr-2"></i>
                Configuration validation completed successfully
            </div>
            <div class="mt-4">
                <h4 class="font-medium mb-2">Validation Summary:</h4>
                <ul class="text-sm space-y-1">
                    <li class="text-green-600">✓ All required fields present</li>
                    <li class="text-green-600">✓ Data types are valid</li>
                    <li class="text-green-600">✓ Ranges and constraints satisfied</li>
                    <li class="text-green-600">✓ Cross-field dependencies verified</li>
                    <li class="text-yellow-600">⚠ 2 optimization recommendations available</li>
                </ul>
            </div>
        `;
        
        // Show in modal or inline
        showNotification('Configuration is valid', 'success');
        
    } catch (error) {
        console.error('Validation error:', error);
        showNotification('Configuration validation failed', 'error');
    }
}

async function deployConfiguration() {
    if (Object.keys(configChanges).length === 0) {
        showNotification('No changes to deploy', 'warning');
        return;
    }

    try {
        showNotification('Deploying configuration changes...', 'info');
        
        // Simulate deployment
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Clear changes
        configChanges = {};
        
        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        pageTitle.textContent = pageTitle.textContent.replace(' *', '');
        
        showNotification('Configuration deployed successfully', 'success');
        
    } catch (error) {
        console.error('Deployment error:', error);
        showNotification('Configuration deployment failed', 'error');
    }
}

function backupConfiguration() {
    const modal = document.getElementById('backupRestoreModal');
    const title = document.getElementById('backupRestoreTitle');
    const content = document.getElementById('backupRestoreContent');
    const actionBtn = document.getElementById('backupRestoreAction');
    
    title.textContent = 'Configuration Backup';
    content.innerHTML = `
        <div class="space-y-4">
            <div class="form-group">
                <label class="form-label">Backup Name</label>
                <input type="text" class="form-control" value="config_backup_${new Date().toISOString().split('T')[0]}" id="backupName">
            </div>
            <div class="form-group">
                <label class="form-label">Include Sections</label>
                <div class="space-y-2">
                    <label class="flex items-center">
                        <input type="checkbox" checked class="mr-2"> Application Settings
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" checked class="mr-2"> Database Configuration
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" checked class="mr-2"> Security Settings
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" checked class="mr-2"> Matching Configuration
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" checked class="mr-2"> Monitoring Settings
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" class="mr-2"> External API Keys
                    </label>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-control" rows="3" placeholder="Optional description for this backup"></textarea>
            </div>
        </div>
    `;
    
    actionBtn.textContent = 'Create Backup';
    actionBtn.onclick = executeBackup;
    
    modal.style.display = 'flex';
}

function restoreConfiguration() {
    const modal = document.getElementById('backupRestoreModal');
    const title = document.getElementById('backupRestoreTitle');
    const content = document.getElementById('backupRestoreContent');
    const actionBtn = document.getElementById('backupRestoreAction');
    
    title.textContent = 'Restore Configuration';
    content.innerHTML = `
        <div class="space-y-4">
            <div class="form-group">
                <label class="form-label">Select Backup</label>
                <select class="form-control" id="restoreBackup">
                    <option value="">Choose a backup...</option>
                    <option value="config_backup_2025-01-15">config_backup_2025-01-15 (Production)</option>
                    <option value="config_backup_2025-01-10">config_backup_2025-01-10 (Pre-update)</option>
                    <option value="config_backup_2025-01-05">config_backup_2025-01-05 (Emergency)</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Upload Backup File</label>
                <input type="file" class="form-control" accept=".json,.yaml,.yml">
            </div>
            <div class="bg-yellow-50 border border-yellow-200 rounded p-3">
                <div class="flex items-start">
                    <i class="fas fa-exclamation-triangle text-yellow-600 mt-1 mr-2"></i>
                    <div class="text-sm text-yellow-800">
                        <strong>Warning:</strong> Restoring configuration will overwrite current settings. 
                        Make sure to create a backup of the current configuration first.
                    </div>
                </div>
            </div>
        </div>
    `;
    
    actionBtn.textContent = 'Restore';
    actionBtn.onclick = executeRestore;
    
    modal.style.display = 'flex';
}

function executeBackup() {
    const backupName = document.getElementById('backupName').value;
    if (!backupName) {
        showNotification('Please enter a backup name', 'warning');
        return;
    }
    
    // Simulate backup creation
    showNotification('Creating configuration backup...', 'info');
    
    setTimeout(() => {
        closeBackupRestoreModal();
        showNotification(`Backup "${backupName}" created successfully`, 'success');
    }, 2000);
}

function executeRestore() {
    const selectedBackup = document.getElementById('restoreBackup').value;
    if (!selectedBackup) {
        showNotification('Please select a backup to restore', 'warning');
        return;
    }
    
    // Simulate restore process
    showNotification('Restoring configuration...', 'info');
    
    setTimeout(() => {
        closeBackupRestoreModal();
        showNotification(`Configuration restored from "${selectedBackup}"`, 'success');
        // Reload page to show restored configuration
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }, 3000);
}

function closeBackupRestoreModal() {
    document.getElementById('backupRestoreModal').style.display = 'none';
}

function viewConfigHistory() {
    const modal = document.getElementById('configHistoryModal');
    const content = document.getElementById('configHistoryContent');
    
    // Generate demo history data
    const history = [
        {
            version: 'v2.1.3',
            date: '2025-01-15 14:30:00',
            user: 'admin@colorado.gov',
            changes: ['Updated matching threshold', 'Added new algorithm weight'],
            status: 'active'
        },
        {
            version: 'v2.1.2',
            date: '2025-01-10 09:15:00',
            user: 'security@colorado.gov',
            changes: ['Enhanced password policy', 'Updated CORS settings'],
            status: 'archived'
        },
        {
            version: 'v2.1.1',
            date: '2025-01-05 16:45:00',
            user: 'developer@colorado.gov',
            changes: ['Database pool optimization', 'Monitoring improvements'],
            status: 'archived'
        }
    ];
    
    content.innerHTML = `
        <div class="space-y-4">
            ${history.map(item => `
                <div class="border rounded-lg p-4 ${item.status === 'active' ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h5 class="font-medium">${item.version}</h5>
                            <p class="text-sm text-gray-600">${item.date}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            ${item.status === 'active' ? '<span class="badge badge-primary">Active</span>' : '<span class="badge badge-secondary">Archived</span>'}
                            <button class="btn btn-sm btn-outline" onclick="rollbackToVersion('${item.version}')">
                                <i class="fas fa-undo"></i>
                                Rollback
                            </button>
                        </div>
                    </div>
                    <div class="text-sm">
                        <div class="text-gray-600 mb-1">By: ${item.user}</div>
                        <div class="space-y-1">
                            ${item.changes.map(change => `<div class="flex items-center"><i class="fas fa-dot-circle text-blue-500 text-xs mr-2"></i>${change}</div>`).join('')}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    modal.style.display = 'flex';
}

function closeConfigHistoryModal() {
    document.getElementById('configHistoryModal').style.display = 'none';
}

function rollbackToVersion(version) {
    if (confirm(`Are you sure you want to rollback to ${version}? This will overwrite current configuration.`)) {
        showNotification(`Rolling back to ${version}...`, 'info');
        
        setTimeout(() => {
            closeConfigHistoryModal();
            showNotification(`Successfully rolled back to ${version}`, 'success');
        }, 2000);
    }
}

function compareConfigurations() {
    showNotification('Configuration comparison feature coming soon', 'info');
}

function testDatabaseConnection() {
    showNotification('Testing database connection...', 'info');
    
    setTimeout(() => {
        showNotification('Database connection successful', 'success');
    }, 2000);
}

function testExternalService(serviceName) {
    showNotification(`Testing ${serviceName.replace('_', ' ')} service...`, 'info');
    
    setTimeout(() => {
        showNotification(`${serviceName.replace('_', ' ')} service is responding`, 'success');
    }, 1500);
}