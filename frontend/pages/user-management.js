// User Management Page
function loadUserManagementPage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="space-y-6">
            <!-- User Management Overview -->
            <div class="stats-grid">
                <div class="stat-card primary">
                    <div class="stat-header">
                        <span class="stat-title">Total Users</span>
                        <div class="stat-icon primary">
                            <i class="fas fa-users"></i>
                        </div>
                    </div>
                    <div class="stat-value">47</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>+3 this month</span>
                    </div>
                </div>

                <div class="stat-card success">
                    <div class="stat-header">
                        <span class="stat-title">Active Sessions</span>
                        <div class="stat-icon success">
                            <i class="fas fa-user-check"></i>
                        </div>
                    </div>
                    <div class="stat-value">23</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>Currently online</span>
                    </div>
                </div>

                <div class="stat-card warning">
                    <div class="stat-header">
                        <span class="stat-title">Pending Approvals</span>
                        <div class="stat-icon warning">
                            <i class="fas fa-user-clock"></i>
                        </div>
                    </div>
                    <div class="stat-value">5</div>
                    <div class="stat-change negative">
                        <i class="fas fa-clock"></i>
                        <span>Awaiting review</span>
                    </div>
                </div>

                <div class="stat-card info">
                    <div class="stat-header">
                        <span class="stat-title">Admin Users</span>
                        <div class="stat-icon info">
                            <i class="fas fa-user-shield"></i>
                        </div>
                    </div>
                    <div class="stat-value">8</div>
                    <div class="stat-change positive">
                        <i class="fas fa-shield-alt"></i>
                        <span>17% of total</span>
                    </div>
                </div>
            </div>

            <!-- User Actions -->
            <div class="flex justify-between items-center">
                <div class="flex gap-2">
                    <button class="btn btn-primary" onclick="openAddUserModal()">
                        <i class="fas fa-user-plus"></i>
                        Add User
                    </button>
                    <button class="btn btn-outline" onclick="bulkUserActions()">
                        <i class="fas fa-tasks"></i>
                        Bulk Actions
                    </button>
                    <button class="btn btn-outline" onclick="exportUsers()">
                        <i class="fas fa-download"></i>
                        Export Users
                    </button>
                </div>
                <div class="flex gap-2">
                    <input type="text" class="form-control" placeholder="Search users..." id="userSearch" style="width: 300px;">
                    <button class="btn btn-outline" onclick="searchUsers()">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            </div>

            <!-- Users Table -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">User Directory</h3>
                    <div class="flex gap-2">
                        <select class="form-select text-sm" onchange="filterUsers(this.value)">
                            <option value="all">All Users</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                            <option value="pending">Pending Approval</option>
                        </select>
                        <button class="btn btn-sm btn-outline" onclick="refreshUsers()">
                            <i class="fas fa-refresh"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>
                                        <input type="checkbox" id="selectAll" onchange="toggleSelectAll()">
                                    </th>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Department</th>
                                    <th>Last Login</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="usersTableBody">
                                <!-- Users will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add/Edit User Modal -->
        <div class="modal" id="userModal" style="display: none;">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title" id="userModalTitle">Add New User</h4>
                        <button class="modal-close" onclick="closeUserModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="userForm" onsubmit="saveUser(event)">
                            <div class="grid grid-cols-2 gap-4">
                                <div class="form-group">
                                    <label class="form-label">First Name *</label>
                                    <input type="text" class="form-control" name="firstName" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Last Name *</label>
                                    <input type="text" class="form-control" name="lastName" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Email Address *</label>
                                    <input type="email" class="form-control" name="email" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Username *</label>
                                    <input type="text" class="form-control" name="username" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Role *</label>
                                    <select class="form-select" name="role" required>
                                        <option value="">Select Role</option>
                                        <option value="viewer">Viewer</option>
                                        <option value="analyst">Analyst</option>
                                        <option value="admin">Administrator</option>
                                        <option value="super_admin">Super Administrator</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Department</label>
                                    <select class="form-select" name="department">
                                        <option value="">Select Department</option>
                                        <option value="it">IT Department</option>
                                        <option value="security">Security</option>
                                        <option value="compliance">Compliance</option>
                                        <option value="operations">Operations</option>
                                        <option value="management">Management</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Phone</label>
                                    <input type="tel" class="form-control" name="phone">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Title</label>
                                    <input type="text" class="form-control" name="title">
                                </div>
                            </div>
                            <div class="form-group mt-4">
                                <label class="flex items-center">
                                    <input type="checkbox" name="sendWelcomeEmail" checked class="mr-2">
                                    <span>Send welcome email with login instructions</span>
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeUserModal()">Cancel</button>
                        <button type="submit" form="userForm" class="btn btn-primary">Save User</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    initializeUserManagement();
}

function initializeUserManagement() {
    loadUsersTable();
}

