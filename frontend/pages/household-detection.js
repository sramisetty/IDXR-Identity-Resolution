// Household Detection and Relationship Visualization Page
function loadHouseholdDetectionPage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="space-y-6">
            <!-- Household Detection Overview -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="stat-card success">
                    <div class="stat-header">
                        <span class="stat-title">Households Detected</span>
                        <div class="stat-icon success">
                            <i class="fas fa-home"></i>
                        </div>
                    </div>
                    <div class="stat-value">2,847</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>+156 this month</span>
                    </div>
                </div>

                <div class="stat-card info">
                    <div class="stat-header">
                        <span class="stat-title">Family Members</span>
                        <div class="stat-icon info">
                            <i class="fas fa-users"></i>
                        </div>
                    </div>
                    <div class="stat-value">8,934</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>Avg 3.1 per household</span>
                    </div>
                </div>

                <div class="stat-card warning">
                    <div class="stat-header">
                        <span class="stat-title">Accuracy Rate</span>
                        <div class="stat-icon warning">
                            <i class="fas fa-bullseye"></i>
                        </div>
                    </div>
                    <div class="stat-value">94.2%</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>+2.1% improvement</span>
                    </div>
                </div>

                <div class="stat-card primary">
                    <div class="stat-header">
                        <span class="stat-title">Manual Reviews</span>
                        <div class="stat-icon primary">
                            <i class="fas fa-eye"></i>
                        </div>
                    </div>
                    <div class="stat-value">127</div>
                    <div class="stat-change negative">
                        <i class="fas fa-arrow-down"></i>
                        <span>-23 from last week</span>
                    </div>
                </div>
            </div>

            <!-- Household Search and Detection -->
            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Household Search</h3>
                    </div>
                    <div class="card-body">
                        <form id="householdSearchForm" onsubmit="searchHouseholds(event)">
                            <div class="space-y-4">
                                <div class="form-group">
                                    <label class="form-label">Search By</label>
                                    <select class="form-select" name="searchType">
                                        <option value="address">Address</option>
                                        <option value="name">Family Name</option>
                                        <option value="phone">Phone Number</option>
                                        <option value="household_id">Household ID</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Search Term</label>
                                    <input type="text" class="form-control" name="searchTerm" placeholder="Enter search term..." required>
                                </div>
                                <button type="submit" class="btn btn-primary w-full">
                                    <i class="fas fa-search"></i>
                                    Search Households
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div class="xl:col-span-2">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Household Visualization</h3>
                            <div class="flex gap-2">
                                <button class="btn btn-sm btn-outline" onclick="switchView('tree')">Tree View</button>
                                <button class="btn btn-sm btn-outline" onclick="switchView('network')">Network View</button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div id="householdVisualization" style="height: 400px; background: #f8fafc; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: #6b7280;">
                                <div class="text-center">
                                    <i class="fas fa-sitemap text-4xl mb-4"></i>
                                    <p>Search for a household to view relationships</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Detection Results and Analytics -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Recent Detections</h3>
                        <button class="btn btn-sm btn-outline" onclick="refreshDetections()">
                            <i class="fas fa-refresh"></i>
                            Refresh
                        </button>
                    </div>
                    <div class="card-body">
                        <div id="recentDetections">
                            <!-- Recent detections will be loaded here -->
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Household Analytics</h3>
                    </div>
                    <div class="card-body">
                        <canvas id="householdAnalyticsChart" height="300"></canvas>
                    </div>
                </div>
            </div>

            <!-- Detailed Household Information -->
            <div class="card" id="householdDetailsCard" style="display: none;">
                <div class="card-header">
                    <h3 class="card-title">Household Details</h3>
                    <button class="btn btn-sm btn-outline" onclick="exportHouseholdData()">
                        <i class="fas fa-download"></i>
                        Export
                    </button>
                </div>
                <div class="card-body">
                    <div id="householdDetails">
                        <!-- Household details will be loaded here -->
                    </div>
                </div>
            </div>
        </div>
    `;

    initializeHouseholdDetection();
}

function initializeHouseholdDetection() {
    loadRecentDetections();
    setupHouseholdAnalyticsChart();
}

function loadRecentDetections() {
    const container = document.getElementById('recentDetections');
    
    const detections = [
        {
            householdId: 'HH-2025-001234',
            address: '123 Family Lane, Denver, CO 80202',
            members: 4,
            confidence: 96.8,
            detectedAt: '2 hours ago',
            status: 'confirmed'
        },
        {
            householdId: 'HH-2025-001235',
            address: '456 Oak Street, Aurora, CO 80014',
            members: 3,
            confidence: 89.2,
            detectedAt: '5 hours ago',
            status: 'pending_review'
        },
        {
            householdId: 'HH-2025-001236',
            address: '789 Pine Avenue, Lakewood, CO 80215',
            members: 5,
            confidence: 94.1,
            detectedAt: '1 day ago',
            status: 'confirmed'
        },
        {
            householdId: 'HH-2025-001237',
            address: '321 Elm Drive, Westminster, CO 80031',
            members: 2,
            confidence: 87.5,
            detectedAt: '2 days ago',
            status: 'under_review'
        }
    ];

    container.innerHTML = detections.map(detection => `
        <div class="border rounded p-3 mb-3 cursor-pointer hover:border-blue-300" onclick="viewHouseholdDetails('${detection.householdId}')">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <div class="font-medium text-sm">${detection.householdId}</div>
                    <div class="text-xs text-gray-600">${detection.address}</div>
                </div>
                <span class="badge badge-${getDetectionStatusColor(detection.status)}">${detection.status.replace('_', ' ')}</span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-xs">
                <div>
                    <span class="text-gray-500">Members:</span>
                    <span class="font-medium">${detection.members}</span>
                </div>
                <div>
                    <span class="text-gray-500">Confidence:</span>
                    <span class="font-medium">${detection.confidence}%</span>
                </div>
                <div>
                    <span class="text-gray-500">Detected:</span>
                    <span class="font-medium">${detection.detectedAt}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function setupHouseholdAnalyticsChart() {
    const ctx = document.getElementById('householdAnalyticsChart').getContext('2d');
    
    chartInstances.householdAnalytics = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Single Person', '2 Members', '3-4 Members', '5+ Members'],
            datasets: [{
                data: [425, 867, 1245, 310],
                backgroundColor: [
                    'rgb(59, 130, 246)',
                    'rgb(34, 197, 94)',
                    'rgb(168, 85, 247)',
                    'rgb(245, 158, 11)'
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

function searchHouseholds(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const searchType = formData.get('searchType');
    const searchTerm = formData.get('searchTerm');
    
    showNotification(`Searching households by ${searchType}: ${searchTerm}...`, 'info');
    
    // Simulate search and show sample household
    setTimeout(() => {
        showSampleHousehold();
        showNotification('Household found and displayed', 'success');
    }, 1500);
}

function showSampleHousehold() {
    const visualization = document.getElementById('householdVisualization');
    const detailsCard = document.getElementById('householdDetailsCard');
    const detailsContent = document.getElementById('householdDetails');
    
    // Show sample visualization (would normally be a real chart/diagram)
    visualization.innerHTML = `
        <div class="w-full h-full p-4">
            <div class="text-center mb-4">
                <h4 class="font-semibold">The Johnson Family Household</h4>
                <p class="text-sm text-gray-600">123 Family Lane, Denver, CO 80202</p>
            </div>
            <div class="grid grid-cols-2 gap-4 h-full">
                <div class="space-y-3">
                    <div class="bg-blue-100 p-3 rounded text-center">
                        <i class="fas fa-user text-blue-600 mb-2"></i>
                        <div class="text-sm font-medium">John Johnson</div>
                        <div class="text-xs text-gray-600">Head of Household</div>
                        <div class="text-xs">Age: 45</div>
                    </div>
                    <div class="bg-pink-100 p-3 rounded text-center">
                        <i class="fas fa-user text-pink-600 mb-2"></i>
                        <div class="text-sm font-medium">Mary Johnson</div>
                        <div class="text-xs text-gray-600">Spouse</div>
                        <div class="text-xs">Age: 42</div>
                    </div>
                </div>
                <div class="space-y-3">
                    <div class="bg-green-100 p-3 rounded text-center">
                        <i class="fas fa-child text-green-600 mb-2"></i>
                        <div class="text-sm font-medium">Emma Johnson</div>
                        <div class="text-xs text-gray-600">Child</div>
                        <div class="text-xs">Age: 16</div>
                    </div>
                    <div class="bg-yellow-100 p-3 rounded text-center">
                        <i class="fas fa-baby text-yellow-600 mb-2"></i>
                        <div class="text-sm font-medium">Lucas Johnson</div>
                        <div class="text-xs text-gray-600">Child</div>
                        <div class="text-xs">Age: 8</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Show household details
    detailsContent.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
                <h5 class="font-semibold mb-3">Household Information</h5>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-600">Household ID:</span>
                        <span class="font-medium">HH-2025-001234</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Address:</span>
                        <span class="font-medium">123 Family Lane, Denver, CO 80202</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Total Members:</span>
                        <span class="font-medium">4</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Detection Confidence:</span>
                        <span class="font-medium">96.8%</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">First Detected:</span>
                        <span class="font-medium">2024-12-15</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Last Updated:</span>
                        <span class="font-medium">2025-01-15</span>
                    </div>
                </div>
            </div>
            <div>
                <h5 class="font-semibold mb-3">Detection Criteria</h5>
                <div class="space-y-2 text-sm">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-check-circle text-green-500"></i>
                        <span>Shared Address (100% match)</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="fas fa-check-circle text-green-500"></i>
                        <span>Shared Phone Number (95% match)</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="fas fa-check-circle text-green-500"></i>
                        <span>Last Name Similarity (100% match)</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="fas fa-check-circle text-green-500"></i>
                        <span>Age Pattern Analysis (98% confidence)</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="fas fa-exclamation-triangle text-yellow-500"></i>
                        <span>Email Domain Match (78% similarity)</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    detailsCard.style.display = 'block';
}

function getDetectionStatusColor(status) {
    switch(status) {
        case 'confirmed': return 'success';
        case 'pending_review': return 'warning';
        case 'under_review': return 'info';
        case 'rejected': return 'danger';
        default: return 'secondary';
    }
}

function switchView(viewType) {
    showNotification(`Switching to ${viewType} view...`, 'info');
    // Would implement different visualization modes here
}

function viewHouseholdDetails(householdId) {
    showNotification(`Loading details for ${householdId}...`, 'info');
    showSampleHousehold();
}

function refreshDetections() {
    loadRecentDetections();
    showNotification('Detection list refreshed', 'success');
}

function exportHouseholdData() {
    showNotification('Exporting household data...', 'info');
    
    // Generate sample CSV
    const csvContent = `Household ID,Address,Members,Confidence,Status
HH-2025-001234,"123 Family Lane, Denver, CO 80202",4,96.8%,confirmed
HH-2025-001235,"456 Oak Street, Aurora, CO 80014",3,89.2%,pending_review`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `household_data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Household data exported successfully', 'success');
}