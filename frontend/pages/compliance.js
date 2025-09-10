// Compliance Management Page
function loadCompliancePage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="space-y-6">
            <!-- Compliance Overview -->
            <div class="stats-grid">
                <div class="stat-card success">
                    <div class="stat-header">
                        <span class="stat-title">FISMA Score</span>
                        <div class="stat-icon success">
                            <i class="fas fa-shield-check"></i>
                        </div>
                    </div>
                    <div class="stat-value">98.5%</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>+1.2% improvement</span>
                    </div>
                </div>

                <div class="stat-card info">
                    <div class="stat-header">
                        <span class="stat-title">NIST Framework</span>
                        <div class="stat-icon info">
                            <i class="fas fa-clipboard-check"></i>
                        </div>
                    </div>
                    <div class="stat-value">97.2%</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>5 recommendations</span>
                    </div>
                </div>

                <div class="stat-card primary">
                    <div class="stat-header">
                        <span class="stat-title">Colorado Privacy</span>
                        <div class="stat-icon primary">
                            <i class="fas fa-user-shield"></i>
                        </div>
                    </div>
                    <div class="stat-value">99.1%</div>
                    <div class="stat-change positive">
                        <i class="fas fa-check"></i>
                        <span>Fully compliant</span>
                    </div>
                </div>

                <div class="stat-card warning">
                    <div class="stat-header">
                        <span class="stat-title">Action Items</span>
                        <div class="stat-icon warning">
                            <i class="fas fa-tasks"></i>
                        </div>
                    </div>
                    <div class="stat-value">8</div>
                    <div class="stat-change negative">
                        <i class="fas fa-clock"></i>
                        <span>3 overdue</span>
                    </div>
                </div>
            </div>

            <!-- Compliance Frameworks -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Compliance Framework Status</h3>
                    <button class="btn btn-sm btn-primary" onclick="runComplianceAudit()">
                        <i class="fas fa-search"></i>
                        Run Audit
                    </button>
                </div>
                <div class="card-body">
                    <div id="complianceFrameworks">
                        <!-- Compliance frameworks will be loaded here -->
                    </div>
                </div>
            </div>

            <!-- Audit Trail and Action Items -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Recent Audit Findings</h3>
                    </div>
                    <div class="card-body">
                        <div id="auditFindings">
                            <!-- Audit findings will be loaded here -->
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Action Items</h3>
                        <button class="btn btn-sm btn-outline" onclick="addActionItem()">
                            <i class="fas fa-plus"></i>
                            Add Item
                        </button>
                    </div>
                    <div class="card-body">
                        <div id="actionItems">
                            <!-- Action items will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    initializeCompliance();
}

function initializeCompliance() {
    loadComplianceFrameworks();
    loadAuditFindings();
    loadActionItems();
}

