// Identity Matching Page
function loadMatchingPage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <!-- Identity Input Form -->
            <div class="xl:col-span-1">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Identity Information</h3>
                        <button class="btn btn-sm btn-outline" onclick="clearIdentityForm()">
                            <i class="fas fa-refresh"></i>
                            Clear
                        </button>
                    </div>
                    <div class="card-body">
                        <form id="identityForm" onsubmit="performIdentityMatch(event)">
                            <div class="space-y-4">
                                <!-- Personal Information -->
                                <div class="form-section">
                                    <h4 class="form-section-title">Personal Information</h4>
                                    
                                    <div class="grid grid-cols-2 gap-3">
                                        <div class="form-group">
                                            <label class="form-label">First Name *</label>
                                            <input type="text" class="form-control" name="first_name" required>
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Last Name *</label>
                                            <input type="text" class="form-control" name="last_name" required>
                                        </div>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">Middle Name</label>
                                        <input type="text" class="form-control" name="middle_name">
                                    </div>

                                    <div class="grid grid-cols-2 gap-3">
                                        <div class="form-group">
                                            <label class="form-label">Date of Birth</label>
                                            <input type="date" class="form-control" name="dob">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Age</label>
                                            <input type="number" class="form-control" name="age" min="0" max="150">
                                        </div>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">Gender</label>
                                        <select class="form-select" name="gender">
                                            <option value="">Select Gender</option>
                                            <option value="M">Male</option>
                                            <option value="F">Female</option>
                                            <option value="X">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Identification Numbers -->
                                <div class="form-section">
                                    <h4 class="form-section-title">Identification</h4>
                                    
                                    <div class="form-group">
                                        <label class="form-label">SSN</label>
                                        <input type="text" class="form-control" name="ssn" placeholder="123-45-6789">
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">Driver's License</label>
                                        <input type="text" class="form-control" name="driver_license">
                                    </div>
                                </div>

                                <!-- Contact Information -->
                                <div class="form-section">
                                    <h4 class="form-section-title">Contact Information</h4>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Phone Number</label>
                                        <input type="tel" class="form-control" name="phone" placeholder="(303) 555-0123">
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">Email Address</label>
                                        <input type="email" class="form-control" name="email">
                                    </div>
                                </div>

                                <!-- Address Information -->
                                <div class="form-section">
                                    <h4 class="form-section-title">Address</h4>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Street Address</label>
                                        <input type="text" class="form-control" name="street">
                                    </div>

                                    <div class="grid grid-cols-2 gap-3">
                                        <div class="form-group">
                                            <label class="form-label">City</label>
                                            <input type="text" class="form-control" name="city">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">State</label>
                                            <select class="form-select" name="state">
                                                <option value="">Select State</option>
                                                <option value="CO">Colorado</option>
                                                <option value="CA">California</option>
                                                <option value="TX">Texas</option>
                                                <option value="NY">New York</option>
                                                <option value="FL">Florida</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div class="grid grid-cols-2 gap-3">
                                        <div class="form-group">
                                            <label class="form-label">ZIP Code</label>
                                            <input type="text" class="form-control" name="zip" pattern="[0-9]{5}(-[0-9]{4})?">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">County</label>
                                            <input type="text" class="form-control" name="county">
                                        </div>
                                    </div>
                                </div>

                                <!-- Search Configuration -->
                                <div class="form-section">
                                    <h4 class="form-section-title">Search Configuration</h4>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Matching Algorithms</label>
                                        <div class="space-y-2">
                                            <label class="flex items-center">
                                                <input type="checkbox" name="algorithms" value="deterministic" checked class="mr-2">
                                                <span class="text-sm">Deterministic (Exact Matches)</span>
                                            </label>
                                            <label class="flex items-center">
                                                <input type="checkbox" name="algorithms" value="probabilistic" checked class="mr-2">
                                                <span class="text-sm">Probabilistic (Statistical)</span>
                                            </label>
                                            <label class="flex items-center">
                                                <input type="checkbox" name="algorithms" value="fuzzy" checked class="mr-2">
                                                <span class="text-sm">Fuzzy (Approximate)</span>
                                            </label>
                                            <label class="flex items-center">
                                                <input type="checkbox" name="algorithms" value="ai_hybrid" class="mr-2">
                                                <span class="text-sm">AI Hybrid (ML Enhanced)</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">Confidence Threshold</label>
                                        <div class="flex items-center gap-3">
                                            <input type="range" class="flex-1" name="confidence_threshold" 
                                                   min="0.5" max="1.0" step="0.05" value="0.85" 
                                                   oninput="updateThresholdDisplay(this.value)">
                                            <span class="text-sm font-medium w-12" id="thresholdDisplay">85%</span>
                                        </div>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">Max Results</label>
                                        <select class="form-select" name="max_results">
                                            <option value="5">5 matches</option>
                                            <option value="10" selected>10 matches</option>
                                            <option value="25">25 matches</option>
                                            <option value="50">50 matches</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Submit Button -->
                                <div class="pt-4">
                                    <button type="submit" class="btn btn-primary w-full">
                                        <i class="fas fa-search"></i>
                                        Find Matches
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Results Area -->
            <div class="xl:col-span-2">
                <div class="space-y-6">
                    <!-- Search Status -->
                    <div class="card" id="searchStatusCard" style="display: none;">
                        <div class="card-body">
                            <div class="flex items-center gap-3" id="searchStatus">
                                <!-- Status will be populated here -->
                            </div>
                        </div>
                    </div>

                    <!-- Match Results -->
                    <div class="card" id="resultsCard" style="display: none;">
                        <div class="card-header">
                            <h3 class="card-title">Match Results</h3>
                            <div class="flex items-center gap-2">
                                <span class="text-sm text-gray-600" id="resultsCount">0 matches found</span>
                                <button class="btn btn-sm btn-outline" onclick="exportResults()">
                                    <i class="fas fa-download"></i>
                                    Export
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div id="matchResults">
                                <!-- Results will be populated here -->
                            </div>
                        </div>
                    </div>

                    <!-- Algorithm Performance -->
                    <div class="card" id="performanceCard" style="display: none;">
                        <div class="card-header">
                            <h3 class="card-title">Algorithm Performance</h3>
                        </div>
                        <div class="card-body">
                            <div id="algorithmPerformance">
                                <!-- Performance metrics will be populated here -->
                            </div>
                        </div>
                    </div>

                    <!-- Sample Identities for Testing -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Sample Test Data</h3>
                            <span class="text-sm text-gray-600">Use these identities for testing</span>
                        </div>
                        <div class="card-body">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="sampleIdentities">
                                <!-- Sample identities will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Match Details Modal -->
        <div class="modal" id="matchDetailsModal" style="display: none;">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">Match Details</h4>
                        <button class="modal-close" onclick="closeMatchDetailsModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="matchDetailsContent">
                            <!-- Match details will be populated here -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeMatchDetailsModal()">Close</button>
                        <button type="button" class="btn btn-primary" onclick="acceptMatch()">Accept Match</button>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .form-section {
                padding: 1rem;
                border: 1px solid var(--border-color);
                border-radius: 0.5rem;
                background: #f8fafc;
            }

            .form-section-title {
                font-size: 0.875rem;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 1rem;
                text-transform: uppercase;
                letter-spacing: 0.025em;
            }

            .match-card {
                border: 1px solid var(--border-color);
                border-radius: 0.5rem;
                padding: 1rem;
                margin-bottom: 1rem;
                background: white;
                transition: all 0.2s;
                cursor: pointer;
            }

            .match-card:hover {
                border-color: var(--primary-color);
                box-shadow: var(--shadow);
            }

            .match-card.high-confidence {
                border-left: 4px solid var(--success-color);
            }

            .match-card.medium-confidence {
                border-left: 4px solid var(--warning-color);
            }

            .match-card.low-confidence {
                border-left: 4px solid var(--info-color);
            }

            .confidence-bar {
                width: 100%;
                height: 8px;
                background: #e5e7eb;
                border-radius: 4px;
                overflow: hidden;
            }

            .confidence-fill {
                height: 100%;
                background: linear-gradient(90deg, #ef4444, #f59e0b, #10b981);
                transition: width 0.3s ease;
            }

            .algorithm-badge {
                display: inline-block;
                padding: 0.125rem 0.5rem;
                font-size: 0.75rem;
                border-radius: 9999px;
                margin-right: 0.25rem;
                margin-bottom: 0.25rem;
            }

            .algorithm-badge.deterministic {
                background: rgba(34, 197, 94, 0.1);
                color: #16a34a;
            }

            .algorithm-badge.probabilistic {
                background: rgba(59, 130, 246, 0.1);
                color: #2563eb;
            }

            .algorithm-badge.fuzzy {
                background: rgba(168, 85, 247, 0.1);
                color: #7c3aed;
            }

            .algorithm-badge.ai_hybrid {
                background: rgba(236, 72, 153, 0.1);
                color: #db2777;
            }

            .sample-identity-card {
                border: 1px solid var(--border-color);
                border-radius: 0.5rem;
                padding: 1rem;
                background: white;
                cursor: pointer;
                transition: all 0.2s;
            }

            .sample-identity-card:hover {
                border-color: var(--primary-color);
                box-shadow: var(--shadow);
            }

            .field-comparison {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
                margin: 1rem 0;
            }

            .field-comparison .field {
                padding: 0.5rem;
                border-radius: 0.25rem;
                background: #f1f5f9;
            }

            .field-comparison .field.match {
                background: #dcfce7;
                border: 1px solid #bbf7d0;
            }

            .field-comparison .field.partial {
                background: #fef3c7;
                border: 1px solid #fde68a;
            }

            .field-comparison .field.no-match {
                background: #fee2e2;
                border: 1px solid #fecaca;
            }
        </style>
    `;

    // Load sample test data
    loadSampleIdentities();
    
    // Initialize form
    setupMatchingForm();
}

function setupMatchingForm() {
    // Auto-fill age when DOB is entered
    document.querySelector('input[name="dob"]').addEventListener('change', function() {
        const dob = new Date(this.value);
        const today = new Date();
        const age = Math.floor((today - dob) / (365.25 * 24 * 60 * 60 * 1000));
        if (age > 0 && age < 150) {
            document.querySelector('input[name="age"]').value = age;
        }
    });

    // Format phone number
    document.querySelector('input[name="phone"]').addEventListener('input', function() {
        let value = this.value.replace(/\D/g, '');
        if (value.length >= 6) {
            value = `(${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6,10)}`;
        } else if (value.length >= 3) {
            value = `(${value.slice(0,3)}) ${value.slice(3)}`;
        }
        this.value = value;
    });

    // Format SSN
    document.querySelector('input[name="ssn"]').addEventListener('input', function() {
        let value = this.value.replace(/\D/g, '');
        if (value.length >= 5) {
            value = `${value.slice(0,3)}-${value.slice(3,5)}-${value.slice(5,9)}`;
        } else if (value.length >= 3) {
            value = `${value.slice(0,3)}-${value.slice(3)}`;
        }
        this.value = value;
    });
}

function updateThresholdDisplay(value) {
    document.getElementById('thresholdDisplay').textContent = `${Math.round(value * 100)}%`;
}

function clearIdentityForm() {
    document.getElementById('identityForm').reset();
    document.getElementById('thresholdDisplay').textContent = '85%';
    hideResults();
}

function hideResults() {
    document.getElementById('searchStatusCard').style.display = 'none';
    document.getElementById('resultsCard').style.display = 'none';
    document.getElementById('performanceCard').style.display = 'none';
}

async function performIdentityMatch(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const algorithms = formData.getAll('algorithms');
    
    if (algorithms.length === 0) {
        showNotification('Please select at least one matching algorithm', 'warning');
        return;
    }

    // Prepare identity data
    const identityData = {
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        middle_name: formData.get('middle_name'),
        dob: formData.get('dob'),
        age: formData.get('age') ? parseInt(formData.get('age')) : undefined,
        gender: formData.get('gender'),
        ssn: formData.get('ssn'),
        driver_license: formData.get('driver_license'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        address: {
            street: formData.get('street'),
            city: formData.get('city'),
            state: formData.get('state'),
            zip: formData.get('zip'),
            county: formData.get('county')
        }
    };

    // Remove empty values
    Object.keys(identityData).forEach(key => {
        if (identityData[key] === '' || identityData[key] === null) {
            delete identityData[key];
        }
    });

    // Remove empty address fields
    Object.keys(identityData.address).forEach(key => {
        if (identityData.address[key] === '' || identityData.address[key] === null) {
            delete identityData.address[key];
        }
    });

    if (Object.keys(identityData.address).length === 0) {
        delete identityData.address;
    }

    const searchConfig = {
        algorithms: algorithms,
        confidence_threshold: parseFloat(formData.get('confidence_threshold')),
        max_results: parseInt(formData.get('max_results'))
    };

    try {
        // Show search status
        showSearchStatus('Initializing search...', 'loading');
        
        // Update submit button
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<div class="loading"></div> Searching...';
        submitBtn.disabled = true;

        // Perform the search
        showSearchStatus('Searching for matches...', 'loading');
        
        const startTime = Date.now();
        
        const result = await postData('/resolve', {
            identity: identityData,
            algorithms: searchConfig.algorithms,
            confidence_threshold: searchConfig.confidence_threshold,
            max_results: searchConfig.max_results
        });

        const endTime = Date.now();
        const searchTime = endTime - startTime;

        if (result) {
            showSearchStatus(`Search completed in ${searchTime}ms`, 'success');
            displayMatchResults(result, searchConfig, searchTime);
        } else {
            showSearchStatus('Search failed - please try again', 'error');
        }

        // Restore submit button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

    } catch (error) {
        console.error('Error performing identity match:', error);
        showSearchStatus('Search failed - please try again', 'error');
        showNotification('Error performing identity match. Please try again.', 'error');
        
        // Restore submit button
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-search"></i> Find Matches';
        submitBtn.disabled = false;
    }
}

function showSearchStatus(message, type) {
    const statusCard = document.getElementById('searchStatusCard');
    const statusContent = document.getElementById('searchStatus');
    
    const icons = {
        loading: '<div class="loading"></div>',
        success: '<i class="fas fa-check-circle text-green-500"></i>',
        error: '<i class="fas fa-exclamation-circle text-red-500"></i>',
        warning: '<i class="fas fa-exclamation-triangle text-yellow-500"></i>'
    };

    statusContent.innerHTML = `
        ${icons[type]}
        <span class="text-sm font-medium">${message}</span>
    `;

    statusCard.style.display = 'block';
}

function displayMatchResults(result, searchConfig, searchTime) {
    const resultsCard = document.getElementById('resultsCard');
    const resultsCount = document.getElementById('resultsCount');
    const matchResults = document.getElementById('matchResults');
    const performanceCard = document.getElementById('performanceCard');
    const algorithmPerformance = document.getElementById('algorithmPerformance');

    // Update results count
    resultsCount.textContent = `${result.matches.length} matches found`;

    // Display matches
    if (result.matches.length > 0) {
        matchResults.innerHTML = result.matches.map((match, index) => {
            const confidenceClass = match.confidence >= 0.9 ? 'high-confidence' : 
                                   match.confidence >= 0.7 ? 'medium-confidence' : 'low-confidence';
            
            return `
                <div class="match-card ${confidenceClass}" onclick="viewMatchDetails(${index})">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h4 class="font-semibold text-lg">
                                ${match.identity.first_name} ${match.identity.last_name}
                            </h4>
                            <p class="text-sm text-gray-600">
                                ${match.identity.dob ? `DOB: ${match.identity.dob}` : ''}
                                ${match.identity.dob && match.identity.phone ? ' • ' : ''}
                                ${match.identity.phone ? `Phone: ${match.identity.phone}` : ''}
                            </p>
                        </div>
                        <div class="text-right">
                            <div class="text-lg font-bold text-${confidenceClass.replace('-confidence', '')}-600">
                                ${(match.confidence * 100).toFixed(1)}%
                            </div>
                            <div class="text-xs text-gray-500">Confidence</div>
                        </div>
                    </div>
                    
                    <div class="confidence-bar mb-3">
                        <div class="confidence-fill" style="width: ${match.confidence * 100}%"></div>
                    </div>
                    
                    <div class="flex flex-wrap gap-1 mb-3">
                        ${match.algorithm_results.map(algo => `
                            <span class="algorithm-badge ${algo.algorithm}">
                                ${algo.algorithm} (${(algo.confidence * 100).toFixed(1)}%)
                            </span>
                        `).join('')}
                    </div>

                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-500">Address:</span>
                            <div class="font-medium">
                                ${match.identity.address ? 
                                    `${match.identity.address.street || ''}, ${match.identity.address.city || ''}, ${match.identity.address.state || ''}` :
                                    'Not provided'
                                }
                            </div>
                        </div>
                        <div>
                            <span class="text-gray-500">Source System:</span>
                            <div class="font-medium">${match.identity.source_system || 'Unknown'}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        matchResults.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-search text-gray-400 text-4xl mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
                <p class="text-gray-600">Try adjusting your search criteria or lowering the confidence threshold.</p>
            </div>
        `;
    }

    // Display algorithm performance
    algorithmPerformance.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-3">
                <h5 class="font-medium">Search Performance</h5>
                <div class="text-sm space-y-2">
                    <div class="flex justify-between">
                        <span>Total Search Time:</span>
                        <span class="font-medium">${searchTime}ms</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Algorithms Used:</span>
                        <span class="font-medium">${searchConfig.algorithms.length}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Confidence Threshold:</span>
                        <span class="font-medium">${(searchConfig.confidence_threshold * 100).toFixed(0)}%</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Highest Confidence:</span>
                        <span class="font-medium">
                            ${result.matches.length > 0 ? (result.highest_confidence * 100).toFixed(1) + '%' : 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
            <div class="space-y-3">
                <h5 class="font-medium">Algorithm Breakdown</h5>
                <div class="text-sm space-y-2">
                    ${searchConfig.algorithms.map(algo => {
                        const algoMatches = result.matches.filter(match => 
                            match.algorithm_results.some(ar => ar.algorithm === algo)
                        ).length;
                        return `
                            <div class="flex justify-between">
                                <span class="capitalize">${algo.replace('_', ' ')}:</span>
                                <span class="font-medium">${algoMatches} matches</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;

    resultsCard.style.display = 'block';
    performanceCard.style.display = 'block';

    // Store results for export
    window.currentSearchResults = {
        results: result,
        config: searchConfig,
        searchTime: searchTime
    };
}

