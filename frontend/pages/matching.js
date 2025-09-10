// Comprehensive Identity Matching Page
function loadMatchingPage() {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="space-y-6">
            <!-- Matching Statistics Overview -->
            <div class="stats-grid">
                <div class="stat-card success">
                    <div class="stat-header">
                        <span class="stat-title">Matches Today</span>
                        <div class="stat-icon success">
                            <i class="fas fa-link"></i>
                        </div>
                    </div>
                    <div class="stat-value">247</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>+15% from yesterday</span>
                    </div>
                </div>

                <div class="stat-card info">
                    <div class="stat-header">
                        <span class="stat-title">Average Confidence</span>
                        <div class="stat-icon info">
                            <i class="fas fa-percent"></i>
                        </div>
                    </div>
                    <div class="stat-value">92.4%</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-up"></i>
                        <span>+2.1% improvement</span>
                    </div>
                </div>

                <div class="stat-card primary">
                    <div class="stat-header">
                        <span class="stat-title">Processing Speed</span>
                        <div class="stat-icon primary">
                            <i class="fas fa-tachometer-alt"></i>
                        </div>
                    </div>
                    <div class="stat-value">45ms</div>
                    <div class="stat-change positive">
                        <i class="fas fa-arrow-down"></i>
                        <span>-8ms faster</span>
                    </div>
                </div>

                <div class="stat-card warning">
                    <div class="stat-header">
                        <span class="stat-title">Manual Reviews</span>
                        <div class="stat-icon warning">
                            <i class="fas fa-eye"></i>
                        </div>
                    </div>
                    <div class="stat-value">12</div>
                    <div class="stat-change negative">
                        <i class="fas fa-arrow-down"></i>
                        <span>-5 fewer today</span>
                    </div>
                </div>
            </div>

            <!-- Main Matching Interface -->
            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <!-- Identity Input Form -->
                <div class="xl:col-span-1">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Identity Search</h3>
                            <div class="flex gap-2">
                                <button class="btn btn-sm btn-outline" onclick="clearIdentityForm()" title="Clear Form">
                                    <i class="fas fa-refresh"></i>
                                </button>
                                <button class="btn btn-sm btn-outline" onclick="loadRandomSample()" title="Load Random Sample">
                                    <i class="fas fa-random"></i>
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <form id="identityForm" onsubmit="performIdentityMatch(event)">
                                <!-- Algorithm Selection -->
                                <div class="form-section mb-4">
                                    <h4 class="form-section-title">Matching Algorithm</h4>
                                    <div class="space-y-3">
                                        <div class="algorithm-selector">
                                            <label class="algorithm-option">
                                                <input type="radio" name="algorithm" value="auto" checked>
                                                <div class="algorithm-card">
                                                    <div class="algorithm-info">
                                                        <span class="algorithm-name">Auto (All Algorithms)</span>
                                                        <span class="algorithm-desc">Best overall accuracy</span>
                                                    </div>
                                                    <div class="algorithm-badge auto">AUTO</div>
                                                </div>
                                            </label>
                                            
                                            <label class="algorithm-option">
                                                <input type="radio" name="algorithm" value="deterministic">
                                                <div class="algorithm-card">
                                                    <div class="algorithm-info">
                                                        <span class="algorithm-name">Deterministic</span>
                                                        <span class="algorithm-desc">Exact field matching</span>
                                                    </div>
                                                    <div class="algorithm-badge deterministic">98.5%</div>
                                                </div>
                                            </label>
                                            
                                            <label class="algorithm-option">
                                                <input type="radio" name="algorithm" value="probabilistic">
                                                <div class="algorithm-card">
                                                    <div class="algorithm-info">
                                                        <span class="algorithm-name">Probabilistic</span>
                                                        <span class="algorithm-desc">Statistical analysis</span>
                                                    </div>
                                                    <div class="algorithm-badge probabilistic">94.2%</div>
                                                </div>
                                            </label>
                                            
                                            <label class="algorithm-option">
                                                <input type="radio" name="algorithm" value="ai_hybrid">
                                                <div class="algorithm-card">
                                                    <div class="algorithm-info">
                                                        <span class="algorithm-name">AI Hybrid</span>
                                                        <span class="algorithm-desc">Machine learning enhanced</span>
                                                    </div>
                                                    <div class="algorithm-badge ai_hybrid">96.8%</div>
                                                </div>
                                            </label>
                                            
                                            <label class="algorithm-option">
                                                <input type="radio" name="algorithm" value="fuzzy">
                                                <div class="algorithm-card">
                                                    <div class="algorithm-info">
                                                        <span class="algorithm-name">Fuzzy Matching</span>
                                                        <span class="algorithm-desc">Approximate matching</span>
                                                    </div>
                                                    <div class="algorithm-badge fuzzy">89.3%</div>
                                                </div>
                                            </label>
                                        </div>
                                        
                                        <!-- Confidence Threshold -->
                                        <div class="form-group">
                                            <label class="form-label">Confidence Threshold</label>
                                            <div class="slider-container">
                                                <input type="range" class="form-slider" name="confidence_threshold" 
                                                       min="0.5" max="1" step="0.05" value="0.85" 
                                                       oninput="updateThresholdDisplay(this.value)">
                                                <div class="slider-labels">
                                                    <span>50%</span>
                                                    <span id="thresholdValue">85%</span>
                                                    <span>100%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Personal Information -->
                                <div class="form-section mb-4">
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
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                            <option value="not_specified">Prefer not to specify</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Contact Information -->
                                <div class="form-section mb-4">
                                    <h4 class="form-section-title">Contact Information</h4>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Phone Number</label>
                                        <input type="tel" class="form-control" name="phone" placeholder="(303) 555-0123">
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">Email Address</label>
                                        <input type="email" class="form-control" name="email" placeholder="user@example.com">
                                    </div>
                                </div>

                                <!-- Address Information -->
                                <div class="form-section mb-4">
                                    <h4 class="form-section-title">Address Information</h4>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Street Address</label>
                                        <input type="text" class="form-control" name="street_address" placeholder="123 Main Street">
                                    </div>

                                    <div class="grid grid-cols-2 gap-3">
                                        <div class="form-group">
                                            <label class="form-label">City</label>
                                            <input type="text" class="form-control" name="city" placeholder="Denver">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">State</label>
                                            <select class="form-select" name="state">
                                                <option value="">Select State</option>
                                                <option value="CO">Colorado</option>
                                                <option value="CA">California</option>
                                                <option value="NY">New York</option>
                                                <option value="TX">Texas</option>
                                                <option value="FL">Florida</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">ZIP Code</label>
                                        <input type="text" class="form-control" name="zip" placeholder="80202">
                                    </div>
                                </div>

                                <!-- Additional Identifiers -->
                                <div class="form-section mb-4">
                                    <h4 class="form-section-title">Additional Identifiers</h4>
                                    
                                    <div class="form-group">
                                        <label class="form-label">SSN (Last 4 digits)</label>
                                        <input type="text" class="form-control" name="ssn_last4" maxlength="4" placeholder="1234">
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">Driver's License</label>
                                        <input type="text" class="form-control" name="drivers_license" placeholder="123456789">
                                    </div>
                                </div>

                                <!-- Search Options -->
                                <div class="form-section mb-4">
                                    <h4 class="form-section-title">Search Options</h4>
                                    
                                    <div class="space-y-2">
                                        <label class="checkbox-label">
                                            <input type="checkbox" name="include_fuzzy" checked>
                                            <span>Include fuzzy matching for names</span>
                                        </label>
                                        
                                        <label class="checkbox-label">
                                            <input type="checkbox" name="include_phonetic" checked>
                                            <span>Include phonetic matching</span>
                                        </label>
                                        
                                        <label class="checkbox-label">
                                            <input type="checkbox" name="include_household">
                                            <span>Include household members</span>
                                        </label>
                                        
                                        <label class="checkbox-label">
                                            <input type="checkbox" name="real_time_results" checked>
                                            <span>Show real-time results</span>
                                        </label>
                                    </div>
                                </div>

                                <!-- Submit Button -->
                                <button type="submit" class="btn btn-primary w-full" id="searchButton">
                                    <i class="fas fa-search"></i>
                                    Search for Matches
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Results Panel -->
                <div class="xl:col-span-2">
                    <!-- Real-time Search Results -->
                    <div class="card" id="resultsCard" style="display: none;">
                        <div class="card-header">
                            <h3 class="card-title">Match Results</h3>
                            <div class="flex items-center gap-3">
                                <div class="results-summary" id="resultsSummary">
                                    <span id="resultsCount">0 matches found</span>
                                    <div class="confidence-indicator" id="confidenceIndicator"></div>
                                </div>
                                <div class="flex gap-2">
                                    <button class="btn btn-sm btn-outline" onclick="refreshResults()" title="Refresh">
                                        <i class="fas fa-refresh"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline" onclick="exportResults()" title="Export">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div id="matchResults">
                                <!-- Results will be populated here -->
                            </div>
                        </div>
                    </div>

                    <!-- Algorithm Performance Breakdown -->
                    <div class="card" id="performanceCard" style="display: none;">
                        <div class="card-header">
                            <h3 class="card-title">Algorithm Performance Analysis</h3>
                            <button class="btn btn-sm btn-outline" onclick="togglePerformanceDetails()">
                                <i class="fas fa-chart-bar"></i>
                                Details
                            </button>
                        </div>
                        <div class="card-body">
                            <div id="algorithmPerformance">
                                <!-- Performance metrics will be populated here -->
                            </div>
                        </div>
                    </div>

                    <!-- Sample Test Data -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Sample Test Identities</h3>
                            <span class="text-sm text-gray-600">Use these pre-loaded identities for testing</span>
                        </div>
                        <div class="card-body">
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="sampleIdentities">
                                <!-- Sample identities will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Match Details Modal -->
        <div class="modal" id="matchDetailsModal" style="display: none;">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title">Detailed Match Analysis</h4>
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
                        <button type="button" class="btn btn-outline" onclick="flagForReview()" id="flagButton">
                            <i class="fas fa-flag"></i>
                            Flag for Review
                        </button>
                        <button type="button" class="btn btn-success" onclick="acceptMatch()" id="acceptButton">
                            <i class="fas fa-check"></i>
                            Accept Match
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <style>
            /* Enhanced Matching Interface Styles */
            .form-section {
                padding: 1.25rem;
                border: 1px solid var(--border-light);
                border-radius: var(--border-radius-lg);
                background: linear-gradient(135deg, #f8fafc, #ffffff);
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            }

            .form-section-title {
                font-size: 0.875rem;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 1rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .form-section-title::before {
                content: '';
                width: 3px;
                height: 1rem;
                background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
                border-radius: 2px;
            }

            /* Algorithm Selector Styles */
            .algorithm-selector {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }

            .algorithm-option {
                cursor: pointer;
                display: block;
            }

            .algorithm-option input[type="radio"] {
                display: none;
            }

            .algorithm-card {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem 1rem;
                border: 2px solid var(--border-light);
                border-radius: var(--border-radius-lg);
                background: white;
                transition: all 0.2s ease-in-out;
            }

            .algorithm-option:hover .algorithm-card {
                border-color: var(--primary-light);
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
            }

            .algorithm-option input:checked + .algorithm-card {
                border-color: var(--primary-color);
                background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02));
                box-shadow: 0 2px 12px rgba(59, 130, 246, 0.2);
            }

            .algorithm-info {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }

            .algorithm-name {
                font-weight: 600;
                color: var(--text-primary);
                font-size: 0.875rem;
            }

            .algorithm-desc {
                color: var(--text-secondary);
                font-size: 0.75rem;
            }

            .algorithm-badge {
                padding: 0.25rem 0.5rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
                text-align: center;
                min-width: 3rem;
            }

            .algorithm-badge.auto {
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                color: white;
            }

            .algorithm-badge.deterministic {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
            }

            .algorithm-badge.probabilistic {
                background: linear-gradient(135deg, #3b82f6, #2563eb);
                color: white;
            }

            .algorithm-badge.ai_hybrid {
                background: linear-gradient(135deg, #ec4899, #db2777);
                color: white;
            }

            .algorithm-badge.fuzzy {
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: white;
            }

            /* Slider Styles */
            .slider-container {
                position: relative;
                margin: 0.5rem 0;
            }

            .form-slider {
                width: 100%;
                height: 6px;
                border-radius: 3px;
                background: var(--gray-200);
                outline: none;
                -webkit-appearance: none;
            }

            .form-slider::-webkit-slider-thumb {
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: var(--primary-color);
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
            }

            .slider-labels {
                display: flex;
                justify-content: space-between;
                margin-top: 0.5rem;
                font-size: 0.75rem;
                color: var(--text-secondary);
            }

            #thresholdValue {
                color: var(--primary-color);
                font-weight: 600;
            }

            /* Checkbox Styles */
            .checkbox-label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                cursor: pointer;
                font-size: 0.875rem;
                padding: 0.25rem 0;
            }

            .checkbox-label input[type="checkbox"] {
                width: 1rem;
                height: 1rem;
                accent-color: var(--primary-color);
            }

            /* Results Styles */
            .results-summary {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .confidence-indicator {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                padding: 0.25rem 0.5rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
            }

            .confidence-indicator.high {
                background: rgba(16, 185, 129, 0.1);
                color: #059669;
                border: 1px solid rgba(16, 185, 129, 0.2);
            }

            .confidence-indicator.medium {
                background: rgba(245, 158, 11, 0.1);
                color: #d97706;
                border: 1px solid rgba(245, 158, 11, 0.2);
            }

            .confidence-indicator.low {
                background: rgba(239, 68, 68, 0.1);
                color: #dc2626;
                border: 1px solid rgba(239, 68, 68, 0.2);
            }

            /* Match Card Styles */
            .match-card {
                border: 1px solid var(--border-light);
                border-radius: var(--border-radius-lg);
                padding: 1.25rem;
                margin-bottom: 1rem;
                background: white;
                transition: all 0.2s ease-in-out;
                cursor: pointer;
                position: relative;
                overflow: hidden;
            }

            .match-card::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 4px;
                background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
                opacity: 0;
                transition: opacity 0.2s;
            }

            .match-card:hover {
                border-color: var(--primary-light);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            }

            .match-card:hover::before {
                opacity: 1;
            }

            .match-card.high-confidence::before {
                background: linear-gradient(135deg, #10b981, #059669);
                opacity: 1;
            }

            .match-card.medium-confidence::before {
                background: linear-gradient(135deg, #f59e0b, #d97706);
                opacity: 1;
            }

            .match-card.low-confidence::before {
                background: linear-gradient(135deg, #ef4444, #dc2626);
                opacity: 1;
            }

            /* Sample Identity Cards */
            .sample-identity-card {
                padding: 1rem;
                border: 1px solid var(--border-light);
                border-radius: var(--border-radius-lg);
                background: linear-gradient(135deg, #f8fafc, #ffffff);
                cursor: pointer;
                transition: all 0.2s ease-in-out;
            }

            .sample-identity-card:hover {
                border-color: var(--primary-light);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
            }

            /* Performance Metrics */
            .performance-metric {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem;
                border: 1px solid var(--border-light);
                border-radius: var(--border-radius);
                background: #f8fafc;
                margin-bottom: 0.5rem;
            }

            .performance-metric-name {
                font-weight: 600;
                color: var(--text-primary);
            }

            .performance-metric-value {
                font-weight: 600;
            }

            .performance-metric-value.excellent {
                color: #059669;
            }

            .performance-metric-value.good {
                color: #0284c7;
            }

            .performance-metric-value.fair {
                color: #d97706;
            }

            .performance-metric-value.poor {
                color: #dc2626;
            }

            /* Modal Enhancements */
            .modal-xl .modal-dialog {
                max-width: 1200px;
                width: 95%;
            }

            /* Loading States */
            .loading-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10;
            }

            /* Real-time Search Indicator */
            .real-time-indicator {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--primary-color);
                font-size: 0.75rem;
                font-weight: 600;
            }

            .real-time-indicator::before {
                content: '';
                width: 8px;
                height: 8px;
                background: var(--primary-color);
                border-radius: 50%;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(1.1); }
            }
        </style>
    `;

    initializeMatching();
}

// Initialize matching functionality
function initializeMatching() {
    loadSampleIdentities();
    setupRealTimeSearch();
    
    // Initialize form validation
    document.getElementById('identityForm').addEventListener('input', handleFormInput);
}

// Load sample test identities
function loadSampleIdentities() {
    const container = document.getElementById('sampleIdentities');
    
    const samples = [
        {
            name: "John Smith (Complete Profile)",
            description: "Full identity with all fields populated",
            data: {
                first_name: "John",
                last_name: "Smith",
                middle_name: "Michael",
                dob: "1985-03-15",
                age: 39,
                gender: "male",
                phone: "(303) 555-0123",
                email: "john.smith@email.com",
                street_address: "123 Main Street",
                city: "Denver",
                state: "CO",
                zip: "80202",
                ssn_last4: "1234",
                drivers_license: "CO123456789"
            },
            expected_matches: 3,
            confidence: "95.2%"
        },
        {
            name: "Sarah Johnson (Partial Data)",
            description: "Limited information for fuzzy matching test",
            data: {
                first_name: "Sarah",
                last_name: "Johnson",
                city: "Aurora",
                state: "CO",
                age: 32,
                phone: "(303) 555-0456"
            },
            expected_matches: 2,
            confidence: "78.6%"
        },
        {
            name: "Maria Garcia (Hispanic Name)",
            description: "Tests cultural name pattern recognition",
            data: {
                first_name: "Maria",
                last_name: "Garcia",
                middle_name: "Elena",
                dob: "1990-07-22",
                gender: "female",
                street_address: "456 Colfax Avenue",
                city: "Denver",
                state: "CO",
                zip: "80204",
                phone: "(720) 555-0789"
            },
            expected_matches: 1,
            confidence: "92.1%"
        },
        {
            name: "Robert Johnson III",
            description: "Tests suffix and generation handling",
            data: {
                first_name: "Robert",
                last_name: "Johnson",
                middle_name: "William",
                dob: "1975-12-03",
                gender: "male",
                street_address: "789 Oak Street",
                city: "Colorado Springs",
                state: "CO",
                zip: "80903",
                ssn_last4: "5678"
            },
            expected_matches: 2,
            confidence: "89.4%"
        },
        {
            name: "Jennifer Wong (Common Name)",
            description: "Tests disambiguation for common names",
            data: {
                first_name: "Jennifer",
                last_name: "Wong",
                age: 28,
                city: "Boulder",
                state: "CO",
                email: "j.wong@example.com"
            },
            expected_matches: 5,
            confidence: "67.8%"
        },
        {
            name: "David Miller (Homeless)",
            description: "Tests matching for individuals without fixed address",
            data: {
                first_name: "David",
                last_name: "Miller",
                dob: "1982-09-14",
                gender: "male",
                city: "Denver",
                state: "CO",
                phone: "(303) 555-0321",
                street_address: "Temporary Shelter"
            },
            expected_matches: 1,
            confidence: "84.3%"
        }
    ];

    container.innerHTML = samples.map((sample, index) => `
        <div class="sample-identity-card" onclick="loadSampleIdentity(${index})" data-index="${index}">
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-medium text-sm">${sample.name}</h4>
                <div class="flex items-center gap-1 text-xs">
                    <span class="text-gray-500">Expected:</span>
                    <span class="font-medium text-blue-600">${sample.expected_matches}</span>
                    <span class="text-gray-500">matches</span>
                </div>
            </div>
            <p class="text-xs text-gray-600 mb-3">${sample.description}</p>
            <div class="text-xs text-gray-500 space-y-1">
                <div class="flex justify-between">
                    <span>Name:</span>
                    <span class="font-medium">${sample.data.first_name} ${sample.data.last_name}</span>
                </div>
                ${sample.data.dob ? `<div class="flex justify-between">
                    <span>DOB:</span>
                    <span class="font-medium">${sample.data.dob}</span>
                </div>` : sample.data.age ? `<div class="flex justify-between">
                    <span>Age:</span>
                    <span class="font-medium">${sample.data.age}</span>
                </div>` : ''}
                ${sample.data.city ? `<div class="flex justify-between">
                    <span>Location:</span>
                    <span class="font-medium">${sample.data.city}, ${sample.data.state}</span>
                </div>` : ''}
            </div>
            <div class="mt-3 flex justify-between items-center">
                <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Click to load</span>
                <span class="text-xs font-medium text-green-600">${sample.confidence}</span>
            </div>
        </div>
    `).join('');
}

// Handle form input changes for real-time search
function handleFormInput(event) {
    const realTimeCheckbox = document.querySelector('input[name="real_time_results"]');
    if (realTimeCheckbox && realTimeCheckbox.checked) {
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => {
            performRealTimeSearch();
        }, 500);
    }
}

// Set up real-time search functionality
function setupRealTimeSearch() {
    const form = document.getElementById('identityForm');
    const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], select');
    
    inputs.forEach(input => {
        input.addEventListener('input', handleFormInput);
    });
}

// Load sample identity data into form
function loadSampleIdentity(index) {
    const samples = [
        {
            name: "John Smith (Complete Profile)",
            description: "Full identity with all fields populated",
            data: {
                first_name: "John",
                last_name: "Smith",
                middle_name: "Michael",
                dob: "1985-03-15",
                age: 39,
                gender: "male",
                phone: "(303) 555-0123",
                email: "john.smith@email.com",
                street_address: "123 Main Street",
                city: "Denver",
                state: "CO",
                zip: "80202",
                ssn_last4: "1234",
                drivers_license: "CO123456789"
            },
            expected_matches: 3,
            confidence: "95.2%"
        },
        {
            name: "Sarah Johnson (Partial Data)",
            description: "Limited information for fuzzy matching test",
            data: {
                first_name: "Sarah",
                last_name: "Johnson",
                city: "Aurora",
                state: "CO",
                age: 32,
                phone: "(303) 555-0456"
            },
            expected_matches: 2,
            confidence: "78.6%"
        },
        {
            name: "Maria Garcia (Hispanic Name)",
            description: "Tests cultural name pattern recognition",
            data: {
                first_name: "Maria",
                last_name: "Garcia",
                middle_name: "Elena",
                dob: "1990-07-22",
                gender: "female",
                street_address: "456 Colfax Avenue",
                city: "Denver",
                state: "CO",
                zip: "80204",
                phone: "(720) 555-0789"
            },
            expected_matches: 1,
            confidence: "92.1%"
        },
        {
            name: "Robert Johnson III",
            description: "Tests suffix and generation handling",
            data: {
                first_name: "Robert",
                last_name: "Johnson",
                middle_name: "William",
                dob: "1975-12-03",
                gender: "male",
                street_address: "789 Oak Street",
                city: "Colorado Springs",
                state: "CO",
                zip: "80903",
                ssn_last4: "5678"
            },
            expected_matches: 2,
            confidence: "89.4%"
        },
        {
            name: "Jennifer Wong (Common Name)",
            description: "Tests disambiguation for common names",
            data: {
                first_name: "Jennifer",
                last_name: "Wong",
                age: 28,
                city: "Boulder",
                state: "CO",
                email: "j.wong@example.com"
            },
            expected_matches: 5,
            confidence: "67.8%"
        },
        {
            name: "David Miller (Homeless)",
            description: "Tests matching for individuals without fixed address",
            data: {
                first_name: "David",
                last_name: "Miller",
                dob: "1982-09-14",
                gender: "male",
                city: "Denver",
                state: "CO",
                phone: "(303) 555-0321",
                street_address: "Temporary Shelter"
            },
            expected_matches: 1,
            confidence: "84.3%"
        }
    ];
    
    if (index >= 0 && index < samples.length) {
        const sample = samples[index];
        const form = document.getElementById('identityForm');
        
        // Clear form first
        clearIdentityForm();
        
        // Populate form fields
        Object.keys(sample.data).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = sample.data[key];
            }
        });
        
        showNotification(`Loaded sample: ${sample.name}`, 'success');
        
        // Auto-search if real-time is enabled
        handleFormInput();
    }
}

// Load random sample identity
function loadRandomSample() {
    const randomIndex = Math.floor(Math.random() * 6);
    loadSampleIdentity(randomIndex);
}

// Update threshold display
function updateThresholdDisplay(value) {
    document.getElementById('thresholdValue').textContent = Math.round(value * 100) + '%';
}

// Clear identity form
function clearIdentityForm() {
    const form = document.getElementById('identityForm');
    form.reset();
    
    // Reset algorithm to auto
    form.querySelector('input[name="algorithm"][value="auto"]').checked = true;
    
    // Reset threshold
    form.querySelector('input[name="confidence_threshold"]').value = 0.85;
    updateThresholdDisplay(0.85);
    
    // Hide results
    document.getElementById('resultsCard').style.display = 'none';
    document.getElementById('performanceCard').style.display = 'none';
    
    showNotification('Form cleared', 'info');
}

// Perform identity match
async function performIdentityMatch(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const searchButton = document.getElementById('searchButton');
    const originalText = searchButton.innerHTML;
    
    // Show loading state
    searchButton.innerHTML = '<div class="loading"></div> Searching...';
    searchButton.disabled = true;
    
    try {
        // Collect form data
        const identityData = {};
        for (let [key, value] of formData.entries()) {
            if (value.trim() !== '') {
                identityData[key] = value.trim();
            }
        }
        
        // Get selected algorithm
        const algorithm = form.querySelector('input[name="algorithm"]:checked').value;
        const confidenceThreshold = parseFloat(form.querySelector('input[name="confidence_threshold"]').value);
        
        showNotification('Searching for identity matches...', 'info');
        
        // Simulate API call with realistic delay
        await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800));
        
        // Generate mock results based on form data
        const results = generateMockResults(identityData, algorithm, confidenceThreshold);
        
        displayMatchResults(results, algorithm);
        showAlgorithmPerformance(results, algorithm);
        
        showNotification(`Found ${results.matches.length} potential matches`, 'success');
        
    } catch (error) {
        console.error('Error performing identity match:', error);
        showNotification('Error performing search. Please try again.', 'error');
    } finally {
        // Restore button
        searchButton.innerHTML = originalText;
        searchButton.disabled = false;
    }
}

// Perform real-time search (debounced)
async function performRealTimeSearch() {
    const form = document.getElementById('identityForm');
    const formData = new FormData(form);
    
    // Check if we have minimum required data
    const firstName = formData.get('first_name');
    const lastName = formData.get('last_name');
    
    if (!firstName || !lastName) {
        document.getElementById('resultsCard').style.display = 'none';
        return;
    }
    
    // Show real-time search indicator
    const resultsCard = document.getElementById('resultsCard');
    resultsCard.style.display = 'block';
    
    const matchResults = document.getElementById('matchResults');
    matchResults.innerHTML = `
        <div class="text-center py-8">
            <div class="real-time-indicator mb-2">
                Real-time search active
            </div>
            <div class="loading mb-2"></div>
            <p class="text-gray-600">Searching as you type...</p>
        </div>
    `;
    
    try {
        // Simulate real-time search delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Collect form data
        const identityData = {};
        for (let [key, value] of formData.entries()) {
            if (value.trim() !== '') {
                identityData[key] = value.trim();
            }
        }
        
        const algorithm = form.querySelector('input[name="algorithm"]:checked').value;
        const confidenceThreshold = parseFloat(form.querySelector('input[name="confidence_threshold"]').value);
        
        // Generate results
        const results = generateMockResults(identityData, algorithm, confidenceThreshold);
        displayMatchResults(results, algorithm, true);
        
    } catch (error) {
        console.error('Real-time search error:', error);
    }
}

// Generate mock results based on input data
function generateMockResults(identityData, algorithm, threshold) {
    const mockMatches = [
        {
            identity_id: "IDXR_001234",
            confidence_score: 0.952,
            match_type: algorithm === 'auto' ? 'AI_HYBRID' : algorithm.toUpperCase(),
            matched_systems: ["DMV_CO", "VOTER_REG", "HEALTH_DEPT"],
            personal_data: {
                first_name: identityData.first_name || "John",
                last_name: identityData.last_name || "Smith",
                middle_name: identityData.middle_name || "Michael",
                dob: identityData.dob || "1985-03-15",
                gender: identityData.gender || "male",
                age: identityData.age || 39
            },
            contact_data: {
                phone: identityData.phone || "(303) 555-0123",
                email: identityData.email || "john.smith@email.com",
                address: {
                    street: identityData.street_address || "123 Main Street",
                    city: identityData.city || "Denver",
                    state: identityData.state || "CO",
                    zip: identityData.zip || "80202"
                }
            },
            match_details: {
                algorithm_scores: {
                    deterministic: 0.98,
                    probabilistic: 0.89,
                    ml_enhanced: 0.96,
                    fuzzy: 0.84
                },
                matched_fields: ["first_name", "last_name", "dob", "phone", "address"],
                data_quality_score: 0.94,
                edge_cases: ["none"],
                last_updated: "2025-01-15T10:30:45.123Z"
            }
        },
        {
            identity_id: "IDXR_005678",
            confidence_score: 0.847,
            match_type: algorithm === 'auto' ? 'PROBABILISTIC' : algorithm.toUpperCase(),
            matched_systems: ["VOTER_REG", "PROPERTY_RECORDS"],
            personal_data: {
                first_name: identityData.first_name || "John",
                last_name: identityData.last_name || "Smith",
                middle_name: "M",
                dob: identityData.dob || "1985-03-14",
                gender: identityData.gender || "male",
                age: identityData.age || 39
            },
            contact_data: {
                phone: "(303) 555-0124",
                email: "j.smith@example.org",
                address: {
                    street: "124 Main Street",
                    city: identityData.city || "Denver",
                    state: identityData.state || "CO",
                    zip: identityData.zip || "80202"
                }
            },
            match_details: {
                algorithm_scores: {
                    deterministic: 0.45,
                    probabilistic: 0.89,
                    ml_enhanced: 0.78,
                    fuzzy: 0.92
                },
                matched_fields: ["first_name", "last_name", "city", "state"],
                data_quality_score: 0.87,
                edge_cases: ["similar_address"],
                last_updated: "2025-01-14T15:22:18.456Z"
            }
        },
        {
            identity_id: "IDXR_009876",
            confidence_score: 0.723,
            match_type: algorithm === 'auto' ? 'FUZZY' : algorithm.toUpperCase(),
            matched_systems: ["DMV_CO"],
            personal_data: {
                first_name: identityData.first_name || "Jon",
                last_name: identityData.last_name || "Smyth",
                middle_name: identityData.middle_name || "Michael",
                dob: identityData.dob || "1985-03-15",
                gender: identityData.gender || "male",
                age: identityData.age || 39
            },
            contact_data: {
                phone: "(720) 555-0123",
                email: "jonsmyth@email.com",
                address: {
                    street: "123 Main St",
                    city: identityData.city || "Denver",
                    state: identityData.state || "CO",
                    zip: identityData.zip || "80203"
                }
            },
            match_details: {
                algorithm_scores: {
                    deterministic: 0.12,
                    probabilistic: 0.67,
                    ml_enhanced: 0.71,
                    fuzzy: 0.89
                },
                matched_fields: ["dob", "gender", "city", "state"],
                data_quality_score: 0.76,
                edge_cases: ["name_variation", "address_variation"],
                last_updated: "2025-01-13T09:15:32.789Z"
            }
        }
    ];

    // Filter by confidence threshold
    const filteredMatches = mockMatches.filter(match => match.confidence_score >= threshold);

    return {
        status: "success",
        transaction_id: `TXN_${new Date().getTime()}`,
        matches: filteredMatches,
        total_searched: 15847,
        processing_time_ms: Math.floor(Math.random() * 200) + 45,
        algorithm_used: algorithm,
        confidence_threshold: threshold,
        search_criteria: identityData,
        timestamp: new Date().toISOString()
    };
}

// Display match results
function displayMatchResults(results, algorithm, isRealTime = false) {
    const resultsCard = document.getElementById('resultsCard');
    const resultsCount = document.getElementById('resultsCount');
    const confidenceIndicator = document.getElementById('confidenceIndicator');
    const matchResults = document.getElementById('matchResults');
    
    resultsCard.style.display = 'block';
    
    // Update results summary
    const matchCount = results.matches.length;
    resultsCount.textContent = `${matchCount} match${matchCount !== 1 ? 'es' : ''} found`;
    
    // Update confidence indicator
    if (matchCount > 0) {
        const avgConfidence = results.matches.reduce((sum, match) => sum + match.confidence_score, 0) / matchCount;
        const confidencePercent = Math.round(avgConfidence * 100);
        
        let confidenceClass = 'low';
        if (avgConfidence >= 0.9) confidenceClass = 'high';
        else if (avgConfidence >= 0.7) confidenceClass = 'medium';
        
        confidenceIndicator.className = `confidence-indicator ${confidenceClass}`;
        confidenceIndicator.innerHTML = `
            <i class="fas fa-bullseye"></i>
            <span>Avg: ${confidencePercent}%</span>
        `;
    } else {
        confidenceIndicator.className = 'confidence-indicator';
        confidenceIndicator.innerHTML = '<span>No matches</span>';
    }
    
    // Display matches
    if (matchCount === 0) {
        matchResults.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-search text-gray-400 text-4xl mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
                <p class="text-gray-600 mb-4">Try adjusting your search criteria or lowering the confidence threshold.</p>
                <div class="flex gap-2 justify-center">
                    <button class="btn btn-outline btn-sm" onclick="document.querySelector('input[name=confidence_threshold]').value = '0.5'; updateThresholdDisplay(0.5)">
                        <i class="fas fa-sliders-h"></i>
                        Lower threshold
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="clearIdentityForm()">
                        <i class="fas fa-refresh"></i>
                        Clear and retry
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    matchResults.innerHTML = results.matches.map((match, index) => {
        const confidencePercent = Math.round(match.confidence_score * 100);
        let confidenceClass = 'low-confidence';
        if (match.confidence_score >= 0.9) confidenceClass = 'high-confidence';
        else if (match.confidence_score >= 0.7) confidenceClass = 'medium-confidence';
        
        return `
            <div class="match-card ${confidenceClass}" onclick="showMatchDetails('${match.identity_id}', ${index})">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h4 class="font-semibold text-lg text-gray-900">
                            ${match.personal_data.first_name} ${match.personal_data.middle_name ? match.personal_data.middle_name + ' ' : ''}${match.personal_data.last_name}
                        </h4>
                        <p class="text-sm text-gray-600">ID: ${match.identity_id}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold ${confidenceClass === 'high-confidence' ? 'text-green-600' : confidenceClass === 'medium-confidence' ? 'text-yellow-600' : 'text-red-600'}">
                            ${confidencePercent}%
                        </div>
                        <div class="text-xs text-gray-500 mt-1">${match.match_type}</div>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div class="space-y-2">
                        <div class="text-sm">
                            <span class="text-gray-600">DOB:</span>
                            <span class="font-medium ml-1">${match.personal_data.dob} (Age ${match.personal_data.age})</span>
                        </div>
                        <div class="text-sm">
                            <span class="text-gray-600">Phone:</span>
                            <span class="font-medium ml-1">${match.contact_data.phone}</span>
                        </div>
                        <div class="text-sm">
                            <span class="text-gray-600">Email:</span>
                            <span class="font-medium ml-1">${match.contact_data.email}</span>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="text-sm">
                            <span class="text-gray-600">Address:</span>
                            <span class="font-medium ml-1">${match.contact_data.address.street}</span>
                        </div>
                        <div class="text-sm">
                            <span class="text-gray-600">Location:</span>
                            <span class="font-medium ml-1">${match.contact_data.address.city}, ${match.contact_data.address.state} ${match.contact_data.address.zip}</span>
                        </div>
                        <div class="text-sm">
                            <span class="text-gray-600">Systems:</span>
                            <span class="font-medium ml-1">${match.matched_systems.join(', ')}</span>
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-between items-center pt-3 border-t border-gray-100">
                    <div class="flex items-center gap-4 text-xs text-gray-500">
                        <div class="flex items-center gap-1">
                            <i class="fas fa-check-circle text-green-500"></i>
                            <span>${match.match_details.matched_fields.length} fields matched</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <i class="fas fa-chart-bar text-blue-500"></i>
                            <span>Quality: ${Math.round(match.match_details.data_quality_score * 100)}%</span>
                        </div>
                    </div>
                    <div class="text-xs text-gray-500">
                        Updated: ${new Date(match.match_details.last_updated).toLocaleDateString()}
                    </div>
                </div>
                
                ${match.match_details.edge_cases && match.match_details.edge_cases.length > 0 && match.match_details.edge_cases[0] !== 'none' ? `
                <div class="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-exclamation-triangle text-yellow-600"></i>
                        <span class="text-xs font-medium text-yellow-800">Edge Cases:</span>
                        <span class="text-xs text-yellow-700">${match.match_details.edge_cases.join(', ').replace(/_/g, ' ')}</span>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    if (isRealTime) {
        // Add real-time indicator
        const indicator = document.createElement('div');
        indicator.className = 'real-time-indicator mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-center';
        indicator.innerHTML = '<i class="fas fa-bolt text-blue-600"></i> Real-time results - results update as you type';
        matchResults.insertBefore(indicator, matchResults.firstChild);
    }
}

// Show algorithm performance analysis
function showAlgorithmPerformance(results, selectedAlgorithm) {
    const performanceCard = document.getElementById('performanceCard');
    const algorithmPerformance = document.getElementById('algorithmPerformance');
    
    performanceCard.style.display = 'block';
    
    const processingTime = results.processing_time_ms;
    const matchCount = results.matches.length;
    const totalSearched = results.total_searched;
    const avgConfidence = matchCount > 0 ? results.matches.reduce((sum, match) => sum + match.confidence_score, 0) / matchCount : 0;
    
    // Calculate algorithm-specific metrics
    const algorithmMetrics = {
        deterministic: {
            accuracy: 98.5,
            speed: 2.3,
            coverage: matchCount > 0 ? Math.round((results.matches.filter(m => m.match_details.algorithm_scores.deterministic > 0.8).length / matchCount) * 100) : 0,
            efficiency: Math.max(0, 100 - processingTime / 10)
        },
        probabilistic: {
            accuracy: 94.2,
            speed: 15.7,
            coverage: matchCount > 0 ? Math.round((results.matches.filter(m => m.match_details.algorithm_scores.probabilistic > 0.8).length / matchCount) * 100) : 0,
            efficiency: Math.max(0, 100 - processingTime / 5)
        },
        ai_hybrid: {
            accuracy: 96.8,
            speed: 45.2,
            coverage: matchCount > 0 ? Math.round((results.matches.filter(m => m.match_details.algorithm_scores.ml_enhanced > 0.8).length / matchCount) * 100) : 0,
            efficiency: Math.max(0, 100 - processingTime / 3)
        },
        fuzzy: {
            accuracy: 89.3,
            speed: 8.9,
            coverage: matchCount > 0 ? Math.round((results.matches.filter(m => m.match_details.algorithm_scores.fuzzy > 0.8).length / matchCount) * 100) : 0,
            efficiency: Math.max(0, 100 - processingTime / 7)
        }
    };
    
    algorithmPerformance.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="performance-metric">
                <span class="performance-metric-name">Processing Time</span>
                <span class="performance-metric-value ${processingTime < 50 ? 'excellent' : processingTime < 100 ? 'good' : processingTime < 200 ? 'fair' : 'poor'}">
                    ${processingTime}ms
                </span>
            </div>
            <div class="performance-metric">
                <span class="performance-metric-name">Records Searched</span>
                <span class="performance-metric-value excellent">${formatNumber(totalSearched)}</span>
            </div>
            <div class="performance-metric">
                <span class="performance-metric-name">Average Confidence</span>
                <span class="performance-metric-value ${avgConfidence > 0.9 ? 'excellent' : avgConfidence > 0.7 ? 'good' : avgConfidence > 0.5 ? 'fair' : 'poor'}">
                    ${Math.round(avgConfidence * 100)}%
                </span>
            </div>
            <div class="performance-metric">
                <span class="performance-metric-name">Match Rate</span>
                <span class="performance-metric-value ${matchCount > 5 ? 'excellent' : matchCount > 2 ? 'good' : matchCount > 0 ? 'fair' : 'poor'}">
                    ${matchCount} / ${totalSearched}
                </span>
            </div>
        </div>
        
        <div class="mb-4">
            <h5 class="font-medium mb-3">Algorithm Performance Breakdown</h5>
            <div class="space-y-3">
                ${Object.entries(algorithmMetrics).map(([algorithm, metrics]) => `
                    <div class="algorithm-performance ${selectedAlgorithm === algorithm || selectedAlgorithm === 'auto' ? 'border-primary' : ''}">
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-medium capitalize">${algorithm.replace('_', ' ')}</span>
                            <span class="text-sm text-gray-600">${metrics.coverage}% coverage</span>
                        </div>
                        <div class="grid grid-cols-3 gap-2 text-sm">
                            <div>
                                <span class="text-gray-500">Accuracy:</span>
                                <span class="font-medium text-green-600">${metrics.accuracy}%</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Speed:</span>
                                <span class="font-medium">${metrics.speed}ms avg</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Efficiency:</span>
                                <span class="font-medium text-blue-600">${Math.round(metrics.efficiency)}%</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded">
            <strong>Search Summary:</strong> Processed ${formatNumber(totalSearched)} records in ${processingTime}ms using ${selectedAlgorithm === 'auto' ? 'all algorithms' : selectedAlgorithm + ' algorithm'}. 
            Found ${matchCount} potential matches with confidence scores ranging from ${matchCount > 0 ? Math.round(Math.min(...results.matches.map(m => m.confidence_score)) * 100) + '%' : 'N/A'} to ${matchCount > 0 ? Math.round(Math.max(...results.matches.map(m => m.confidence_score)) * 100) + '%' : 'N/A'}.
        </div>
    `;
}

// Show detailed match information
function showMatchDetails(identityId, matchIndex) {
    // This would typically fetch detailed match information
    // For now, we'll show a comprehensive analysis modal
    
    const modal = document.getElementById('matchDetailsModal');
    const content = document.getElementById('matchDetailsContent');
    
    // Get match data (simplified for demo)
    const mockDetailedMatch = {
        identity_id: identityId,
        confidence_score: 0.952,
        field_analysis: {
            first_name: { input: "John", found: "John", score: 1.0, algorithm: "exact" },
            last_name: { input: "Smith", found: "Smith", score: 1.0, algorithm: "exact" },
            dob: { input: "1985-03-15", found: "1985-03-15", score: 1.0, algorithm: "exact" },
            phone: { input: "(303) 555-0123", found: "(303) 555-0123", score: 1.0, algorithm: "exact" },
            address: { input: "123 Main Street", found: "123 Main St", score: 0.95, algorithm: "fuzzy" },
            email: { input: "john.smith@email.com", found: "john.smith@email.com", score: 1.0, algorithm: "exact" }
        },
        risk_analysis: {
            fraud_indicators: [],
            data_quality: 0.94,
            completeness: 0.87,
            consistency: 0.96
        },
        system_matches: [
            { system: "DMV_CO", record_id: "DMV123456", last_updated: "2025-01-10", confidence: 0.98 },
            { system: "VOTER_REG", record_id: "VR789012", last_updated: "2024-12-15", confidence: 0.91 },
            { system: "HEALTH_DEPT", record_id: "HD345678", last_updated: "2024-11-22", confidence: 0.89 }
        ]
    };
    
    content.innerHTML = `
        <div class="space-y-6">
            <!-- Match Overview -->
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-lg font-semibold text-blue-900">Identity Match Analysis</h3>
                        <p class="text-blue-700 text-sm">ID: ${mockDetailedMatch.identity_id}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-3xl font-bold text-green-600">
                            ${Math.round(mockDetailedMatch.confidence_score * 100)}%
                        </div>
                        <div class="text-sm text-blue-600">Overall Confidence</div>
                    </div>
                </div>
            </div>
            
            <!-- Field-by-Field Analysis -->
            <div>
                <h4 class="text-lg font-semibold mb-4">Field Analysis</h4>
                <div class="space-y-3">
                    ${Object.entries(mockDetailedMatch.field_analysis).map(([field, analysis]) => `
                        <div class="border rounded-lg p-3">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-medium capitalize">${field.replace('_', ' ')}</span>
                                <div class="flex items-center gap-2">
                                    <span class="text-sm px-2 py-1 rounded ${analysis.algorithm === 'exact' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
                                        ${analysis.algorithm}
                                    </span>
                                    <span class="font-bold ${analysis.score >= 0.95 ? 'text-green-600' : analysis.score >= 0.8 ? 'text-yellow-600' : 'text-red-600'}">
                                        ${Math.round(analysis.score * 100)}%
                                    </span>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span class="text-gray-600">Input:</span>
                                    <span class="font-mono ml-2">${analysis.input}</span>
                                </div>
                                <div>
                                    <span class="text-gray-600">Found:</span>
                                    <span class="font-mono ml-2">${analysis.found}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- System Matches -->
            <div>
                <h4 class="text-lg font-semibold mb-4">System Records</h4>
                <div class="space-y-2">
                    ${mockDetailedMatch.system_matches.map(system => `
                        <div class="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                            <div>
                                <span class="font-medium">${system.system.replace('_', ' ')}</span>
                                <span class="text-sm text-gray-600 ml-2">ID: ${system.record_id}</span>
                            </div>
                            <div class="text-right">
                                <div class="font-semibold ${system.confidence >= 0.95 ? 'text-green-600' : system.confidence >= 0.8 ? 'text-yellow-600' : 'text-red-600'}">
                                    ${Math.round(system.confidence * 100)}%
                                </div>
                                <div class="text-xs text-gray-500">Updated: ${system.last_updated}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Risk Analysis -->
            <div>
                <h4 class="text-lg font-semibold mb-4">Risk & Quality Analysis</h4>
                <div class="grid grid-cols-3 gap-4">
                    <div class="text-center p-4 border rounded-lg">
                        <div class="text-2xl font-bold text-green-600">${Math.round(mockDetailedMatch.risk_analysis.data_quality * 100)}%</div>
                        <div class="text-sm text-gray-600">Data Quality</div>
                    </div>
                    <div class="text-center p-4 border rounded-lg">
                        <div class="text-2xl font-bold text-blue-600">${Math.round(mockDetailedMatch.risk_analysis.completeness * 100)}%</div>
                        <div class="text-sm text-gray-600">Completeness</div>
                    </div>
                    <div class="text-center p-4 border rounded-lg">
                        <div class="text-2xl font-bold text-green-600">${Math.round(mockDetailedMatch.risk_analysis.consistency * 100)}%</div>
                        <div class="text-sm text-gray-600">Consistency</div>
                    </div>
                </div>
                
                ${mockDetailedMatch.risk_analysis.fraud_indicators.length > 0 ? `
                <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h5 class="font-semibold text-red-800 mb-2">Fraud Indicators Detected</h5>
                    <ul class="list-disc list-inside text-sm text-red-700">
                        ${mockDetailedMatch.risk_analysis.fraud_indicators.map(indicator => `<li>${indicator}</li>`).join('')}
                    </ul>
                </div>
                ` : `
                <div class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-shield-alt text-green-600"></i>
                        <span class="font-semibold text-green-800">No Fraud Indicators Detected</span>
                    </div>
                </div>
                `}
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Close match details modal
function closeMatchDetailsModal() {
    document.getElementById('matchDetailsModal').style.display = 'none';
}

// Accept match
function acceptMatch() {
    showNotification('Match accepted and recorded', 'success');
    closeMatchDetailsModal();
}

// Flag match for review
function flagForReview() {
    showNotification('Match flagged for manual review', 'warning');
    closeMatchDetailsModal();
}

// Export results
function exportResults() {
    showNotification('Exporting match results...', 'info');
    
    // Generate CSV export
    const csvContent = `Identity ID,Confidence Score,Match Type,Name,DOB,Phone,Email,Address,Systems
IDXR_001234,95.2%,AI_HYBRID,John Michael Smith,1985-03-15,(303) 555-0123,john.smith@email.com,"123 Main Street, Denver, CO 80202","DMV_CO, VOTER_REG, HEALTH_DEPT"
IDXR_005678,84.7%,PROBABILISTIC,John M Smith,1985-03-14,(303) 555-0124,j.smith@example.org,"124 Main Street, Denver, CO 80202","VOTER_REG, PROPERTY_RECORDS"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `identity_matches_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Match results exported successfully', 'success');
}

// Refresh results
function refreshResults() {
    const form = document.getElementById('identityForm');
    if (form.checkValidity()) {
        performIdentityMatch({ preventDefault: () => {}, target: form });
    } else {
        showNotification('Please fill in required fields first', 'warning');
    }
}

// Toggle performance details
function togglePerformanceDetails() {
    const performanceCard = document.getElementById('performanceCard');
    const isExpanded = performanceCard.classList.contains('expanded');
    
    if (isExpanded) {
        performanceCard.classList.remove('expanded');
    } else {
        performanceCard.classList.add('expanded');
        // Could load additional performance metrics here
    }
}