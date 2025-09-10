// Audit Logs Page
function loadAuditLogsPage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="space-y-6">
            <!-- Audit Log Filters -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Audit Log Search</h3>
                    <button class="btn btn-sm btn-outline" onclick="exportLogs()">
                        <i class="fas fa-download"></i>
                        Export Logs
                    </button>
                </div>
                <div class="card-body">
                    <form id="auditSearchForm" onsubmit="searchAuditLogs(event)">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div class="form-group">
                                <label class="form-label">Date Range</label>
                                <select class="form-select" name="dateRange">
                                    <option value="today">Today</option>
                                    <option value="yesterday">Yesterday</option>
                                    <option value="last_7_days" selected>Last 7 Days</option>
                                    <option value="last_30_days">Last 30 Days</option>
                                    <option value="custom">Custom Range</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Event Type</label>
                                <select class="form-select" name="eventType">
                                    <option value="all">All Events</option>
                                    <option value="auth">Authentication</option>
                                    <option value="data_access">Data Access</option>
                                    <option value="system">System Events</option>
                                    <option value="admin">Admin Actions</option>
                                    <option value="security">Security Events</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">User</label>
                                <input type="text" class="form-control" name="user" placeholder="Username or email">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Severity</label>
                                <select class="form-select" name="severity">
                                    <option value="all">All Levels</option>
                                    <option value="info">Info</option>
                                    <option value="warning">Warning</option>
                                    <option value="error">Error</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                        </div>
                        <div class="mt-4">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-search"></i>
                                Search Logs
                            </button>
                            <button type="button" class="btn btn-outline ml-2" onclick="clearFilters()">
                                <i class="fas fa-times"></i>
                                Clear Filters
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Audit Log Results -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Audit Trail</h3>
                    <div class="flex items-center gap-2">
                        <span class="text-sm text-gray-600" id="logCount">Showing 50 of 1,247 entries</span>
                        <button class="btn btn-sm btn-outline" onclick="refreshLogs()">
                            <i class="fas fa-refresh"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Event Type</th>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Resource</th>
                                    <th>IP Address</th>
                                    <th>Severity</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody id="auditLogTableBody">
                                <!-- Audit log entries will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                    <div class="mt-4 flex justify-between items-center">
                        <div class="text-sm text-gray-600">
                            Page 1 of 25
                        </div>
                        <div class="flex gap-2">
                            <button class="btn btn-sm btn-outline" disabled>Previous</button>
                            <button class="btn btn-sm btn-outline">Next</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    initializeAuditLogs();
}

function initializeAuditLogs() {
    loadAuditLogTable();
}