function loadSampleIdentities() {
    const sampleContainer = document.getElementById('sampleIdentities');
    
    const sampleIdentities = [
        {
            name: "John Doe",
            data: {
                first_name: "John",
                last_name: "Doe",
                dob: "1985-03-15",
                phone: "(303) 555-0123",
                email: "john.doe@example.com",
                street: "123 Main St",
                city: "Denver",
                state: "CO",
                zip: "80202"
            },
            description: "Complete identity with all fields"
        },
        {
            name: "Jane Smith",
            data: {
                first_name: "Jane",
                last_name: "Smith",
                dob: "1990-07-22",
                ssn: "987-65-4321",
                phone: "(720) 555-0456",
                city: "Aurora",
                state: "CO"
            },
            description: "Partial identity with key identifiers"
        },
        {
            name: "Robert Johnson",
            data: {
                first_name: "Bob",
                last_name: "Johnson",
                age: "45",
                phone: "3035550789",
                street: "456 Oak Ave",
                city: "Colorado Springs",
                state: "CO"
            },
            description: "Name variation and unformatted phone"
        },
        {
            name: "Maria Garcia",
            data: {
                first_name: "Maria",
                last_name: "Garcia",
                dob: "1988-12-03",
                email: "m.garcia@email.com",
                street: "789 Pine St",
                city: "Fort Collins",
                state: "CO",
                zip: "80521"
            },
            description: "Hispanic name with address"
        }
    ];

    sampleContainer.innerHTML = sampleIdentities.map(sample => `
        <div class="sample-identity-card" onclick="loadSampleIdentity('${sample.name}')">
            <h4 class="font-medium mb-2">${sample.name}</h4>
            <p class="text-sm text-gray-600 mb-3">${sample.description}</p>
            <div class="text-xs text-gray-500">
                <div>DOB: ${sample.data.dob || sample.data.age ? `Age ${sample.data.age}` || 'Not provided'}</div>
                <div>Phone: ${sample.data.phone || 'Not provided'}</div>
                <div>Location: ${sample.data.city}, ${sample.data.state}</div>
            </div>
            <div class="mt-3">
                <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Click to load</span>
            </div>
        </div>
    `).join('');

    // Store sample data for loading
    window.sampleIdentitiesData = sampleIdentities;
}

