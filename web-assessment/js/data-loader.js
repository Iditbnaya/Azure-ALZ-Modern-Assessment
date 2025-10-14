/**
 * Data Loader Module
 * Handles loading and parsing of checklist JSON files
 */

class DataLoader {
    constructor() {
        this.currentChecklist = null;
        this.availableChecklists = {
            'main': 'Complete ALZ Assessment (Main Checklist)',
            'alz': 'Azure Landing Zone',
            'ai_lz': 'AI Landing Zone',
            'aks': 'Azure Kubernetes Service',
            'appsvc': 'App Service',
            'avd': 'Azure Virtual Desktop',
            'apim': 'API Management',
            'acr': 'Azure Container Registry',
            'adf': 'Azure Data Factory',
            'aro': 'Azure Red Hat OpenShift',
            'azfun': 'Azure Functions',
            'cosmosdb': 'Cosmos DB',
            'databricks': 'Azure Databricks',
            'eh': 'Event Hubs',
            'keyvault': 'Key Vault',
            'mysql': 'MySQL',
            'postgreSQL': 'PostgreSQL',
            'redis': 'Redis Cache',
            'security': 'Security',
            'sqldb': 'SQL Database',
            'azure_storage': 'Azure Storage'
        };
    }

    /**
     * Load checklist data based on type
     * @param {string} checklistType - Type of checklist (alz, aks, etc.)
     * @returns {Promise<Object>} Parsed checklist data
     */
    async loadChecklist(checklistType) {
        try {
            // If requesting 'main' or if no specific type, load the main checklist.json file
            if (checklistType === 'main' || !checklistType) {
                const mainChecklistPath = 'checklist.json';
                let checklistData = await this.fetchJSON(mainChecklistPath);

                if (checklistData && checklistData.items) {
                    console.log('Loaded from main checklist.json');
                    this.currentChecklist = this.processChecklistData(checklistData);
                    return this.currentChecklist;
                }
                
                throw new Error('Main checklist.json not found or invalid');
            }

            // For specific checklist types, load from the specific checklist files
            const filename = `${checklistType}_checklist.en.json`;
            const checklistPath = `review-checklists/checklists/${filename}`;
            
            let checklistData = await this.fetchJSON(checklistPath);
            
            if (!checklistData || !checklistData.items) {
                throw new Error(`Invalid checklist format for ${filename}`);
            }

            this.currentChecklist = this.processChecklistData(checklistData);
            console.log(`Loaded ${filename} with ${this.currentChecklist.items.length} items`);
            
            return this.currentChecklist;

        } catch (error) {
            console.error('Error loading checklist:', error);
            
            // If loading fails, try to generate sample data for development
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.warn('Using sample data for development');
                return this.generateSampleData(checklistType);
            }
            
            throw new Error(`Failed to load checklist: ${error.message}`);
        }
    }

    /**
     * Fetch JSON data from a URL
     * @param {string} url - URL to fetch
     * @returns {Promise<Object>} Parsed JSON data
     */
    async fetchJSON(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.warn(`Failed to fetch ${url}:`, error.message);
            return null;
        }
    }

    /**
     * Process raw checklist data and add assessment tracking
     * @param {Object} rawData - Raw checklist data
     * @returns {Object} Processed checklist data
     */
    processChecklistData(rawData) {
        const processedItems = rawData.items.map(item => ({
            ...item,
            status: 'Not verified',
            comment: '',
            reviewedAt: null,
            reviewedBy: null
        }));

        const categories = [...new Set(processedItems.map(item => item.category))];
        const subcategories = [...new Set(processedItems.map(item => item.subcategory))];
        const services = [...new Set(processedItems.map(item => item.service))];
        const severities = [...new Set(processedItems.map(item => item.severity))];

        return {
            items: processedItems,
            metadata: {
                totalItems: processedItems.length,
                categories: categories.sort(),
                subcategories: subcategories.sort(),
                services: services.sort(),
                severities: severities.sort(),
                loadedAt: new Date().toISOString(),
                version: rawData.version || '1.0'
            }
        };
    }

    /**
     * Generate sample data for development/testing
     * @param {string} checklistType - Type of checklist
     * @returns {Object} Sample checklist data
     */
    generateSampleData(checklistType) {
        const sampleItems = [
            {
                id: 'A01.01',
                category: 'Azure Billing and Microsoft Entra ID Tenants',
                subcategory: 'Microsoft Entra ID Tenants',
                text: 'Use one Entra tenant for managing your Azure resources, unless you have a clear regulatory or business requirement for multi-tenants.',
                waf: 'Operations',
                service: 'Entra',
                severity: 'Medium',
                link: 'https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/design-area/multi-tenant/considerations-recommendations',
                training: 'https://learn.microsoft.com/training/modules/deploy-resources-scopes-bicep/2-understand-deployment-scopes',
                guid: '70c15989-c726-42c7-b0d3-24b7375b9201',
                status: 'Not verified',
                comment: '',
                reviewedAt: null,
                reviewedBy: null
            },
            {
                id: 'A01.02',
                category: 'Azure Billing and Microsoft Entra ID Tenants',
                subcategory: 'Microsoft Entra ID Tenants',
                text: 'Use Multi-Tenant Automation approach to managing your Microsoft Entra ID Tenants.',
                waf: 'Operations',
                service: 'Entra',
                severity: 'Low',
                link: 'https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/design-area/multi-tenant/automation',
                training: 'https://learn.microsoft.com/entra/architecture/multi-tenant-user-management-introduction/',
                guid: '6309957b-821a-43d1-b9d9-7fcf1802b747',
                status: 'Not verified',
                comment: '',
                reviewedAt: null,
                reviewedBy: null
            },
            {
                id: 'S01.01',
                category: 'Security',
                subcategory: 'Identity and Access Management',
                text: 'Implement Zero Trust security model for all access controls.',
                waf: 'Security',
                service: 'Security',
                severity: 'High',
                link: 'https://learn.microsoft.com/security/zero-trust/',
                training: 'https://learn.microsoft.com/training/modules/zero-trust-introduction/',
                guid: 'security-001',
                status: 'Not verified',
                comment: '',
                reviewedAt: null,
                reviewedBy: null
            }
        ];

        const metadata = {
            totalItems: sampleItems.length,
            categories: ['Azure Billing and Microsoft Entra ID Tenants', 'Security'],
            subcategories: ['Microsoft Entra ID Tenants', 'Identity and Access Management'],
            services: ['Entra', 'Security'],
            severities: ['High', 'Medium', 'Low'],
            loadedAt: new Date().toISOString(),
            version: '1.0-sample'
        };

        console.log('Generated sample data for development');
        
        this.currentChecklist = {
            items: sampleItems,
            metadata: metadata
        };

        return this.currentChecklist;
    }

    /**
     * Get available checklist types
     * @returns {Object} Available checklist types
     */
    getAvailableChecklists() {
        return this.availableChecklists;
    }

    /**
     * Get current checklist data
     * @returns {Object} Current checklist data
     */
    getCurrentChecklist() {
        return this.currentChecklist;
    }

    /**
     * Filter checklist items based on criteria
     * @param {Object} filters - Filter criteria
     * @returns {Array} Filtered items
     */
    filterItems(filters = {}) {
        if (!this.currentChecklist) {
            return [];
        }

        let filteredItems = [...this.currentChecklist.items];

        if (filters.category && filters.category !== '') {
            filteredItems = filteredItems.filter(item => item.category === filters.category);
        }

        if (filters.subcategory && filters.subcategory !== '') {
            filteredItems = filteredItems.filter(item => item.subcategory === filters.subcategory);
        }

        if (filters.severity && filters.severity !== '') {
            filteredItems = filteredItems.filter(item => item.severity === filters.severity);
        }

        if (filters.waf && filters.waf !== '') {
            filteredItems = filteredItems.filter(item => item.waf === filters.waf);
        }

        if (filters.status && filters.status !== '') {
            filteredItems = filteredItems.filter(item => item.status === filters.status);
        }

        if (filters.service && filters.service !== '') {
            filteredItems = filteredItems.filter(item => item.service === filters.service);
        }

        if (filters.search && filters.search.trim() !== '') {
            const searchTerm = filters.search.toLowerCase();
            filteredItems = filteredItems.filter(item => 
                item.text.toLowerCase().includes(searchTerm) ||
                item.category.toLowerCase().includes(searchTerm) ||
                item.subcategory.toLowerCase().includes(searchTerm) ||
                item.id.toLowerCase().includes(searchTerm)
            );
        }

        return filteredItems;
    }

    /**
     * Update an item's status and comment
     * @param {string} itemId - Item ID
     * @param {string} status - New status
     * @param {string} comment - New comment
     */
    updateItem(itemId, status, comment = '') {
        if (!this.currentChecklist) {
            return false;
        }

        const item = this.currentChecklist.items.find(item => item.id === itemId);
        if (item) {
            item.status = status;
            item.comment = comment;
            item.reviewedAt = new Date().toISOString();
            item.reviewedBy = 'Current User'; // This could be dynamic based on auth
            return true;
        }
        
        return false;
    }

    /**
     * Get assessment statistics
     * @returns {Object} Assessment statistics
     */
    getStatistics() {
        if (!this.currentChecklist) {
            return {
                total: 0,
                reviewed: 0,
                fulfilled: 0,
                open: 0,
                notApplicable: 0,
                notReviewed: 0,
                completionPercentage: 0
            };
        }

        const items = this.currentChecklist.items;
        const total = items.length;
        const reviewed = items.filter(item => item.status !== 'Not verified').length;
        const fulfilled = items.filter(item => item.status === 'Fulfilled').length;
        const open = items.filter(item => item.status === 'Open').length;
        const notApplicable = items.filter(item => item.status === 'Not required').length;
        const notReviewed = items.filter(item => item.status === 'Not verified').length;

        return {
            total,
            reviewed,
            fulfilled,
            open,
            notApplicable,
            notReviewed,
            completionPercentage: total > 0 ? Math.round((reviewed / total) * 100) : 0
        };
    }

    /**
     * Export assessment data
     * @param {Object} options - Export options
     * @returns {Object} Export data
     */
    exportData(options = {}) {
        if (!this.currentChecklist) {
            return null;
        }

        const includeComments = options.includeComments !== false;
        const includeLinks = options.includeLinks !== false;
        const onlyReviewed = options.onlyReviewed === true;

        let items = [...this.currentChecklist.items];

        if (onlyReviewed) {
            items = items.filter(item => item.status !== 'Not verified');
        }

        const exportData = {
            metadata: {
                ...this.currentChecklist.metadata,
                exportedAt: new Date().toISOString(),
                exportOptions: options
            },
            statistics: this.getStatistics(),
            items: items.map(item => {
                const exportItem = {
                    id: item.id,
                    category: item.category,
                    subcategory: item.subcategory,
                    text: item.text,
                    severity: item.severity,
                    waf: item.waf,
                    service: item.service,
                    status: item.status,
                };

                if (includeComments) {
                    exportItem.comment = item.comment;
                    exportItem.reviewedAt = item.reviewedAt;
                    exportItem.reviewedBy = item.reviewedBy;
                }

                if (includeLinks) {
                    exportItem.link = item.link;
                    exportItem.training = item.training;
                }

                return exportItem;
            })
        };

        return exportData;
    }

    /**
     * Import assessment progress from exported data
     * @param {Object} importData - Previously exported data
     * @returns {boolean} Success status
     */
    importProgress(importData) {
        if (!this.currentChecklist || !importData || !importData.items) {
            return false;
        }

        try {
            importData.items.forEach(importItem => {
                const currentItem = this.currentChecklist.items.find(item => item.id === importItem.id);
                if (currentItem) {
                    currentItem.status = importItem.status || 'Not verified';
                    currentItem.comment = importItem.comment || '';
                    currentItem.reviewedAt = importItem.reviewedAt || null;
                    currentItem.reviewedBy = importItem.reviewedBy || null;
                }
            });

            console.log('Successfully imported assessment progress');
            return true;
        } catch (error) {
            console.error('Error importing progress:', error);
            return false;
        }
    }
}

// Export for use in other modules
window.DataLoader = DataLoader;