/**
 * Main Application Controller
 * Orchestrates all modules and handles application lifecycle
 */

class ALZAssessmentApp {
    constructor() {
        this.dataLoader = null;
        this.assessmentManager = null;
        this.dashboardManager = null;
        this.exportManager = null;
        
        this.currentView = 'welcome';
        this.isLoading = false;
        
        this.initialize();
    }

    /**
     * Initialize the application
     */
    initialize() {
        console.log('Initializing Azure Landing Zone Assessment Tool...');
        
        // Initialize data loader
        this.dataLoader = new DataLoader();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Show welcome screen
        this.showWelcomeScreen();
        
        console.log('Application initialized successfully');
    }

    /**
     * Setup main application event listeners
     */
    setupEventListeners() {
        // Load checklist button
        const loadButton = document.getElementById('loadChecklist');
        if (loadButton) {
            loadButton.addEventListener('click', () => this.loadChecklist());
        }

        // Upload assessment button and file input
        const uploadButton = document.getElementById('uploadAssessmentBtn');
        const uploadInput = document.getElementById('uploadAssessment');
        if (uploadButton && uploadInput) {
            uploadButton.addEventListener('click', () => uploadInput.click());
            uploadInput.addEventListener('change', (event) => this.handleFileUpload(event));
        }

        // Navigation tabs
        const assessmentTab = document.getElementById('assessmentTab');
        const dashboardTab = document.getElementById('dashboardTab');
        const exportTab = document.getElementById('exportTab');

        if (assessmentTab) {
            assessmentTab.addEventListener('click', () => this.showView('assessment'));
        }

        if (dashboardTab) {
            dashboardTab.addEventListener('click', () => this.showView('dashboard'));
        }

        if (exportTab) {
            exportTab.addEventListener('click', () => this.showView('export'));
        }

        // Reset assessment button
        const resetButton = document.getElementById('resetAssessment');
        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetAssessment());
        }

        // Handle browser navigation
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.view) {
                this.showView(event.state.view, false);
            }
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.dashboardManager) {
                // Refresh dashboard when page becomes visible
                this.dashboardManager.updateCharts();
            }
        });

        // Auto-save progress periodically
        setInterval(() => {
            this.autoSaveProgress();
        }, 300000); // Every 5 minutes

        // Save progress before page unload
        window.addEventListener('beforeunload', () => {
            this.autoSaveProgress();
        });
    }

    /**
     * Load checklist based on selected type
     */
    async loadChecklist() {
        const checklistType = document.getElementById('checklistSelector')?.value;

        if (!checklistType) {
            this.showNotification('Please select an assessment type', 'warning');
            return;
        }

        // Check if we should prompt to save current assessment
        const shouldProceed = await this.promptSaveBeforeSwitch();
        if (!shouldProceed) {
            // User cancelled, reset selector to previous value if possible
            return;
        }

        try {
            this.setLoadingState(true);
            
            console.log(`Loading checklist: ${checklistType}`);
            
            // Load the checklist data
            await this.dataLoader.loadChecklist(checklistType);
            
            // Initialize all managers
            this.initializeManagers();
            
            // Show assessment content
            this.showAssessmentContent();
            
            // Try to restore previous progress
            this.tryRestoreProgress();
            
            this.showNotification('Assessment loaded successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to load checklist:', error);
            this.showNotification(`Failed to load assessment: ${error.message}`, 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Reload current checklist
     */
    async reloadCurrentChecklist() {
        const checklistType = document.getElementById('checklistSelector')?.value;
        if (checklistType) {
            await this.loadChecklist();
        }
    }

    /**
     * Reset assessment by clearing localStorage and reloading
     */
    resetAssessment() {
        if (confirm('Are you sure you want to reset the assessment? This will clear all your progress and cannot be undone.')) {
            // Clear the auto-save data from localStorage
            localStorage.removeItem('alz-assessment-autosave');
            
            // Show success message
            this.showNotification('Assessment has been reset successfully!', 'success');
            
            // Reload the current checklist to show fresh data
            const checklistType = document.getElementById('checklistSelector')?.value;
            if (checklistType) {
                this.loadChecklist();
            }
        }
    }

    /**
     * Initialize all application managers
     */
    initializeManagers() {
        // Initialize assessment manager
        this.assessmentManager = new AssessmentManager(this.dataLoader);
        this.assessmentManager.initializeAssessment();
        this.assessmentManager.setupEventDelegation();
        
        // Initialize dashboard manager
        this.dashboardManager = new DashboardManager(this.dataLoader);
        this.dashboardManager.initializeDashboard();
        
        // Initialize export manager
        this.exportManager = new ExportManager(this.dataLoader, this.dashboardManager);
        
        // Make managers globally available for cross-module communication
        window.assessmentManager = this.assessmentManager;
        window.dashboardManager = this.dashboardManager;
        window.exportManager = this.exportManager;
        
        console.log('All managers initialized successfully');
    }

    /**
     * Show welcome screen
     */
    showWelcomeScreen() {
        this.hideAllScreens();
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (welcomeScreen) {
            welcomeScreen.style.display = 'block';
        }
        this.currentView = 'welcome';
    }

    /**
     * Show assessment content area
     */
    showAssessmentContent() {
        this.hideAllScreens();
        const assessmentContent = document.getElementById('assessmentContent');
        if (assessmentContent) {
            assessmentContent.style.display = 'block';
        }
        this.showView('assessment');
    }

    /**
     * Hide all main content screens
     */
    hideAllScreens() {
        const screens = ['welcomeScreen', 'assessmentContent', 'loadingState'];
        screens.forEach(screenId => {
            const screen = document.getElementById(screenId);
            if (screen) {
                screen.style.display = 'none';
            }
        });
    }

    /**
     * Show specific view within assessment content
     */
    showView(viewName, pushState = true) {
        if (!document.getElementById('assessmentContent') || 
            document.getElementById('assessmentContent').style.display === 'none') {
            return;
        }

        // Hide all panels
        const panels = document.querySelectorAll('.panel');
        panels.forEach(panel => panel.classList.remove('active'));

        // Remove active class from all tabs
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(tab => tab.classList.remove('active'));

        // Show selected panel and activate tab
        const targetPanel = document.getElementById(`${viewName}Panel`);
        const targetTab = document.getElementById(`${viewName}Tab`);

        if (targetPanel) {
            targetPanel.classList.add('active');
        }

        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Update browser history
        if (pushState) {
            history.pushState({ view: viewName }, '', `#${viewName}`);
        }

        this.currentView = viewName;

        // Trigger view-specific updates
        this.handleViewChange(viewName);
    }

    /**
     * Handle view-specific logic
     */
    handleViewChange(viewName) {
        switch (viewName) {
            case 'dashboard':
                if (this.dashboardManager) {
                    // Small delay to ensure DOM is ready
                    setTimeout(() => {
                        this.dashboardManager.updateCharts();
                    }, 100);
                }
                break;
            case 'assessment':
                if (this.assessmentManager) {
                    this.assessmentManager.updateProgress();
                }
                break;
            case 'export':
                // Could update export statistics here
                break;
        }
    }

    /**
     * Set loading state
     */
    setLoadingState(isLoading) {
        this.isLoading = isLoading;
        
        const loadingState = document.getElementById('loadingState');
        const loadButton = document.getElementById('loadChecklist');
        
        if (isLoading) {
            this.hideAllScreens();
            if (loadingState) {
                loadingState.style.display = 'flex';
            }
            if (loadButton) {
                loadButton.disabled = true;
                loadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            }
        } else {
            if (loadingState) {
                loadingState.style.display = 'none';
            }
            if (loadButton) {
                loadButton.disabled = false;
                loadButton.innerHTML = '<i class="fas fa-download"></i> Load Assessment';
            }
        }
    }

    /**
     * Auto-save progress to localStorage
     */
    autoSaveProgress() {
        if (!this.dataLoader?.getCurrentChecklist()) {
            return;
        }

        try {
            const progressData = {
                timestamp: new Date().toISOString(),
                checklistType: document.getElementById('checklistSelector')?.value,
                data: this.dataLoader.exportData({ includeComments: true })
            };

            localStorage.setItem('alz-assessment-autosave', JSON.stringify(progressData));
            console.log('Progress auto-saved');
        } catch (error) {
            console.warn('Failed to auto-save progress:', error);
        }
    }

    /**
     * Try to restore previous progress
     */
    tryRestoreProgress() {
        try {
            const savedProgress = localStorage.getItem('alz-assessment-autosave');
            if (!savedProgress) {
                return;
            }

            const progressData = JSON.parse(savedProgress);
            const currentChecklistType = document.getElementById('checklistSelector')?.value;

            // Only restore if it matches current selection
            if (progressData.checklistType === currentChecklistType) {
                
                const success = this.dataLoader.importProgress(progressData.data);
                if (success) {
                    // Refresh UI
                    if (this.assessmentManager) {
                        this.assessmentManager.renderAssessmentItems();
                    }
                    if (this.dashboardManager) {
                        this.dashboardManager.updateCharts();
                    }
                    
                    this.showNotification('Previous progress restored', 'info');
                    console.log('Progress restored from auto-save');
                }
            }
        } catch (error) {
            console.warn('Failed to restore progress:', error);
            // Clear corrupted data
            localStorage.removeItem('alz-assessment-autosave');
        }
    }

    /**
     * Clear all saved progress
     */
    clearSavedProgress() {
        localStorage.removeItem('alz-assessment-autosave');
        this.showNotification('Saved progress cleared', 'info');
    }

    /**
     * Check if current assessment has unsaved changes
     */
    hasUnsavedChanges() {
        if (!this.dataLoader?.getCurrentChecklist()) {
            return false;
        }

        // Check if there are any items with status other than 'Not verified'
        const items = this.dataLoader.filterItems();
        return items.some(item => item.status && item.status !== 'Not verified');
    }

    /**
     * Prompt user to save current assessment before switching
     */
    async promptSaveBeforeSwitch() {
        if (!this.hasUnsavedChanges()) {
            return true; // No changes to save, proceed
        }

        return new Promise((resolve) => {
            const modal = this.createSavePromptModal(resolve);
            document.body.appendChild(modal);
        });
    }

    /**
     * Create modal dialog for save prompt
     */
    createSavePromptModal(callback) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> Unsaved Changes</h3>
                </div>
                <div class="modal-body">
                    <p>You have unsaved changes in your current assessment. Would you like to save your progress before switching?</p>
                    <div class="save-options">
                        <div class="save-option">
                            <input type="radio" id="saveAsJson" name="saveFormat" value="json" checked>
                            <label for="saveAsJson">Save as JSON file</label>
                        </div>
                        <div class="save-option">
                            <input type="radio" id="saveAsExcel" name="saveFormat" value="excel">
                            <label for="saveAsExcel">Save as Excel file</label>
                        </div>
                        <div class="save-option">
                            <input type="radio" id="saveAsCsv" name="saveFormat" value="csv">
                            <label for="saveAsCsv">Save as CSV file</label>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button id="saveAndSwitch" class="btn btn-primary">
                        <i class="fas fa-save"></i> Save & Switch
                    </button>
                    <button id="switchWithoutSaving" class="btn btn-warning">
                        <i class="fas fa-times"></i> Switch Without Saving
                    </button>
                    <button id="cancelSwitch" class="btn btn-secondary">
                        <i class="fas fa-ban"></i> Cancel
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        const saveAndSwitchBtn = modal.querySelector('#saveAndSwitch');
        const switchWithoutSavingBtn = modal.querySelector('#switchWithoutSaving');
        const cancelSwitchBtn = modal.querySelector('#cancelSwitch');

        saveAndSwitchBtn.addEventListener('click', () => {
            const selectedFormat = modal.querySelector('input[name="saveFormat"]:checked').value;
            this.saveCurrentAssessment(selectedFormat);
            document.body.removeChild(modal);
            callback(true);
        });

        switchWithoutSavingBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
            callback(true);
        });

        cancelSwitchBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
            callback(false);
        });

        return modal;
    }

    /**
     * Save current assessment in specified format
     */
    saveCurrentAssessment(format = 'json') {
        if (!this.exportManager) {
            this.showNotification('Export functionality not available', 'error');
            return;
        }

        try {
            const currentDate = new Date().toISOString().split('T')[0];
            const checklistType = document.getElementById('checklistSelector')?.value || 'assessment';
            const filename = `${checklistType}_assessment_${currentDate}`;

            switch (format) {
                case 'json':
                    this.exportManager.exportToJSON(filename);
                    break;
                case 'excel':
                    this.exportManager.exportToExcel(filename);
                    break;
                case 'csv':
                    this.exportManager.exportToCSV(filename);
                    break;
                default:
                    this.exportManager.exportToJSON(filename);
            }

            this.showNotification(`Assessment saved as ${format.toUpperCase()} file`, 'success');
        } catch (error) {
            console.error('Failed to save assessment:', error);
            this.showNotification(`Failed to save assessment: ${error.message}`, 'error');
        }
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        // Use export manager's notification system if available
        if (this.exportManager) {
            this.exportManager.showNotification(message, type);
        } else {
            // Fallback notification
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    /**
     * Get application status
     */
    getStatus() {
        return {
            isLoading: this.isLoading,
            currentView: this.currentView,
            hasData: !!this.dataLoader?.getCurrentChecklist(),
            managersInitialized: !!(this.assessmentManager && this.dashboardManager && this.exportManager)
        };
    }

    /**
     * Handle errors gracefully
     */
    handleError(error, context = 'Application') {
        console.error(`${context} Error:`, error);
        this.showNotification(`An error occurred: ${error.message}`, 'error');
        
        // Reset loading state if needed
        if (this.isLoading) {
            this.setLoadingState(false);
        }
    }

    /**
     * Cleanup resources (if needed)
     */
    cleanup() {
        // Auto-save before cleanup
        this.autoSaveProgress();
        
        // Destroy charts
        if (this.dashboardManager) {
            this.dashboardManager.destroyCharts();
        }
        
        console.log('Application cleanup completed');
    }

    /**
     * Handle file upload for assessment data
     */
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Show loader immediately
        this.showUploadLoader(true);

        try {
            // Check if we should prompt to save current assessment
            const shouldProceed = await this.promptSaveBeforeSwitch();
            if (!shouldProceed) {
                // User cancelled, reset file input
                event.target.value = '';
                this.showUploadLoader(false);
                return;
            }

            // Process file asynchronously to prevent UI freezing
            await this.processFileAsync(file, event);
            
        } catch (error) {
            console.error('Failed to upload assessment:', error);
            this.showNotification(`Failed to upload assessment: ${error.message}`, 'error');
            event.target.value = '';
        } finally {
            // Always hide loader
            this.showUploadLoader(false);
        }
    }

    /**
     * Process file asynchronously to prevent UI blocking
     */
    async processFileAsync(file, event) {
        return new Promise(async (resolve, reject) => {
            try {
                // Use setTimeout to allow UI to update
                setTimeout(async () => {
                    try {
                        let data;
                        const fileName = file.name.toLowerCase();

                        if (fileName.endsWith('.json')) {
                            // Handle JSON file
                            const text = await file.text();
                            data = JSON.parse(text);
                        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                            // Handle Excel file
                            data = await this.parseExcelFile(file);
                        } else if (fileName.endsWith('.csv')) {
                            // Handle CSV file
                            data = await this.parseCSVFile(file);
                        } else {
                            this.showNotification('Unsupported file format. Please upload a JSON, Excel (.xlsx), or CSV file.', 'error');
                            event.target.value = '';
                            reject(new Error('Unsupported file format'));
                            return;
                        }

                        // Validate the uploaded data structure
                        if (!this.validateUploadedData(data)) {
                            this.showNotification('Invalid assessment file format', 'error');
                            event.target.value = '';
                            reject(new Error('Invalid file format'));
                            return;
                        }

                        // Load the assessment data
                        await this.loadUploadedAssessment(data);
                        
                        // Auto-refresh the UI
                        await this.refreshUIAfterUpload();
                        
                        this.showNotification('Assessment uploaded and loaded successfully!', 'success');
                        event.target.value = ''; // Reset file input
                        
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                }, 100); // Small delay to allow loader to show
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Show or hide upload loader
     */
    showUploadLoader(show) {
        const loader = document.getElementById('uploadLoader');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
            
            // Disable/enable upload button to prevent multiple uploads
            const uploadBtn = document.getElementById('uploadAssessmentBtn');
            if (uploadBtn) {
                uploadBtn.disabled = show;
                if (show) {
                    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                } else {
                    uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Assessment';
                }
            }
        }
    }

    /**
     * Refresh UI components after successful upload
     */
    async refreshUIAfterUpload() {
        try {
            // Refresh dashboard if visible
            if (this.dashboardManager && document.getElementById('dashboardPanel').style.display !== 'none') {
                await this.dashboardManager.renderDashboard();
            }
            
            // Refresh assessment view if visible
            if (this.assessmentManager && document.getElementById('assessmentPanel').style.display !== 'none') {
                await this.assessmentManager.renderAssessmentItems();
            }
            
            // Update navigation to show current assessment
            this.updateNavigationState();
            
            // Update header with current checklist name
            this.updateHeaderTitle();
            
        } catch (error) {
            console.error('Error refreshing UI after upload:', error);
            // Don't throw error as upload was successful
        }
    }

    /**
     * Update header title with current checklist name
     */
    updateHeaderTitle() {
        const checklist = this.dataLoader.getCurrentChecklist();
        if (checklist && checklist.metadata) {
            const titleElement = document.querySelector('.app-title');
            if (titleElement) {
                titleElement.textContent = `Azure Landing Zone Assessment - ${checklist.metadata.name || 'Custom Assessment'}`;
            }
        }
    }

    /**
     * Update navigation state after loading new assessment
     */
    updateNavigationState() {
        const checklist = this.dataLoader.getCurrentChecklist();
        const hasData = checklist && checklist.items && checklist.items.length > 0;
        
        // Enable/disable navigation buttons based on data availability
        const dashboardBtn = document.querySelector('[data-panel="dashboardPanel"]');
        const assessmentBtn = document.querySelector('[data-panel="assessmentPanel"]');
        const exportBtn = document.querySelector('[data-panel="exportPanel"]');
        
        if (dashboardBtn) dashboardBtn.disabled = !hasData;
        if (assessmentBtn) assessmentBtn.disabled = !hasData;
        if (exportBtn) exportBtn.disabled = !hasData;
        
        // If we have data and currently showing welcome screen, switch to dashboard
        if (hasData && document.getElementById('welcomeScreen').style.display !== 'none') {
            this.showPanel('dashboardPanel');
        }
    }

    /**
     * Parse Excel file and convert to assessment data
     */
    async parseExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Get the first worksheet
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Convert to JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    // Parse the Excel data to match our assessment format
                    const assessmentData = await this.convertExcelToAssessment(jsonData);
                    resolve(assessmentData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read Excel file'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Parse CSV file and convert to assessment data
     */
    async parseCSVFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const text = e.target.result;
                    const lines = text.split('\n');
                    const csvData = lines.map(line => {
                        // Simple CSV parsing (handles quoted fields)
                        const result = [];
                        let current = '';
                        let inQuotes = false;
                        
                        for (let i = 0; i < line.length; i++) {
                            const char = line[i];
                            if (char === '"') {
                                inQuotes = !inQuotes;
                            } else if (char === ',' && !inQuotes) {
                                result.push(current.trim());
                                current = '';
                            } else {
                                current += char;
                            }
                        }
                        result.push(current.trim());
                        return result;
                    });
                    
                    // Convert CSV data to assessment format
                    const assessmentData = await this.convertExcelToAssessment(csvData);
                    resolve(assessmentData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read CSV file'));
            reader.readAsText(file);
        });
    }

    /**
     * Convert Excel/CSV data to assessment format
     */
    async convertExcelToAssessment(data) {
        // Find the header row (look for common column names)
        let headerRowIndex = -1;
        let headers = [];
        
        for (let i = 0; i < Math.min(5, data.length); i++) {
            const row = data[i];
            if (row && Array.isArray(row)) {
                const rowStr = row.join('').toLowerCase();
                if (rowStr.includes('id') || rowStr.includes('guid') || rowStr.includes('recommendation') || rowStr.includes('status')) {
                    headerRowIndex = i;
                    headers = row.map(header => header ? header.toString().toLowerCase().trim() : '');
                    break;
                }
            }
        }
        
        if (headerRowIndex === -1) {
            throw new Error('Could not find header row in Excel/CSV file. Please ensure the file has columns like ID, Recommendation, Status, etc.');
        }
        
        // Map column names to expected fields
        const columnMap = this.createColumnMap(headers);
        
        // Process data rows in batches to avoid UI blocking
        const items = [];
        const batchSize = 100; // Process 100 rows at a time
        const totalRows = data.length - headerRowIndex - 1;
        
        for (let batchStart = headerRowIndex + 1; batchStart < data.length; batchStart += batchSize) {
            const batchEnd = Math.min(batchStart + batchSize, data.length);
            
            // Process batch
            for (let i = batchStart; i < batchEnd; i++) {
                const row = data[i];
                if (!row || !Array.isArray(row) || row.length === 0) continue;
                
                const item = this.processExcelRow(row, columnMap, headers, i);
                if (item && (item.id || item.recommendation)) {
                    items.push(item);
                }
            }
            
            // Allow UI to update between batches
            if (batchEnd < data.length) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        
        if (items.length === 0) {
            throw new Error('No valid assessment items found in the file. Please check the file format.');
        }

        // For items without IDs, try to match them using text similarity
        const itemsWithoutIds = items.filter(item => !item.id && item.recommendation);
        if (itemsWithoutIds.length > 0) {
            try {
                const matchedItems = await this.matchItemsToChecklist(itemsWithoutIds, assessmentType);
                
                // Replace items without IDs with matched ones
                const itemsWithIds = items.filter(item => item.id);
                items.length = 0; // Clear array
                items.push(...itemsWithIds, ...matchedItems);
            } catch (error) {
                console.warn('Could not match items to checklist:', error);
                // Continue without matching - items without IDs will be filtered out later
            }
        }

        // Try to determine assessment type from the data
        const assessmentType = this.detectAssessmentType(items);
        
        return {
            assessmentType: assessmentType,
            items: items,
            uploadedAt: new Date().toISOString()
        };
    }

    /**
     * Create column mapping from headers
     */
    createColumnMap(headers) {
        const map = {};
        
        headers.forEach((header, index) => {
            const h = header.toLowerCase();
            
            // ID mapping
            if (h.includes('id') || h.includes('guid') || h.includes('reference')) {
                map.id = index;
            }
            // Status mapping
            else if (h.includes('status') || h.includes('compliance') || h.includes('result')) {
                map.status = index;
            }
            // Comments mapping
            else if (h.includes('comment') || h.includes('note') || h.includes('remark') || h.includes('description')) {
                map.comments = index;
            }
            // Category mapping
            else if (h.includes('category') || h.includes('domain') || h.includes('area')) {
                map.category = index;
            }
            // Recommendation mapping
            else if (h.includes('recommendation') || h.includes('title') || h.includes('check') || h.includes('text')) {
                map.recommendation = index;
            }
        });
        
        return map;
    }

    /**
     * Process a single Excel row into an assessment item
     */
    processExcelRow(row, columnMap, headers, rowIndex) {
        const item = {};
        
        // Extract ID
        if (columnMap.id !== undefined && row[columnMap.id]) {
            item.id = row[columnMap.id].toString().trim();
        } else {
            // If no ID column, try to extract from first few columns
            for (let i = 0; i < Math.min(3, row.length); i++) {
                if (row[i] && row[i].toString().match(/^[A-Z]\d+\.\d+/)) {
                    item.id = row[i].toString().trim();
                    break;
                }
            }
            
            // If still no ID found, we'll try to match by recommendation text later
            if (!item.id) {
                item.rowIndex = rowIndex; // Store row index for matching later
            }
        }
        
        // Extract status
        if (columnMap.status !== undefined && row[columnMap.status]) {
            const statusValue = row[columnMap.status].toString().toLowerCase().trim();
            item.status = this.normalizeStatus(statusValue);
        }
        
        // Extract comments
        if (columnMap.comments !== undefined && row[columnMap.comments]) {
            item.comments = row[columnMap.comments].toString().trim();
        }
        
        // Extract other fields if available
        if (columnMap.category !== undefined && row[columnMap.category]) {
            item.category = row[columnMap.category].toString().trim();
        }
        
        if (columnMap.recommendation !== undefined && row[columnMap.recommendation]) {
            item.recommendation = row[columnMap.recommendation].toString().trim();
        }
        
        // If no recommendation column found, try to find it in the row
        if (!item.recommendation) {
            // Look for the longest text field that might be the recommendation
            let longestText = '';
            for (let i = 0; i < row.length; i++) {
                if (row[i] && typeof row[i] === 'string' && row[i].length > longestText.length) {
                    // Skip if it looks like a status or short identifier
                    const text = row[i].toLowerCase();
                    if (!text.match(/^(fulfilled|open|not required|not verified|yes|no|n\/a)$/i) && 
                        !text.match(/^[A-Z]\d+\.\d+$/) && 
                        row[i].length > 20) {
                        longestText = row[i];
                    }
                }
            }
            if (longestText) {
                item.recommendation = longestText.trim();
            }
        }
        
        return item;
    }

    /**
     * Normalize status values from Excel to our format
     */
    normalizeStatus(status) {
        switch (status) {
            case 'fulfilled':
            case 'compliant':
            case 'yes':
            case 'passed':
            case 'pass':
            case 'completed':
            case 'done':
            case 'green':
            case '✓':
                return 'Fulfilled';
                
            case 'open':
            case 'non-compliant':
            case 'non compliant':
            case 'not compliant':
            case 'no':
            case 'failed':
            case 'fail':
            case 'red':
            case '✗':
                return 'Open';
                
            case 'not required':
            case 'not applicable':
            case 'n/a':
            case 'na':
            case 'skip':
            case 'skipped':
            case 'grey':
            case 'gray':
                return 'Not required';
                
            case 'not verified':
            case 'not reviewed':
            case 'pending':
            case 'todo':
            case 'unknown':
            case '':
            case null:
            case undefined:
            default:
                return 'Not verified';
        }
    }

    /**
     * Try to detect assessment type from the data
     */
    detectAssessmentType(items) {
        // Look for patterns in IDs or content to determine assessment type
        const sampleIds = items.slice(0, 10).map(item => item.id).filter(id => id);
        const allContent = items.map(item => [item.recommendation, item.category].join(' ')).join(' ').toLowerCase();
        
        // Check for Azure Landing Zone patterns
        if (sampleIds.some(id => id && id.match(/^A\d+\.\d+/)) || 
            allContent.includes('landing zone') || 
            allContent.includes('governance') ||
            allContent.includes('azure billing')) {
            return 'alz';
        }
        
        // Check for AKS patterns
        if (sampleIds.some(id => id && id.match(/^AKS/)) || 
            allContent.includes('kubernetes') || 
            allContent.includes('container')) {
            return 'aks';
        }
        
        // Check for App Service patterns
        if (allContent.includes('app service') || allContent.includes('web app')) {
            return 'appsvc';
        }
        
        // Default to ALZ if we can't determine
        return 'alz';
    }

    /**
     * Match Excel items without IDs to checklist items by recommendation text
     */
    async matchItemsToChecklist(items, assessmentType) {
        // First, make sure we have the checklist loaded
        if (!this.dataLoader || !this.dataLoader.getCurrentChecklist()) {
            // If checklist isn't loaded yet, try to load it
            try {
                await this.dataLoader.loadChecklist(assessmentType, 'en');
            } catch (error) {
                console.error('Failed to load checklist for matching:', error);
                return items; // Return items as-is if we can't load checklist
            }
        }

        const checklist = this.dataLoader.getCurrentChecklist();
        if (!checklist || !checklist.items) {
            return items; // Return items as-is if no checklist available
        }

        const matchedItems = [];
        
        for (const excelItem of items) {
            if (excelItem.id) {
                // Item already has ID, keep it as-is
                matchedItems.push(excelItem);
                continue;
            }

            // Try to match by recommendation text
            let bestMatch = null;
            let bestScore = 0;

            if (excelItem.recommendation) {
                for (const checklistItem of checklist.items) {
                    const score = this.calculateTextSimilarity(
                        excelItem.recommendation.toLowerCase(),
                        checklistItem.text.toLowerCase()
                    );
                    
                    if (score > bestScore && score > 0.3) { // Minimum similarity threshold
                        bestScore = score;
                        bestMatch = checklistItem;
                    }
                }
            }

            if (bestMatch) {
                // Found a match, use the checklist item's ID
                excelItem.id = bestMatch.id;
                matchedItems.push(excelItem);
            } else {
                // No match found, skip this item but log it
                console.log('Could not match Excel item to checklist:', excelItem.recommendation?.substring(0, 100));
            }
        }

        return matchedItems;
    }

    /**
     * Calculate text similarity between two strings (simple word overlap)
     */
    calculateTextSimilarity(text1, text2) {
        if (!text1 || !text2) return 0;

        // Simple word-based similarity
        const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        
        if (words1.length === 0 || words2.length === 0) return 0;

        const intersection = words1.filter(word => words2.includes(word));
        const union = [...new Set([...words1, ...words2])];
        
        return intersection.length / union.length;
    }

    /**
     * Validate uploaded assessment data structure
     */
    validateUploadedData(data) {
        // Check if it has the expected structure for an assessment
        if (!data || typeof data !== 'object') {
            return false;
        }

        // Check for expected properties
        if (data.assessmentType && data.items && Array.isArray(data.items)) {
            return true;
        }

        // Check if it's just assessment progress data (items with status)
        if (Array.isArray(data) && data.length > 0 && data[0].hasOwnProperty('status')) {
            return true;
        }

        return false;
    }

    /**
     * Load uploaded assessment data
     */
    async loadUploadedAssessment(data) {
        try {
            // If it's a full assessment file with metadata
            if (data.assessmentType && data.items) {
                // Set the assessment type
                const checklistSelector = document.getElementById('checklistSelector');
                
                if (checklistSelector) {
                    checklistSelector.value = data.assessmentType;
                }

                // Load the checklist first
                await this.dataLoader.loadChecklist(data.assessmentType);
                
                // Initialize managers
                this.initializeManagers();
                
                // Show assessment content
                this.showAssessmentContent();

                // Apply the uploaded progress
                this.applyUploadedProgress(data.items);
            } 
            // If it's just progress data (array of items with status)
            else if (Array.isArray(data)) {
                // Check if we have a current assessment loaded
                if (!this.dataLoader.getCurrentChecklist()) {
                    this.showNotification('Please load an assessment type first, then upload your progress file', 'warning');
                    return;
                }

                // Apply the uploaded progress to current assessment
                this.applyUploadedProgress(data);
            }

            // Refresh the display
            if (this.itemRenderer) {
                this.itemRenderer.renderItems();
            }
            if (this.progressManager) {
                this.progressManager.updateProgress();
            }

        } catch (error) {
            throw new Error(`Failed to process uploaded assessment: ${error.message}`);
        }
    }

    /**
     * Apply uploaded progress data to current assessment
     */
    applyUploadedProgress(uploadedItems) {
        const currentChecklist = this.dataLoader.getCurrentChecklist();
        if (!currentChecklist || !currentChecklist.items || currentChecklist.items.length === 0) {
            throw new Error('No assessment loaded to apply progress to');
        }

        const currentItems = currentChecklist.items;
        let appliedCount = 0;

        // Create a map of uploaded items by ID for faster lookup
        const uploadedMap = new Map();
        uploadedItems.forEach(item => {
            if (item.id) {
                uploadedMap.set(item.id, item);
            }
        });

        // Apply uploaded progress to matching items
        currentItems.forEach(currentItem => {
            const uploadedItem = uploadedMap.get(currentItem.id);
            if (uploadedItem) {
                if (uploadedItem.status) {
                    currentItem.status = uploadedItem.status;
                    appliedCount++;
                }
                if (uploadedItem.comments) {
                    currentItem.comments = uploadedItem.comments;
                }
            }
        });

        // Save progress to localStorage
        this.autoSaveProgress();

        this.showNotification(`Applied progress to ${appliedCount} items`, 'success');
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.alzApp = new ALZAssessmentApp();
    } catch (error) {
        console.error('Failed to initialize application:', error);
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.alzApp) {
        window.alzApp.cleanup();
    }
});