function loadComplianceFrameworks() {
    const container = document.getElementById('complianceFrameworks');
    
    const frameworks = [
        {
            name: 'FISMA (Federal Information Security Management Act)',
            score: 98.5,
            status: 'compliant',
            lastAudit: '2025-01-10',
            findings: 3,
            nextAudit: '2025-04-10'
        },
        {
            name: 'NIST Cybersecurity Framework',
            score: 97.2,
            status: 'compliant',
            lastAudit: '2025-01-08',
            findings: 5,
            nextAudit: '2025-04-08'
        },
        {
            name: 'Colorado Privacy Act',
            score: 99.1,
            status: 'compliant',
            lastAudit: '2025-01-05',
            findings: 0,
            nextAudit: '2025-07-05'
        },
        {
            name: 'FERPA (Family Educational Rights and Privacy Act)',
            score: 96.8,
            status: 'review',
            lastAudit: '2024-12-15',
            findings: 2,
            nextAudit: '2025-03-15'
        }
    ];

    container.innerHTML = frameworks.map(framework => `
        <div class="border rounded-lg p-4 mb-4 ${getFrameworkStatusClass(framework.status)}">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h4 class="font-medium">${framework.name}</h4>
                    <div class="text-sm text-gray-600">Last audit: ${framework.lastAudit}</div>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-${getFrameworkColor(framework.status)}-600">${framework.score}%</div>
                    <span class="badge badge-${getFrameworkBadgeColor(framework.status)}">${framework.status}</span>
                </div>
            </div>
            <div class="grid grid-cols-3 gap-4 text-sm">
                <div>
                    <span class="text-gray-500">Findings:</span>
                    <span class="font-medium">${framework.findings}</span>
                </div>
                <div>
                    <span class="text-gray-500">Next Audit:</span>
                    <span class="font-medium">${framework.nextAudit}</span>
                </div>
                <div class="text-right">
                    <button class="btn btn-sm btn-outline" onclick="viewFrameworkDetails('${framework.name}')">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function loadAuditFindings() {
    const container = document.getElementById('auditFindings');
    
    const findings = [
        {
            framework: 'FISMA',
            category: 'Access Control',
            severity: 'medium',
            description: 'Review service account password policies',
            status: 'open',
            dueDate: '2025-02-15'
        },
        {
            framework: 'NIST',
            category: 'Data Protection',
            severity: 'low',
            description: 'Update encryption key rotation schedule',
            status: 'in_progress',
            dueDate: '2025-02-28'
        },
        {
            framework: 'FISMA',
            category: 'Logging',
            severity: 'high',
            description: 'Enhance audit log retention policies',
            status: 'resolved',
            dueDate: '2025-01-20'
        },
        {
            framework: 'FERPA',
            category: 'Privacy',
            severity: 'medium',
            description: 'Update data sharing agreements',
            status: 'open',
            dueDate: '2025-03-01'
        }
    ];

    container.innerHTML = findings.map(finding => `
        <div class="border-l-4 ${getFindingBorderColor(finding.severity)} p-3 mb-3 bg-${getFindingBgColor(finding.severity)}">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <div class="font-medium text-sm">${finding.description}</div>
                    <div class="text-xs text-gray-600">${finding.framework} - ${finding.category}</div>
                </div>
                <span class="badge badge-${getFindingSeverityColor(finding.severity)}">${finding.severity}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500">Due: ${finding.dueDate}</span>
                <span class="badge badge-${getFindingStatusColor(finding.status)}">${finding.status.replace('_', ' ')}</span>
            </div>
        </div>
    `).join('');
}

function loadActionItems() {
    const container = document.getElementById('actionItems');
    
    const items = [
        {
            title: 'Update security training materials',
            assignee: 'Security Team',
            priority: 'high',
            dueDate: '2025-02-10',
            status: 'overdue'
        },
        {
            title: 'Review user access permissions',
            assignee: 'Admin Team',
            priority: 'medium',
            dueDate: '2025-02-20',
            status: 'pending'
        },
        {
            title: 'Conduct penetration testing',
            assignee: 'External Vendor',
            priority: 'high',
            dueDate: '2025-03-01',
            status: 'in_progress'
        },
        {
            title: 'Update incident response plan',
            assignee: 'Compliance Officer',
            priority: 'medium',
            dueDate: '2025-02-25',
            status: 'pending'
        }
    ];

    container.innerHTML = items.map(item => `
        <div class="border rounded p-3 mb-3 ${getActionItemClass(item.status)}">
            <div class="flex justify-between items-start mb-2">
                <div class="font-medium text-sm">${item.title}</div>
                <span class="badge badge-${getActionItemPriorityColor(item.priority)}">${item.priority}</span>
            </div>
            <div class="text-xs text-gray-600 mb-2">Assigned to: ${item.assignee}</div>
            <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500">Due: ${item.dueDate}</span>
                <span class="badge badge-${getActionItemStatusColor(item.status)}">${item.status.replace('_', ' ')}</span>
            </div>
        </div>
    `).join('');
}

function getFrameworkStatusClass(status) {
    switch(status) {
        case 'compliant': return 'border-green-200 bg-green-50';
        case 'review': return 'border-yellow-200 bg-yellow-50';
        case 'non_compliant': return 'border-red-200 bg-red-50';
        default: return 'border-gray-200 bg-gray-50';
    }
}

function getFrameworkColor(status) {
    switch(status) {
        case 'compliant': return 'green';
        case 'review': return 'yellow';
        case 'non_compliant': return 'red';
        default: return 'gray';
    }
}

function getFrameworkBadgeColor(status) {
    switch(status) {
        case 'compliant': return 'success';
        case 'review': return 'warning';
        case 'non_compliant': return 'danger';
        default: return 'secondary';
    }
}

function getFindingBorderColor(severity) {
    switch(severity) {
        case 'high': return 'border-red-500';
        case 'medium': return 'border-yellow-500';
        case 'low': return 'border-blue-500';
        default: return 'border-gray-500';
    }
}

function getFindingBgColor(severity) {
    switch(severity) {
        case 'high': return 'red-50';
        case 'medium': return 'yellow-50';
        case 'low': return 'blue-50';
        default: return 'gray-50';
    }
}

function getFindingSeverityColor(severity) {
    switch(severity) {
        case 'high': return 'danger';
        case 'medium': return 'warning';
        case 'low': return 'info';
        default: return 'secondary';
    }
}

function getFindingStatusColor(status) {
    switch(status) {
        case 'resolved': return 'success';
        case 'in_progress': return 'warning';
        case 'open': return 'danger';
        default: return 'secondary';
    }
}

function getActionItemClass(status) {
    switch(status) {
        case 'overdue': return 'border-red-200 bg-red-50';
        case 'in_progress': return 'border-yellow-200 bg-yellow-50';
        case 'completed': return 'border-green-200 bg-green-50';
        default: return 'border-gray-200';
    }
}

function getActionItemPriorityColor(priority) {
    switch(priority) {
        case 'high': return 'danger';
        case 'medium': return 'warning';
        case 'low': return 'info';
        default: return 'secondary';
    }
}

function getActionItemStatusColor(status) {
    switch(status) {
        case 'completed': return 'success';
        case 'in_progress': return 'warning';
        case 'overdue': return 'danger';
        default: return 'secondary';
    }
}

function runComplianceAudit() {
    showNotification('Running comprehensive compliance audit...', 'info');
    setTimeout(() => {
        loadComplianceFrameworks();
        loadAuditFindings();
        showNotification('Compliance audit completed', 'success');
    }, 4000);
}

function viewFrameworkDetails(frameworkName) {
    showNotification(`Viewing details for ${frameworkName}`, 'info');
}

function addActionItem() {
    showNotification('Action item creation form coming soon', 'info');
}