function loadAuditLogTable() {
    const tableBody = document.getElementById('auditLogTableBody');
    
    const auditLogs = [
        {
            timestamp: '2025-01-15 14:32:15',
            eventType: 'auth',
            user: 'admin@colorado.gov',
            action: 'Login successful',
            resource: 'Admin Dashboard',
            ipAddress: '192.168.1.100',
            severity: 'info',
            details: 'User logged in successfully'
        },
        {
            timestamp: '2025-01-15 14:30:02',
            eventType: 'data_access',
            user: 'analyst@colorado.gov',
            action: 'Identity search',
            resource: 'Identity Database',
            ipAddress: '192.168.1.105',
            severity: 'info',
            details: 'Searched for John Doe, DOB: 1985-03-15'
        },
        {
            timestamp: '2025-01-15 14:28:45',
            eventType: 'security',
            user: 'unknown',
            action: 'Failed login attempt',
            resource: 'Authentication System',
            ipAddress: '203.0.113.15',
            severity: 'warning',
            details: 'Multiple failed login attempts for admin@colorado.gov'
        },
        {
            timestamp: '2025-01-15 14:25:30',
            eventType: 'admin',
            user: 'admin@colorado.gov',
            action: 'Configuration updated',
            resource: 'System Configuration',
            ipAddress: '192.168.1.100',
            severity: 'info',
            details: 'Updated matching threshold from 0.85 to 0.87'
        },
        {
            timestamp: '2025-01-15 14:20:12',
            eventType: 'system',
            user: 'system',
            action: 'Batch job completed',
            resource: 'Batch Processing Engine',
            ipAddress: '127.0.0.1',
            severity: 'info',
            details: 'Job JOB-2025-001 completed successfully, processed 15,000 records'
        },
        {
            timestamp: '2025-01-15 14:15:08',
            eventType: 'data_access',
            user: 'analyst@colorado.gov',
            action: 'Report generation',
            resource: 'Reporting System',
            ipAddress: '192.168.1.105',
            severity: 'info',
            details: 'Generated monthly compliance report'
        },
        {
            timestamp: '2025-01-15 14:10:55',
            eventType: 'security',
            user: 'security@colorado.gov',
            action: 'Security scan initiated',
            resource: 'Security Scanner',
            ipAddress: '192.168.1.110',
            severity: 'info',
            details: 'Initiated vulnerability scan on all systems'
        },
        {
            timestamp: '2025-01-15 14:05:23',
            eventType: 'admin',
            user: 'admin@colorado.gov',
            action: 'User permissions modified',
            resource: 'User Management',
            ipAddress: '192.168.1.100',
            severity: 'warning',
            details: 'Added admin role to user: newuser@colorado.gov'
        },
        {
            timestamp: '2025-01-15 14:00:01',
            eventType: 'system',
            user: 'system',
            action: 'System backup completed',
            resource: 'Backup Service',
            ipAddress: '127.0.0.1',
            severity: 'info',
            details: 'Automated daily backup completed successfully'
        },
        {
            timestamp: '2025-01-15 13:55:44',
            eventType: 'auth',
            user: 'analyst@colorado.gov',
            action: 'Session timeout',
            resource: 'Authentication System',
            ipAddress: '192.168.1.105',
            severity: 'info',
            details: 'User session expired due to inactivity'
        }
    ];

    tableBody.innerHTML = auditLogs.map(log => `
        <tr>
            <td class="text-sm">${log.timestamp}</td>
            <td>
                <span class="badge badge-${getEventTypeBadge(log.eventType)}">${log.eventType.replace('_', ' ')}</span>
            </td>
            <td class="text-sm">${log.user}</td>
            <td class="text-sm font-medium">${log.action}</td>
            <td class="text-sm">${log.resource}</td>
            <td class="text-sm font-mono">${log.ipAddress}</td>
            <td>
                <span class="badge badge-${getSeverityBadge(log.severity)}">${log.severity}</span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="viewLogDetails('${log.timestamp}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getEventTypeBadge(eventType) {
    switch(eventType) {
        case 'auth': return 'primary';
        case 'data_access': return 'info';
        case 'system': return 'secondary';
        case 'admin': return 'warning';
        case 'security': return 'danger';
        default: return 'secondary';
    }
}

function getSeverityBadge(severity) {
    switch(severity) {
        case 'info': return 'info';
        case 'warning': return 'warning';
        case 'error': return 'danger';
        case 'critical': return 'danger';
        default: return 'secondary';
    }
}

function searchAuditLogs(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const filters = Object.fromEntries(formData.entries());
    
    showNotification('Searching audit logs...', 'info');
    
    setTimeout(() => {
        // Filter and reload table based on search criteria
        loadAuditLogTable();
        showNotification('Search completed', 'success');
    }, 1000);
}

function clearFilters() {
    document.getElementById('auditSearchForm').reset();
    loadAuditLogTable();
    showNotification('Filters cleared', 'info');
}

function refreshLogs() {
    loadAuditLogTable();
    showNotification('Audit logs refreshed', 'success');
}

function viewLogDetails(timestamp) {
    showNotification(`Loading details for log entry at ${timestamp}`, 'info');
}

function exportLogs() {
    showNotification('Exporting audit logs...', 'info');
    
    // Generate CSV export
    const csvContent = `Timestamp,Event Type,User,Action,Resource,IP Address,Severity,Details
2025-01-15 14:32:15,auth,admin@colorado.gov,Login successful,Admin Dashboard,192.168.1.100,info,User logged in successfully
2025-01-15 14:30:02,data_access,analyst@colorado.gov,Identity search,Identity Database,192.168.1.105,info,"Searched for John Doe, DOB: 1985-03-15"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Audit logs exported successfully', 'success');
}