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
        this.diagnosticLogs = [];
        
        // File tracking for save functionality
        this.currentFileName = null;
        this.currentFileHandle = null;
        this.fileHasUnsavedChanges = false;
        this.lastSavedData = null;
        
        this.setupDiagnosticLogging();
        this.initialize();
    }

    /**
     * Setup diagnostic logging to capture console output
     */
    setupDiagnosticLogging() {
        const originalConsoleLog = console.log;
        const originalConsoleError = console.error;
        const originalConsoleWarn = console.warn;
        
        const addToDiagnostic = (level, ...args) => {
            const timestamp = new Date().toLocaleTimeString();
            const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            
            this.diagnosticLogs.push(`[${timestamp}] ${level}: ${message}`);
            
            // Keep only last 100 logs
            if (this.diagnosticLogs.length > 100) {
                this.diagnosticLogs.shift();
            }
            
            // Update diagnostic panel if visible
            const diagnosticContent = document.getElementById('diagnosticContent');
            if (diagnosticContent && diagnosticContent.parentElement.style.display !== 'none') {
                diagnosticContent.textContent = this.diagnosticLogs.join('\n');
                diagnosticContent.scrollTop = diagnosticContent.scrollHeight;
            }
        };
        
        console.log = (...args) => {
            originalConsoleLog.apply(console, args);
            addToDiagnostic('INFO', ...args);
        };
        
        console.error = (...args) => {
            originalConsoleError.apply(console, args);
            addToDiagnostic('ERROR', ...args);
        };
        
        console.warn = (...args) => {
            originalConsoleWarn.apply(console, args);
            addToDiagnostic('WARN', ...args);
        };
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
        // Language selector
        const languageSelector = document.getElementById('languageSelector');
        if (languageSelector) {
            // Set to saved language
            languageSelector.value = this.dataLoader.getLanguage();
            
            languageSelector.addEventListener('change', (event) => {
                const selectedLanguage = event.target.value;
                this.dataLoader.setLanguage(selectedLanguage);
                this.showNotification(`Language changed to ${this.dataLoader.availableLanguages[selectedLanguage]}. Please reload the assessment.`, 'info');
            });
        }

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

        // Quick save button
        const quickSaveButton = document.getElementById('quickSave');
        if (quickSaveButton) {
            quickSaveButton.addEventListener('click', () => this.quickSaveProgress());
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

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            // Ctrl+S for save
            if (event.ctrlKey && event.key === 's') {
                event.preventDefault();
                this.quickSaveProgress();
            }
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

        const currentLang = this.dataLoader.getLanguage();
        const langName = this.dataLoader.availableLanguages[currentLang];
        
        try {
            this.setLoadingState(true);
            
            console.log(`Loading checklist: ${checklistType} (${langName})`);
            
            // Load the checklist data
            await this.dataLoader.loadChecklist(checklistType);
            
            // Initialize all managers
            this.initializeManagers();
            
            // Show assessment content
            this.showAssessmentContent();
            
            // Try to restore previous progress
            this.tryRestoreProgress();
            
            this.showNotification(`Assessment loaded successfully! (Language: ${langName})`, 'success');
            
        } catch (error) {
            console.error('Failed to load checklist:', error);
            
            // If the specific language file is not found, fallback to English
            if (error.message.includes('404') && currentLang !== 'en') {
                this.showNotification(`${langName} version not available for this checklist. Try English or another language.`, 'warning');
            } else {
                this.showNotification(`Failed to load assessment: ${error.message}`, 'error');
            }
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
            
            // Check if data has changed since last save
            const currentDataString = JSON.stringify(progressData.data);
            if (this.lastSavedData !== currentDataString) {
                this.fileHasUnsavedChanges = true;
                this.updateWindowTitle();
            }
            
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

        // If we have tracking enabled, use that
        if (this.fileHasUnsavedChanges !== undefined) {
            return this.fileHasUnsavedChanges;
        }

        // Fallback to checking if there are any items with status other than 'Not verified'
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
     * Save current assessment to the same file
     */
    async quickSaveProgress() {
        if (!this.dataLoader?.getCurrentChecklist()) {
            this.showNotification('No assessment data to save. Please load an assessment first.', 'warning');
            return;
        }

        try {
            console.log('💾 Saving assessment progress...');
            
            // If we have a current file, save to it
            if (this.currentFileHandle) {
                await this.saveToCurrentFile();
            } else {
                // First time save - prompt for file location
                await this.saveAsNewFile();
            }
            
        } catch (error) {
            console.error('❌ Save failed:', error);
            this.showNotification(`Failed to save: ${error.message}`, 'error');
        }
    }

    /**
     * Save to the current file
     */
    async saveToCurrentFile() {
        if (!this.currentFileHandle) {
            throw new Error('No current file to save to');
        }

        try {
            const assessmentData = this.prepareAssessmentData();
            const jsonString = JSON.stringify(assessmentData, null, 2);
            
            // Check if File System Access API is available
            if ('createWritable' in this.currentFileHandle) {
                const writable = await this.currentFileHandle.createWritable();
                await writable.write(jsonString);
                await writable.close();
                
                this.hasUnsavedChanges = false;
                this.lastSavedData = JSON.stringify(assessmentData);
                this.updateWindowTitle();
                
                this.showNotification(`Saved to ${this.currentFileName}`, 'success');
                console.log(`✅ Saved to ${this.currentFileName}`);
            } else {
                // Fallback for browsers that don't support File System Access API
                throw new Error('File System Access API not supported');
            }
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                this.showNotification('Permission denied. Please try Save As instead.', 'warning');
                await this.saveAsNewFile();
            } else {
                throw error;
            }
        }
    }

    /**
     * Save as a new file
     */
    async saveAsNewFile() {
        try {
            const assessmentData = this.prepareAssessmentData();
            const jsonString = JSON.stringify(assessmentData, null, 2);
            
            // Check if File System Access API is available
            if ('showSaveFilePicker' in window) {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: this.generateFileName(),
                    types: [{
                        description: 'JSON files',
                        accept: { 'application/json': ['.json'] }
                    }]
                });
                
                const writable = await fileHandle.createWritable();
                await writable.write(jsonString);
                await writable.close();
                
                // Update current file tracking
                this.currentFileHandle = fileHandle;
                this.currentFileName = fileHandle.name;
                this.fileHasUnsavedChanges = false;
                this.lastSavedData = JSON.stringify(assessmentData);
                this.updateWindowTitle();
                
                this.showNotification(`Saved as ${this.currentFileName}`, 'success');
                console.log(`✅ Saved as ${this.currentFileName}`);
            } else {
                // Fallback to download for browsers that don't support File System Access API
                this.downloadAsFile(jsonString, this.generateFileName());
                this.showNotification('File downloaded (browser doesn\'t support direct file saving)', 'info');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Save cancelled by user');
                return;
            }
            throw error;
        }
    }

    /**
     * Prepare assessment data for saving
     */
    prepareAssessmentData() {
        const options = {
            includeComments: true,
            includeLinks: true,
            includeOnlyReviewed: false,
            templateFormat: false
        };
        
        return this.dataLoader.exportData(options);
    }

    /**
     * Generate a filename for the assessment
     */
    generateFileName() {
        const checklistType = document.getElementById('checklistSelector')?.value || 'assessment';
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        return `${checklistType}-assessment-${timestamp}.json`;
    }

    /**
     * Download file as fallback
     */
    downloadAsFile(content, fileName) {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    /**
     * Update window title to show current file and save status
     */
    updateWindowTitle() {
        const baseTitle = 'Azure Landing Zone Assessment Tool';
        
        // Update window title
        if (this.currentFileName) {
            const unsavedIndicator = this.fileHasUnsavedChanges ? ' *' : '';
            document.title = `${this.currentFileName}${unsavedIndicator} - ${baseTitle}`;
        } else {
            document.title = baseTitle;
        }
        
        // Update header file status indicator
        const fileStatus = document.getElementById('fileStatus');
        const currentFileNameEl = document.getElementById('currentFileName');
        const unsavedIndicatorEl = document.getElementById('unsavedIndicator');
        
        if (fileStatus && currentFileNameEl && unsavedIndicatorEl) {
            if (this.currentFileName) {
                fileStatus.style.display = 'flex';
                currentFileNameEl.textContent = this.currentFileName;
                unsavedIndicatorEl.style.display = this.fileHasUnsavedChanges ? 'inline' : 'none';
            } else {
                fileStatus.style.display = 'none';
            }
        }
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
            // Prepare export options
            const options = {
                includeComments: true,
                includeLinks: true,
                includeOnlyReviewed: false,
                templateFormat: false
            };

            console.log(`💾 Saving assessment as ${format.toUpperCase()}...`);

            switch (format) {
                case 'json':
                    this.exportManager.exportJSON(options);
                    break;
                case 'excel':
                    this.exportManager.exportExcel(options);
                    break;
                case 'csv':
                    this.exportManager.exportCSV(options);
                    break;
                default:
                    this.exportManager.exportJSON(options);
            }

            console.log(`✅ Assessment saved successfully as ${format.toUpperCase()}`);
            this.showNotification(`Assessment saved as ${format.toUpperCase()} file`, 'success');
        } catch (error) {
            console.error('❌ Failed to save assessment:', error);
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
            
            // Set current file information for save functionality
            this.currentFileName = file.name;
            this.currentFileHandle = null; // Can't get handle from file input
            this.fileHasUnsavedChanges = false;
            this.lastSavedData = JSON.stringify(this.prepareAssessmentData());
            this.updateWindowTitle();
            
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
                        
                        // Show success with details
                        const itemCount = data.items?.length || 0;
                        const assessmentType = data.assessmentType || 'Unknown';
                        this.showNotification(
                            `✅ Assessment uploaded successfully! Loaded ${itemCount} items (Type: ${assessmentType})`, 
                            'success'
                        );
                        
                        console.log('🎉 Upload process completed successfully!');
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
     * Show or hide upload loader with optional progress message
     */
    showUploadLoader(show, message = 'Processing...') {
        const loader = document.getElementById('uploadLoader');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
            
            // Update progress message if available
            const loaderText = loader.querySelector('.loader-text');
            if (loaderText && show) {
                loaderText.textContent = message;
            }
            
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
            // Refresh dashboard charts
            if (this.dashboardManager) {
                this.dashboardManager.updateCharts();
            }
            
            // Refresh assessment view
            if (this.assessmentManager) {
                this.assessmentManager.renderAssessmentItems();
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
        
        // Enable/disable navigation tabs based on data availability
        const dashboardTab = document.getElementById('dashboardTab');
        const assessmentTab = document.getElementById('assessmentTab');
        const exportTab = document.getElementById('exportTab');
        
        if (dashboardTab) dashboardTab.classList.toggle('disabled', !hasData);
        if (assessmentTab) assessmentTab.classList.toggle('disabled', !hasData);
        if (exportTab) exportTab.classList.toggle('disabled', !hasData);
        
        // If we have data and currently showing welcome screen, switch to assessment content and dashboard
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (hasData && welcomeScreen && welcomeScreen.style.display !== 'none') {
            this.showAssessmentContent();
            this.showView('dashboard');
        }
    }

    /**
     * Parse Excel file and convert to assessment data
     */
    async parseExcelFile(file) {
        const startTime = Date.now();
        console.log('📊 Starting Excel file parsing:', {
            fileName: file.name,
            fileSize: `${(file.size / 1024).toFixed(2)} KB`,
            timestamp: new Date().toISOString()
        });
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            // Add timeout detection
            const timeoutId = setTimeout(() => {
                console.error('⏱️ Excel parsing timeout after 60 seconds');
                reject(new Error('Excel file parsing timed out. The file may be too large or corrupted.'));
            }, 60000); // 60 second timeout
            
            reader.onload = async (e) => {
                try {
                    console.log('✅ File read complete, parsing workbook...');
                    const readTime = Date.now() - startTime;
                    console.log(`⏱️ Read time: ${readTime}ms`);
                    
                    const data = new Uint8Array(e.target.result);
                    console.log(`📦 Data size: ${(data.length / 1024).toFixed(2)} KB`);
                    
                    const workbook = XLSX.read(data, { type: 'array' });
                    console.log(`📋 Workbook loaded. Sheets: ${workbook.SheetNames.join(', ')}`);
                    
                    // Get the first worksheet
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    console.log(`📄 Processing sheet: ${firstSheetName}`);
                    
                    // Convert to JSON
                    const parseStart = Date.now();
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    const parseTime = Date.now() - parseStart;
                    console.log(`✅ Sheet parsed: ${jsonData.length} rows in ${parseTime}ms`);
                    
                    // Parse the Excel data to match our assessment format
                    const conversionStart = Date.now();
                    const assessmentData = await this.convertExcelToAssessment(jsonData);
                    const conversionTime = Date.now() - conversionStart;
                    const totalTime = Date.now() - startTime;
                    
                    console.log('🎉 Excel parsing complete:', {
                        totalRows: jsonData.length,
                        itemsFound: assessmentData.items?.length || 0,
                        conversionTime: `${conversionTime}ms`,
                        totalTime: `${totalTime}ms`,
                        assessmentType: assessmentData.assessmentType
                    });
                    
                    clearTimeout(timeoutId);
                    resolve(assessmentData);
                } catch (error) {
                    console.error('❌ Excel parsing error:', error);
                    clearTimeout(timeoutId);
                    reject(error);
                }
            };
            reader.onerror = () => {
                console.error('❌ File read error');
                clearTimeout(timeoutId);
                reject(new Error('Failed to read Excel file'));
            };
            
            console.log('📖 Starting file read...');
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
        console.log('🔄 Converting Excel data to assessment format...');
        console.log(`📊 Total rows: ${data.length}`);
        
        // Find the header row (look for common column names)
        // Azure Review Checklists Excel files typically have headers around row 6-8
        let headerRowIndex = -1;
        let headers = [];
        
        console.log('🔍 Scanning for header row (checking first 15 rows)...');
        
        // Scan up to row 15 to account for metadata/title rows at the top
        for (let i = 0; i < Math.min(15, data.length); i++) {
            const row = data[i];
            if (row && Array.isArray(row) && row.length > 5) { // Must have at least 5 columns
                const rowStr = row.join('|').toLowerCase(); // Use pipe separator for better matching
                
                // Check if this row has multiple header-like terms (more reliable)
                const headerTerms = ['id', 'guid', 'category', 'subcategory', 'text', 'description', 
                                   'status', 'waf', 'severity', 'service', 'recommendation', 'check'];
                const matchCount = headerTerms.filter(term => rowStr.includes(term)).length;
                
                // Row must have at least 3 header terms to be considered a header row
                if (matchCount >= 3) {
                    headerRowIndex = i;
                    headers = row.map(header => header ? header.toString().toLowerCase().trim() : '');
                    console.log(`Found header row at line ${i + 1} with ${matchCount} matching terms:`, row);
                    break;
                }
            }
        }
        
        if (headerRowIndex === -1) {
            console.error('❌ Header row not found');
            console.log('First 5 rows for debugging:', data.slice(0, 5));
            throw new Error('Could not find header row in Excel/CSV file. Please ensure the file has columns like ID, Category, Text, Status, etc. (Expected header row around lines 1-15)');
        }
        
        console.log(`✅ Header row found at index ${headerRowIndex}`);
        console.log('📋 Headers:', headers);
        
        // Map column names to expected fields
        const columnMap = this.createColumnMap(headers);
        console.log('🗺️ Column mapping:', columnMap);
        
        // Process data rows in batches to avoid UI blocking
        const items = [];
        const batchSize = 100; // Process 100 rows at a time
        const totalRows = data.length - headerRowIndex - 1;
        let consecutiveEmptyRows = 0;
        const maxEmptyRows = 10; // Stop after 10 consecutive empty rows
        
        for (let batchStart = headerRowIndex + 1; batchStart < data.length; batchStart += batchSize) {
            const batchEnd = Math.min(batchStart + batchSize, data.length);
            
            // Update progress
            const progress = Math.round(((batchEnd - headerRowIndex - 1) / totalRows) * 100);
            this.showUploadLoader(true, `Reading Excel file... ${progress}% (${batchEnd - headerRowIndex - 1}/${totalRows} rows)`);
            
            // Process batch
            for (let i = batchStart; i < batchEnd; i++) {
                const row = data[i];
                
                // Check if row is completely empty
                const isEmptyRow = !row || !Array.isArray(row) || row.length === 0 || 
                                   row.every(cell => !cell || cell.toString().trim() === '');
                
                if (isEmptyRow) {
                    consecutiveEmptyRows++;
                    // Stop processing if we hit too many consecutive empty rows
                    if (consecutiveEmptyRows >= maxEmptyRows) {
                        console.log(`⏹️ Stopped processing at row ${i} after ${consecutiveEmptyRows} consecutive empty rows`);
                        batchStart = data.length; // Exit outer loop
                        break;
                    }
                    continue;
                }
                
                consecutiveEmptyRows = 0; // Reset counter when we find data
                
                const item = this.processExcelRow(row, columnMap, headers, i);
                if (item && (item.id || item.recommendation)) {
                    items.push(item);
                }
            }
            
            // Allow UI to update between batches (reduced delay for better performance)
            if (batchEnd < data.length) {
                await new Promise(resolve => setTimeout(resolve, 1));
            }
        }
        
        if (items.length === 0) {
            console.error('❌ No valid items found');
            console.log('Troubleshooting: Check column mapping:', columnMap);
            console.log('Sample data rows:', data.slice(headerRowIndex + 1, headerRowIndex + 4));
            throw new Error('No valid assessment items found in the file. Please check the file format.');
        }

        console.log(`✅ Parsed ${items.length} items from Excel (actual data range: rows ${headerRowIndex + 1} to ~${headerRowIndex + items.length + 1})`);
        const itemsWithIds = items.filter(item => item.id);
        const itemsWithoutIds = items.filter(item => !item.id && item.recommendation);
        const itemsWithComments = items.filter(item => item.comment);
        console.log(`📊 Items with IDs: ${itemsWithIds.length}, Items without IDs: ${itemsWithoutIds.length}`);
        console.log(`💬 Items with comments: ${itemsWithComments.length}`);

        // Try to determine assessment type from the data first
        const assessmentType = this.detectAssessmentType(items);
        console.log(`🎯 Detected assessment type: ${assessmentType}`);

        // For items without IDs, try to match them using text similarity
        if (itemsWithoutIds.length > 0) {
            console.log(`🔍 Starting matching process for ${itemsWithoutIds.length} items...`);
            try {
                const matchStart = Date.now();
                this.showUploadLoader(true, `Matching ${itemsWithoutIds.length} items to checklist...`);
                const matchedItems = await this.matchItemsToChecklist(itemsWithoutIds, assessmentType);
                const matchTime = Date.now() - matchStart;
                console.log(`✅ Matching complete: ${matchedItems.length} items matched in ${matchTime}ms`);
                
                // Replace items without IDs with matched ones
                const itemsWithIds = items.filter(item => item.id);
                items.length = 0; // Clear array
                items.push(...itemsWithIds, ...matchedItems);
            } catch (error) {
                console.warn('Could not match items to checklist:', error);
                // Continue without matching - items without IDs will be filtered out later
            }
        }
        
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
            const h = header.toLowerCase().trim();
            
            // ID mapping (Azure Review Checklists uses "id")
            if (h === 'id' || h === 'guid' || h === 'reference' || h.includes('identifier')) {
                map.id = index;
            }
            // Status mapping
            else if (h === 'status' || h.includes('compliance') || h.includes('result')) {
                map.status = index;
            }
            // Comments mapping (handle typos like 'commant')
            else if (h === 'comments' || h === 'comment' || h === 'commant' || h === 'notes' || h === 'note' || h === 'remarks' || h === 'remark') {
                map.comments = index;
            }
            // Category mapping (includes 'design area')
            else if (h === 'category' || h === 'design area' || h.includes('domain') || h.includes('area')) {
                map.category = index;
            }
            // Subcategory mapping (Azure Review Checklists specific)
            else if (h === 'subcategory' || h.includes('sub-category') || h.includes('sub category')) {
                map.subcategory = index;
            }
            // Recommendation/Text mapping (includes 'checklist item' and 'topic')
            else if (h === 'text' || h === 'recommendation' || h === 'checklist item' || h === 'topic' || h === 'title' || h === 'check' || h.includes('description')) {
                // Prioritize "text" or "checklist item" columns
                if (!map.recommendation || h === 'text' || h === 'checklist item') {
                    map.recommendation = index;
                }
            }
            // WAF (Well-Architected Framework) mapping (includes 'waf pillar')
            else if (h === 'waf' || h === 'waf pillar' || h.includes('well-architected')) {
                map.waf = index;
            }
            // Severity mapping (handle typo 'sevirity')
            else if (h === 'severity' || h === 'sevirity' || h.includes('priority')) {
                map.severity = index;
            }
            // Service mapping
            else if (h === 'service' || h.includes('resource')) {
                map.service = index;
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
            item.comment = row[columnMap.comments].toString().trim();
        }
        
        // Extract Azure Review Checklists specific fields
        if (columnMap.category !== undefined && row[columnMap.category]) {
            item.category = row[columnMap.category].toString().trim();
        }
        
        if (columnMap.subcategory !== undefined && row[columnMap.subcategory]) {
            item.subcategory = row[columnMap.subcategory].toString().trim();
        }
        
        if (columnMap.recommendation !== undefined && row[columnMap.recommendation]) {
            item.recommendation = row[columnMap.recommendation].toString().trim();
        }
        
        if (columnMap.waf !== undefined && row[columnMap.waf]) {
            item.waf = row[columnMap.waf].toString().trim();
        }
        
        if (columnMap.severity !== undefined && row[columnMap.severity]) {
            item.severity = row[columnMap.severity].toString().trim();
        }
        
        if (columnMap.service !== undefined && row[columnMap.service]) {
            item.service = row[columnMap.service].toString().trim();
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
        console.log(`🔍 matchItemsToChecklist started with ${items.length} items`);
        const matchStart = Date.now();
        
        // First, make sure we have the checklist loaded
        if (!this.dataLoader || !this.dataLoader.getCurrentChecklist()) {
            console.log('⏳ Checklist not loaded, loading now...');
            // If checklist isn't loaded yet, try to load it
            try {
                await this.dataLoader.loadChecklist(assessmentType, 'en');
                console.log('✅ Checklist loaded successfully');
            } catch (error) {
                console.error('❌ Failed to load checklist for matching:', error);
                return items; // Return items as-is if we can't load checklist
            }
        }

        const checklist = this.dataLoader.getCurrentChecklist();
        if (!checklist || !checklist.items) {
            console.error('❌ No checklist available for matching');
            return items; // Return items as-is if no checklist available
        }

        console.log(`📋 Checklist has ${checklist.items.length} items`);
        const matchedItems = [];
        let matchedCount = 0;
        let unmatchedCount = 0;
        
        // PERFORMANCE OPTIMIZATION: Create a keyword index for faster matching
        console.log('🗂️ Building keyword index...');
        const indexStart = Date.now();
        const checklistIndex = new Map();
        checklist.items.forEach(item => {
            const keywords = item.text.toLowerCase()
                .split(/\s+/)
                .filter(w => w.length > 4) // Use longer words as keywords
                .slice(0, 10); // Take first 10 keywords only
            
            keywords.forEach(keyword => {
                if (!checklistIndex.has(keyword)) {
                    checklistIndex.set(keyword, []);
                }
                checklistIndex.get(keyword).push(item);
            });
        });
        const indexTime = Date.now() - indexStart;
        console.log(`✅ Keyword index built: ${checklistIndex.size} keywords in ${indexTime}ms`);
        
        // Process items in batches for better performance
        const batchSize = 50;
        console.log(`🔄 Processing ${items.length} items in batches of ${batchSize}...`);
        
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchNum = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(items.length / batchSize);
            const progress = Math.round((i / items.length) * 100);
            
            console.log(`⏳ Processing batch ${batchNum}/${totalBatches} (${progress}%)`);
            this.showUploadLoader(true, `Matching items... ${progress}% (${i}/${items.length})`);
            
            for (const excelItem of batch) {
                if (excelItem.id) {
                    // Item already has ID, keep it as-is
                    matchedItems.push(excelItem);
                    continue;
                }

                // Try to match by recommendation text using keyword index
                let bestMatch = null;
                let bestScore = 0;

                if (excelItem.recommendation) {
                    // Get keywords from Excel item
                    const excelKeywords = excelItem.recommendation.toLowerCase()
                        .split(/\s+/)
                        .filter(w => w.length > 4)
                        .slice(0, 10);
                    
                    // Get candidate items from index (much faster than checking all items)
                    const candidates = new Set();
                    excelKeywords.forEach(keyword => {
                        const items = checklistIndex.get(keyword);
                        if (items) {
                            items.forEach(item => candidates.add(item));
                        }
                    });
                    
                    // Only check candidates, not all checklist items
                    for (const checklistItem of candidates) {
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
                    matchedCount++;
                } else {
                    // No match found, skip this item but log it
                    unmatchedCount++;
                    console.warn(`⚠️ Could not match item (score threshold not met): ${excelItem.recommendation?.substring(0, 80)}...`);
                }
            }
            
            // Allow UI to breathe between batches
            if (i + batchSize < items.length) {
                await new Promise(resolve => setTimeout(resolve, 5));
            }
        }

        const matchTime = Date.now() - matchStart;
        console.log('🎉 Matching complete:', {
            totalItems: items.length,
            matched: matchedCount,
            unmatched: unmatchedCount,
            timeMs: matchTime,
            avgTimePerItem: `${(matchTime / items.length).toFixed(2)}ms`
        });

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
        let commentsApplied = 0;
        currentItems.forEach(currentItem => {
            const uploadedItem = uploadedMap.get(currentItem.id);
            if (uploadedItem) {
                if (uploadedItem.status) {
                    currentItem.status = uploadedItem.status;
                    appliedCount++;
                }
                if (uploadedItem.comment) {
                    currentItem.comment = uploadedItem.comment;
                    commentsApplied++;
                }
            }
        });

        console.log(`📝 Applied ${commentsApplied} comments to items`);

        // Save progress to localStorage
        this.autoSaveProgress();

        this.showNotification(`Applied progress to ${appliedCount} items (${commentsApplied} with comments)`, 'success');
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