function loadUsersTable() {
    const tableBody = document.getElementById('usersTableBody');
    
    const users = [
        {
            id: 1,
            firstName: 'John',
            lastName: 'Administrator',
            email: 'admin@colorado.gov',
            username: 'admin',
            role: 'super_admin',
            department: 'IT Department',
            lastLogin: '2025-01-15 14:32',
            status: 'active',
            avatar: 'JA'
        },
        {
            id: 2,
            firstName: 'Sarah',
            lastName: 'Johnson',
            email: 'sarah.johnson@colorado.gov',
            username: 'sjohnson',
            role: 'admin',
            department: 'Security',
            lastLogin: '2025-01-15 13:45',
            status: 'active',
            avatar: 'SJ'
        },
        {
            id: 3,
            firstName: 'Mike',
            lastName: 'Chen',
            email: 'mike.chen@colorado.gov',
            username: 'mchen',
            role: 'analyst',
            department: 'Operations',
            lastLogin: '2025-01-15 11:20',
            status: 'active',
            avatar: 'MC'
        },
        {
            id: 4,
            firstName: 'Lisa',
            lastName: 'Rodriguez',
            email: 'lisa.rodriguez@colorado.gov',
            username: 'lrodriguez',
            role: 'analyst',
            department: 'Compliance',
            lastLogin: '2025-01-14 16:30',
            status: 'inactive',
            avatar: 'LR'
        },
        {
            id: 5,
            firstName: 'David',
            lastName: 'Wilson',
            email: 'david.wilson@colorado.gov',
            username: 'dwilson',
            role: 'viewer',
            department: 'Management',
            lastLogin: 'Never',
            status: 'pending',
            avatar: 'DW'
        }
    ];

    tableBody.innerHTML = users.map(user => `
        <tr>
            <td>
                <input type="checkbox" class="user-checkbox" value="${user.id}">
            </td>
            <td>
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        ${user.avatar}
                    </div>
                    <div>
                        <div class="font-medium">${user.firstName} ${user.lastName}</div>
                        <div class="text-sm text-gray-600">${user.email}</div>
                    </div>
                </div>
            </td>
            <td>
                <span class="badge badge-${getRoleBadge(user.role)}">${formatRole(user.role)}</span>
            </td>
            <td class="text-sm">${user.department}</td>
            <td class="text-sm">${user.lastLogin}</td>
            <td>
                <span class="badge badge-${getStatusBadge(user.status)}">${user.status}</span>
            </td>
            <td>
                <div class="flex gap-1">
                    <button class="btn btn-sm btn-outline" onclick="editUser(${user.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="resetPassword(${user.id})" title="Reset Password">
                        <i class="fas fa-key"></i>
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="viewUserActivity(${user.id})" title="View Activity">
                        <i class="fas fa-history"></i>
                    </button>
                    <button class="btn btn-sm btn-${user.status === 'active' ? 'warning' : 'success'}" onclick="toggleUserStatus(${user.id})" title="${user.status === 'active' ? 'Deactivate' : 'Activate'}">
                        <i class="fas fa-${user.status === 'active' ? 'user-times' : 'user-check'}"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getRoleBadge(role) {
    switch(role) {
        case 'super_admin': return 'danger';
        case 'admin': return 'warning';
        case 'analyst': return 'primary';
        case 'viewer': return 'info';
        default: return 'secondary';
    }
}

function formatRole(role) {
    return role.replace('_', ' ').split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function getStatusBadge(status) {
    switch(status) {
        case 'active': return 'success';
        case 'inactive': return 'secondary';
        case 'pending': return 'warning';
        case 'suspended': return 'danger';
        default: return 'secondary';
    }
}

function openAddUserModal() {
    document.getElementById('userModalTitle').textContent = 'Add New User';
    document.getElementById('userForm').reset();
    document.getElementById('userModal').style.display = 'flex';
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

function saveUser(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = Object.fromEntries(formData.entries());
    
    showNotification('Saving user...', 'info');
    
    setTimeout(() => {
        showNotification(`User ${userData.firstName} ${userData.lastName} saved successfully`, 'success');
        closeUserModal();
        loadUsersTable();
    }, 1500);
}

function editUser(userId) {
    document.getElementById('userModalTitle').textContent = 'Edit User';
    // Load user data into form
    showNotification(`Loading user ${userId} for editing...`, 'info');
    document.getElementById('userModal').style.display = 'flex';
}

function resetPassword(userId) {
    if (confirm('Are you sure you want to reset the password for this user? A new temporary password will be sent to their email.')) {
        showNotification(`Password reset email sent to user ${userId}`, 'success');
    }
}

function viewUserActivity(userId) {
    showNotification(`Loading activity log for user ${userId}...`, 'info');
}

function toggleUserStatus(userId) {
    showNotification(`User ${userId} status updated`, 'success');
    loadUsersTable();
}

function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.user-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
}

function filterUsers(filter) {
    showNotification(`Filtering users: ${filter}`, 'info');
    // Filter table based on selection
    loadUsersTable();
}

function searchUsers() {
    const searchTerm = document.getElementById('userSearch').value;
    showNotification(`Searching for: ${searchTerm}`, 'info');
    // Filter table based on search
    loadUsersTable();
}

function refreshUsers() {
    loadUsersTable();
    showNotification('User list refreshed', 'success');
}

function bulkUserActions() {
    const selectedUsers = document.querySelectorAll('.user-checkbox:checked').length;
    if (selectedUsers === 0) {
        showNotification('Please select users first', 'warning');
        return;
    }
    showNotification(`Bulk actions for ${selectedUsers} users coming soon`, 'info');
}

function exportUsers() {
    showNotification('Exporting user list...', 'info');
    
    // Generate CSV export
    const csvContent = `Name,Email,Role,Department,Status,Last Login
John Administrator,admin@colorado.gov,Super Admin,IT Department,active,2025-01-15 14:32
Sarah Johnson,sarah.johnson@colorado.gov,Admin,Security,active,2025-01-15 13:45`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('User list exported successfully', 'success');
}