function loadSampleIdentity(name) {
    const sample = window.sampleIdentitiesData.find(s => s.name === name);
    if (!sample) return;

    const form = document.getElementById('identityForm');
    
    // Clear form first
    form.reset();
    
    // Load sample data
    Object.keys(sample.data).forEach(key => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
            input.value = sample.data[key];
            
            // Trigger change event for auto-calculations
            if (key === 'dob') {
                input.dispatchEvent(new Event('change'));
            }
        }
    });

    // Update threshold display
    document.getElementById('thresholdDisplay').textContent = '85%';
    
    showNotification(`Loaded sample identity: ${name}`, 'success');
}

function viewMatchDetails(matchIndex) {
    if (!window.currentSearchResults) return;
    
    const match = window.currentSearchResults.results.matches[matchIndex];
    const modal = document.getElementById('matchDetailsModal');
    const content = document.getElementById('matchDetailsContent');
    
    content.innerHTML = `
        <div class="space-y-6">
            <!-- Match Summary -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <h5 class="font-medium mb-3">Match Summary</h5>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="text-gray-500">Overall Confidence:</span>
                        <span class="font-medium text-lg">${(match.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                        <span class="text-gray-500">Match ID:</span>
                        <span class="font-medium">${match.match_id || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <!-- Identity Comparison -->
            <div>
                <h5 class="font-medium mb-3">Identity Comparison</h5>
                <div class="field-comparison">
                    <div class="field">
                        <h6 class="font-medium text-sm text-gray-600 mb-2">Search Query</h6>
                        <div class="space-y-1 text-sm">
                            <div><strong>Name:</strong> ${window.searchQuery?.first_name || ''} ${window.searchQuery?.last_name || ''}</div>
                            <div><strong>DOB:</strong> ${window.searchQuery?.dob || 'Not provided'}</div>
                            <div><strong>Phone:</strong> ${window.searchQuery?.phone || 'Not provided'}</div>
                            <div><strong>Address:</strong> ${window.searchQuery?.address ? 
                                `${window.searchQuery.address.street || ''}, ${window.searchQuery.address.city || ''}, ${window.searchQuery.address.state || ''}` :
                                'Not provided'
                            }</div>
                        </div>
                    </div>
                    <div class="field">
                        <h6 class="font-medium text-sm text-gray-600 mb-2">Matched Identity</h6>
                        <div class="space-y-1 text-sm">
                            <div><strong>Name:</strong> ${match.identity.first_name} ${match.identity.last_name}</div>
                            <div><strong>DOB:</strong> ${match.identity.dob || 'Not provided'}</div>
                            <div><strong>Phone:</strong> ${match.identity.phone || 'Not provided'}</div>
                            <div><strong>Address:</strong> ${match.identity.address ? 
                                `${match.identity.address.street || ''}, ${match.identity.address.city || ''}, ${match.identity.address.state || ''}` :
                                'Not provided'
                            }</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Algorithm Results -->
            <div>
                <h5 class="font-medium mb-3">Algorithm Results</h5>
                <div class="space-y-3">
                    ${match.algorithm_results.map(result => `
                        <div class="border rounded-lg p-3">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-medium capitalize">${result.algorithm.replace('_', ' ')}</span>
                                <span class="text-lg font-bold">${(result.confidence * 100).toFixed(1)}%</span>
                            </div>
                            <div class="confidence-bar">
                                <div class="confidence-fill" style="width: ${result.confidence * 100}%"></div>
                            </div>
                            ${result.details ? `
                                <div class="mt-2 text-sm text-gray-600">
                                    <strong>Details:</strong> ${result.details}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Additional Information -->
            <div>
                <h5 class="font-medium mb-3">Additional Information</h5>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="text-gray-500">Source System:</span>
                        <span class="font-medium">${match.identity.source_system || 'Unknown'}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">Record Created:</span>
                        <span class="font-medium">${match.identity.created_date || 'Unknown'}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">Last Updated:</span>
                        <span class="font-medium">${match.identity.updated_date || 'Unknown'}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">Data Quality Score:</span>
                        <span class="font-medium">${match.data_quality_score ? (match.data_quality_score * 100).toFixed(1) + '%' : 'N/A'}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    // Store current match for actions
    window.currentMatch = match;
}

function closeMatchDetailsModal() {
    document.getElementById('matchDetailsModal').style.display = 'none';
    window.currentMatch = null;
}

function acceptMatch() {
    if (!window.currentMatch) return;
    
    // Here you would typically send the acceptance to the backend
    showNotification('Match accepted and recorded', 'success');
    closeMatchDetailsModal();
}

function exportResults() {
    if (!window.currentSearchResults) {
        showNotification('No results to export', 'warning');
        return;
    }

    const results = window.currentSearchResults;
    const exportData = {
        timestamp: new Date().toISOString(),
        search_config: results.config,
        search_time_ms: results.searchTime,
        total_matches: results.results.matches.length,
        highest_confidence: results.results.highest_confidence,
        matches: results.results.matches.map(match => ({
            identity: match.identity,
            confidence: match.confidence,
            algorithms_used: match.algorithm_results.map(ar => ar.algorithm),
            algorithm_confidences: match.algorithm_results.reduce((acc, ar) => {
                acc[ar.algorithm] = ar.confidence;
                return acc;
            }, {})
        }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `idxr_search_results_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Results exported successfully', 'success');
}