/**
 * Assessment Module
 * Handles the interactive assessment interface and user interactions
 */

class AssessmentManager {
    constructor(dataLoader) {
        this.dataLoader = dataLoader;
        this.currentFilters = {};
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.searchTimeout = null;

        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners for assessment interface
     */
    initializeEventListeners() {
        // Filter controls
        document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
            this.currentFilters.category = e.target.value;
            this.renderAssessmentItems();
        });

        document.getElementById('severityFilter')?.addEventListener('change', (e) => {
            this.currentFilters.severity = e.target.value;
            this.renderAssessmentItems();
        });

        document.getElementById('statusFilter')?.addEventListener('change', (e) => {
            this.currentFilters.status = e.target.value;
            this.renderAssessmentItems();
        });

        document.getElementById('clearFilters')?.addEventListener('click', () => {
            this.clearFilters();
        });

        // Search functionality (if added later)
        this.setupSearchHandler();
    }

    /**
     * Setup search handler with debouncing
     */
    setupSearchHandler() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.currentFilters.search = e.target.value;
                    this.renderAssessmentItems();
                }, 300);
            });
        }
    }

    /**
     * Initialize assessment interface with loaded data
     */
    initializeAssessment() {
        const checklist = this.dataLoader.getCurrentChecklist();
        if (!checklist) {
            console.error('No checklist data available');
            return;
        }

        this.populateFilterDropdowns();
        this.renderAssessmentItems();
        this.updateProgress();
    }

    /**
     * Populate filter dropdown options
     */
    populateFilterDropdowns() {
        const checklist = this.dataLoader.getCurrentChecklist();
        if (!checklist) return;

        // Populate category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">All Categories</option>';
            checklist.metadata.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });
        }

        // Populate severity filter
        const severityFilter = document.getElementById('severityFilter');
        if (severityFilter) {
            severityFilter.innerHTML = '<option value="">All Severities</option>';
            checklist.metadata.severities.forEach(severity => {
                const option = document.createElement('option');
                option.value = severity;
                option.textContent = severity;
                severityFilter.appendChild(option);
            });
        }

        // Populate status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.innerHTML = '<option value="">All Statuses</option>';
            const statuses = ['Not Reviewed', 'Compliant', 'Non-Compliant', 'Not Applicable'];
            statuses.forEach(status => {
                const option = document.createElement('option');
                option.value = status;
                option.textContent = status;
                statusFilter.appendChild(option);
            });
        }

        // Subcategory filter could be added here in the future
    }

    /**
     * Render assessment items based on current filters
     */
    renderAssessmentItems() {
        const container = document.getElementById('assessmentItems');
        if (!container) return;

        const filteredItems = this.dataLoader.filterItems(this.currentFilters);
        
        if (filteredItems.length === 0) {
            container.innerHTML = `
                <div class="no-items-message">
                    <i class="fas fa-search"></i>
                    <h3>No items found</h3>
                    <p>Try adjusting your filters or search criteria.</p>
                </div>
            `;
            return;
        }

        // Group items by category and sort by severity within each category
        const groupedItems = this.groupAndSortItems(filteredItems);

        // Calculate pagination for grouped items
        const allItems = Object.values(groupedItems).flat();
        const totalPages = Math.ceil(allItems.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;

        // Render grouped items with pagination
        container.innerHTML = this.renderGroupedItems(groupedItems, startIndex, endIndex);

        // Render pagination if needed
        this.renderPagination(totalPages, allItems.length);

        // Update progress after rendering
        this.updateProgress();
    }

    /**
     * Group items by category and sort by severity within each category
     * @param {Array} items - Items to group and sort
     * @returns {Object} Grouped and sorted items
     */
    groupAndSortItems(items) {
        const severityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
        const grouped = {};

        // Group by category
        items.forEach(item => {
            if (!grouped[item.category]) {
                grouped[item.category] = [];
            }
            grouped[item.category].push(item);
        });

        // Sort each category by severity (High → Medium → Low), then by ID
        Object.keys(grouped).forEach(category => {
            grouped[category].sort((a, b) => {
                const severityDiff = (severityOrder[a.severity] || 999) - (severityOrder[b.severity] || 999);
                if (severityDiff !== 0) return severityDiff;
                return a.id.localeCompare(b.id);
            });
        });

        // Sort categories alphabetically
        const sortedGrouped = {};
        Object.keys(grouped).sort().forEach(category => {
            sortedGrouped[category] = grouped[category];
        });

        return sortedGrouped;
    }

    /**
     * Render grouped items with category headers
     * @param {Object} groupedItems - Items grouped by category
     * @param {number} startIndex - Start index for pagination
     * @param {number} endIndex - End index for pagination
     * @returns {string} HTML string
     */
    renderGroupedItems(groupedItems, startIndex, endIndex) {
        let html = '';
        let currentIndex = 0;
        let itemsRendered = 0;

        Object.entries(groupedItems).forEach(([category, items]) => {
            // Check if this category has items in the current page
            const categoryStartIndex = currentIndex;
            const categoryEndIndex = currentIndex + items.length;

            if (categoryEndIndex > startIndex && categoryStartIndex < endIndex) {
                // Add category header
                html += `
                    <div class="category-section">
                        <div class="category-header">
                            <h3><i class="fas fa-folder"></i> ${category}</h3>
                            <div class="category-stats">
                                <span class="item-count">${items.length} items</span>
                                <span class="severity-breakdown">
                                    ${this.getCategorySeverityBreakdown(items)}
                                </span>
                            </div>
                        </div>
                        <div class="category-items">
                `;

                // Render items within the pagination range
                items.forEach((item, index) => {
                    const itemGlobalIndex = currentIndex + index;
                    if (itemGlobalIndex >= startIndex && itemGlobalIndex < endIndex) {
                        html += this.renderAssessmentItem(item);
                        itemsRendered++;
                    }
                });

                html += `
                        </div>
                    </div>
                `;
            }

            currentIndex += items.length;
        });

        return html;
    }

    /**
     * Get severity breakdown for a category
     * @param {Array} items - Items in the category
     * @returns {string} HTML for severity breakdown
     */
    getCategorySeverityBreakdown(items) {
        const severities = { High: 0, Medium: 0, Low: 0 };
        items.forEach(item => {
            if (severities.hasOwnProperty(item.severity)) {
                severities[item.severity]++;
            }
        });

        return `
            <span class="severity-count severity-high">${severities.High} High</span>
            <span class="severity-count severity-medium">${severities.Medium} Medium</span>
            <span class="severity-count severity-low">${severities.Low} Low</span>
        `;
    }

    /**
     * Render a single assessment item
     * @param {Object} item - Assessment item
     * @returns {string} HTML string for the item
     */
    renderAssessmentItem(item) {
        const severityClass = `severity-${item.severity.toLowerCase()}`;
        
        return `
            <div class="assessment-item" data-item-id="${item.id}">
                <div class="item-header">
                    <div class="item-info">
                        <div class="item-id">${item.id}</div>
                        <div class="item-category">${item.category} > ${item.subcategory}</div>
                        <div class="item-text">${item.text}</div>
                        <div class="item-meta">
                            <span class="severity-badge ${severityClass}">${item.severity}</span>
                            <span class="waf-badge">${item.waf}</span>
                            <span class="service-badge">${item.service}</span>
                            <div class="item-links">
                                ${item.link ? `<a href="${item.link}" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i> More Info</a>` : ''}
                                ${item.training ? `<a href="${item.training}" target="_blank" rel="noopener"><i class="fas fa-graduation-cap"></i> Training</a>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="item-controls">
                    <div class="status-controls">
                        <button class="status-btn ${item.status === 'Not Reviewed' ? 'active' : ''}" 
                                data-status="Not Reviewed" data-item-id="${item.id}">
                            Not Reviewed
                        </button>
                        <button class="status-btn compliant ${item.status === 'Compliant' ? 'active' : ''}" 
                                data-status="Compliant" data-item-id="${item.id}">
                            <i class="fas fa-check"></i> Compliant
                        </button>
                        <button class="status-btn non-compliant ${item.status === 'Non-Compliant' ? 'active' : ''}" 
                                data-status="Non-Compliant" data-item-id="${item.id}">
                            <i class="fas fa-times"></i> Non-Compliant
                        </button>
                        <button class="status-btn not-applicable ${item.status === 'Not Applicable' ? 'active' : ''}" 
                                data-status="Not Applicable" data-item-id="${item.id}">
                            <i class="fas fa-minus"></i> Not Applicable
                        </button>
                    </div>
                    
                    <div class="comment-section">
                        <label for="comment-${item.id}">Comments & Notes:</label>
                        <textarea id="comment-${item.id}" 
                                  placeholder="Add notes, reasons for non-compliance, remediation plans, etc."
                                  data-item-id="${item.id}">${item.comment || ''}</textarea>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render pagination controls
     * @param {number} totalPages - Total number of pages
     * @param {number} totalItems - Total number of items
     */
    renderPagination(totalPages, totalItems) {
        if (totalPages <= 1) return;

        const container = document.getElementById('assessmentItems');
        const paginationHTML = `
            <div class="pagination-container">
                <div class="pagination-info">
                    Showing ${((this.currentPage - 1) * this.itemsPerPage) + 1}-${Math.min(this.currentPage * this.itemsPerPage, totalItems)} of ${totalItems} items
                </div>
                <div class="pagination-controls">
                    <button class="btn btn-secondary" ${this.currentPage === 1 ? 'disabled' : ''} 
                            onclick="assessmentManager.goToPage(${this.currentPage - 1})">
                        <i class="fas fa-chevron-left"></i> Previous
                    </button>
                    <span class="page-info">Page ${this.currentPage} of ${totalPages}</span>
                    <button class="btn btn-secondary" ${this.currentPage === totalPages ? 'disabled' : ''} 
                            onclick="assessmentManager.goToPage(${this.currentPage + 1})">
                        Next <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', paginationHTML);
    }

    /**
     * Go to specific page
     * @param {number} page - Page number
     */
    goToPage(page) {
        this.currentPage = page;
        this.renderAssessmentItems();
        // Scroll to top of assessment items
        document.getElementById('assessmentItems')?.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.currentFilters = {};
        this.currentPage = 1;
        
        // Reset filter controls
        document.getElementById('categoryFilter').value = '';
        document.getElementById('severityFilter').value = '';
        document.getElementById('statusFilter').value = '';
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        
        this.renderAssessmentItems();
    }

    /**
     * Handle status button clicks
     * @param {Event} event - Click event
     */
    handleStatusClick(event) {
        const button = event.target.closest('.status-btn');
        if (!button) return;

        const itemId = button.dataset.itemId;
        const status = button.dataset.status;
        
        // Update data
        const comment = document.getElementById(`comment-${itemId}`)?.value || '';
        this.dataLoader.updateItem(itemId, status, comment);
        
        // Update UI
        const itemContainer = button.closest('.assessment-item');
        const statusButtons = itemContainer.querySelectorAll('.status-btn');
        statusButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update progress
        this.updateProgress();
        
        // Trigger dashboard update if visible
        if (window.dashboardManager) {
            window.dashboardManager.updateCharts();
        }
    }

    /**
     * Handle comment changes
     * @param {Event} event - Input event
     */
    handleCommentChange(event) {
        const textarea = event.target;
        const itemId = textarea.dataset.itemId;
        
        // Debounce the update
        clearTimeout(textarea.updateTimeout);
        textarea.updateTimeout = setTimeout(() => {
            const item = this.dataLoader.getCurrentChecklist()?.items.find(item => item.id === itemId);
            if (item) {
                this.dataLoader.updateItem(itemId, item.status, textarea.value);
            }
        }, 500);
    }

    /**
     * Update progress display
     */
    updateProgress() {
        const stats = this.dataLoader.getStatistics();
        
        // Update progress bar
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const progressPercentage = document.getElementById('progressPercentage');
        
        if (progressFill) {
            progressFill.style.width = `${stats.completionPercentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `Progress: ${stats.reviewed}/${stats.total} items completed`;
        }
        
        if (progressPercentage) {
            progressPercentage.textContent = `${stats.completionPercentage}%`;
        }
    }

    /**
     * Setup event delegation for dynamic content
     */
    setupEventDelegation() {
        const assessmentItems = document.getElementById('assessmentItems');
        if (!assessmentItems) return;

        // Handle status button clicks
        assessmentItems.addEventListener('click', (event) => {
            if (event.target.closest('.status-btn')) {
                this.handleStatusClick(event);
            }
        });

        // Handle comment changes
        assessmentItems.addEventListener('input', (event) => {
            if (event.target.tagName === 'TEXTAREA') {
                this.handleCommentChange(event);
            }
        });
    }

    /**
     * Get current assessment state for saving
     * @returns {Object} Current assessment state
     */
    getCurrentState() {
        return {
            filters: this.currentFilters,
            page: this.currentPage,
            itemsPerPage: this.itemsPerPage,
            assessmentData: this.dataLoader.exportData()
        };
    }

    /**
     * Restore assessment state
     * @param {Object} state - Saved assessment state
     */
    restoreState(state) {
        if (state.filters) {
            this.currentFilters = state.filters;
        }
        
        if (state.page) {
            this.currentPage = state.page;
        }
        
        if (state.itemsPerPage) {
            this.itemsPerPage = state.itemsPerPage;
        }
        
        if (state.assessmentData) {
            this.dataLoader.importProgress(state.assessmentData);
        }
        
        // Re-render with restored state
        this.populateFilterDropdowns();
        this.renderAssessmentItems();
    }

    /**
     * Export current view as printable report
     */
    generatePrintableReport() {
        const filteredItems = this.dataLoader.filterItems(this.currentFilters);
        const stats = this.dataLoader.getStatistics();
        
        const printWindow = window.open('', '_blank');
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Azure Landing Zone Assessment Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
                    .stat-box { text-align: center; padding: 15px; border: 1px solid #ddd; }
                    .item { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; break-inside: avoid; }
                    .item-id { font-weight: bold; color: #0078d4; }
                    .item-category { font-size: 0.9em; color: #666; margin: 5px 0; }
                    .item-text { margin: 10px 0; }
                    .item-meta { font-size: 0.8em; color: #666; }
                    .status { font-weight: bold; padding: 2px 8px; border-radius: 4px; }
                    .status-compliant { background: #d4edda; color: #155724; }
                    .status-non-compliant { background: #f8d7da; color: #721c24; }
                    .status-not-applicable { background: #e2e3e5; color: #383d41; }
                    .comment { margin-top: 10px; font-style: italic; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Azure Landing Zone Assessment Report</h1>
                    <p>Generated on ${new Date().toLocaleString()}</p>
                </div>
                
                <div class="stats">
                    <div class="stat-box">
                        <h3>${stats.total}</h3>
                        <p>Total Items</p>
                    </div>
                    <div class="stat-box">
                        <h3>${stats.reviewed}</h3>
                        <p>Reviewed</p>
                    </div>
                    <div class="stat-box">
                        <h3>${stats.compliant}</h3>
                        <p>Compliant</p>
                    </div>
                    <div class="stat-box">
                        <h3>${stats.nonCompliant}</h3>
                        <p>Non-Compliant</p>
                    </div>
                </div>
                
                ${filteredItems.map(item => `
                    <div class="item">
                        <div class="item-id">${item.id}</div>
                        <div class="item-category">${item.category} > ${item.subcategory}</div>
                        <div class="item-text">${item.text}</div>
                        <div class="item-meta">
                            Severity: ${item.severity} | Service: ${item.service}
                        </div>
                        <div class="status status-${item.status.toLowerCase().replace(' ', '-')}">
                            Status: ${item.status}
                        </div>
                        ${item.comment ? `<div class="comment">Comment: ${item.comment}</div>` : ''}
                    </div>
                `).join('')}
            </body>
            </html>
        `;
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }
}

// Export for use in other modules
window.AssessmentManager = AssessmentManager;