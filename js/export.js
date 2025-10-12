/**
 * Export Module
 * Handles exporting assessment data in various formats
 */

class ExportManager {
    constructor(dataLoader, dashboardManager) {
        this.dataLoader = dataLoader;
        this.dashboardManager = dashboardManager;
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners for export functionality
     */
    initializeEventListeners() {
        const exportButton = document.getElementById('exportData');
        const saveButton = document.getElementById('saveProgress');
        const loadButton = document.getElementById('loadProgress');
        const fileInput = document.getElementById('progressFile');

        if (exportButton) {
            exportButton.addEventListener('click', () => this.handleExport());
        }

        if (saveButton) {
            saveButton.addEventListener('click', () => this.saveProgress());
        }

        if (loadButton) {
            loadButton.addEventListener('click', () => fileInput?.click());
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleProgressLoad(e));
        }
    }

    /**
     * Handle export based on selected format and options
     */
    handleExport() {
        const selectedFormat = document.querySelector('input[name="exportFormat"]:checked')?.value || 'json';
        const options = this.getExportOptions();

        switch (selectedFormat) {
            case 'json':
                this.exportJSON(options);
                break;
            case 'csv':
                this.exportCSV(options);
                break;
            case 'html':
                this.exportHTML(options);
                break;
            default:
                console.error('Unknown export format:', selectedFormat);
        }
    }

    /**
     * Get export options from form
     */
    getExportOptions() {
        return {
            includeComments: document.getElementById('includeComments')?.checked !== false,
            includeLinks: document.getElementById('includeLinks')?.checked !== false,
            includeOnlyReviewed: document.getElementById('includeOnlyReviewed')?.checked === true
        };
    }

    /**
     * Export data as JSON
     */
    exportJSON(options) {
        const exportData = this.dataLoader.exportData(options);
        
        // Add compliance report if dashboard manager is available
        if (this.dashboardManager) {
            exportData.complianceReport = this.dashboardManager.generateComplianceReport();
        }

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        this.downloadFile(blob, `alz-assessment-${this.getTimestamp()}.json`);
    }

    /**
     * Export data as CSV
     */
    exportCSV(options) {
        const exportData = this.dataLoader.exportData(options);
        const csvContent = this.convertToCSV(exportData.items, options);

        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;'
        });

        this.downloadFile(blob, `alz-assessment-${this.getTimestamp()}.csv`);
    }

    /**
     * Convert data to CSV format
     */
    convertToCSV(items, options) {
        if (!items || items.length === 0) {
            return 'No data to export';
        }

        // Define CSV headers
        const headers = [
            'ID',
            'Category',
            'Subcategory',
            'Text',
            'Severity',
            'WAF',
            'Service',
            'Status'
        ];

        if (options.includeComments) {
            headers.push('Comment', 'Reviewed At', 'Reviewed By');
        }

        if (options.includeLinks) {
            headers.push('More Info Link', 'Training Link');
        }

        // Create CSV content
        const csvRows = [headers.join(',')];

        items.forEach(item => {
            const row = [
                this.escapeCsvValue(item.id),
                this.escapeCsvValue(item.category),
                this.escapeCsvValue(item.subcategory),
                this.escapeCsvValue(item.text),
                this.escapeCsvValue(item.severity),
                this.escapeCsvValue(item.waf),
                this.escapeCsvValue(item.service),
                this.escapeCsvValue(item.status)
            ];

            if (options.includeComments) {
                row.push(
                    this.escapeCsvValue(item.comment || ''),
                    this.escapeCsvValue(item.reviewedAt || ''),
                    this.escapeCsvValue(item.reviewedBy || '')
                );
            }

            if (options.includeLinks) {
                row.push(
                    this.escapeCsvValue(item.link || ''),
                    this.escapeCsvValue(item.training || '')
                );
            }

            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    /**
     * Escape CSV values to handle commas, quotes, and line breaks
     */
    escapeCsvValue(value) {
        if (value === null || value === undefined) {
            return '';
        }

        const stringValue = String(value);
        
        // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return '"' + stringValue.replace(/"/g, '""') + '"';
        }
        
        return stringValue;
    }

    /**
     * Export data as HTML report
     */
    exportHTML(options) {
        const exportData = this.dataLoader.exportData(options);
        const complianceReport = this.dashboardManager?.generateComplianceReport();
        
        const htmlContent = this.generateHTMLReport(exportData, complianceReport, options);

        const blob = new Blob([htmlContent], {
            type: 'text/html;charset=utf-8;'
        });

        this.downloadFile(blob, `alz-assessment-report-${this.getTimestamp()}.html`);
    }

    /**
     * Generate HTML report content
     */
    generateHTMLReport(exportData, complianceReport, options) {
        const stats = exportData.statistics;
        const items = exportData.items;

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Azure Landing Zone Assessment Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #0078d4;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #0078d4;
            margin-bottom: 10px;
        }
        .header .subtitle {
            color: #6c757d;
            font-size: 16px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #0078d4;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #0078d4;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #6c757d;
            font-size: 14px;
            text-transform: uppercase;
        }
        .compliance-score {
            background: linear-gradient(135deg, #0078d4, #106ebe);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 40px;
        }
        .score-number {
            font-size: 3em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .score-grade {
            font-size: 1.5em;
            margin-bottom: 10px;
        }
        .recommendations {
            margin-bottom: 40px;
        }
        .recommendation {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .recommendation.critical {
            background-color: #f8d7da;
            border-color: #f5c6cb;
        }
        .recommendation.high {
            background-color: #fff3cd;
            border-color: #ffeaa7;
        }
        .recommendation.medium {
            background-color: #d1ecf1;
            border-color: #bee5eb;
        }
        .items-section {
            margin-top: 40px;
        }
        .item {
            background-color: #ffffff;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }
        .item-id {
            font-weight: bold;
            color: #0078d4;
            font-size: 16px;
        }
        .item-category {
            color: #6c757d;
            font-size: 14px;
            margin: 5px 0;
        }
        .item-text {
            margin: 15px 0;
            line-height: 1.6;
        }
        .item-meta {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            margin: 15px 0;
        }
        .badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
        }
        .severity-high { background-color: #f8d7da; color: #721c24; }
        .severity-medium { background-color: #fff3cd; color: #856404; }
        .severity-low { background-color: #d4edda; color: #155724; }
        .status-compliant { background-color: #d4edda; color: #155724; }
        .status-non-compliant { background-color: #f8d7da; color: #721c24; }
        .status-not-applicable { background-color: #e2e3e5; color: #383d41; }
        .status-not-reviewed { background-color: #f8f9fa; color: #6c757d; }
        .comment {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin-top: 15px;
            font-style: italic;
        }
        .links {
            margin-top: 15px;
        }
        .links a {
            color: #0078d4;
            text-decoration: none;
            margin-right: 15px;
        }
        .links a:hover {
            text-decoration: underline;
        }
        @media print {
            body { background-color: white; }
            .container { box-shadow: none; }
            .item { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Azure Landing Zone Assessment Report</h1>
            <div class="subtitle">
                Generated on ${new Date().toLocaleString()}<br>
                Total Items: ${stats.total} | Reviewed: ${stats.reviewed} | Completion: ${stats.completionPercentage}%
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${stats.total}</div>
                <div class="stat-label">Total Items</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.reviewed}</div>
                <div class="stat-label">Reviewed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.compliant}</div>
                <div class="stat-label">Compliant</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.nonCompliant}</div>
                <div class="stat-label">Non-Compliant</div>
            </div>
        </div>

        ${complianceReport ? `
        <div class="compliance-score">
            <div class="score-number">${complianceReport.overview.score}%</div>
            <div class="score-grade">${complianceReport.overview.grade}</div>
            <div>${complianceReport.overview.description}</div>
        </div>

        ${complianceReport.recommendations.length > 0 ? `
        <div class="recommendations">
            <h2>Recommendations</h2>
            ${complianceReport.recommendations.map(rec => `
                <div class="recommendation ${rec.priority.toLowerCase()}">
                    <h3>${rec.title}</h3>
                    <p>${rec.description}</p>
                    <ul>
                        ${rec.actionItems.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
        ` : ''}
        ` : ''}

        <div class="items-section">
            <h2>Assessment Items</h2>
            ${items.map(item => `
                <div class="item">
                    <div class="item-header">
                        <div>
                            <div class="item-id">${item.id}</div>
                            <div class="item-category">${item.category} > ${item.subcategory}</div>
                        </div>
                    </div>
                    
                    <div class="item-text">${item.text}</div>
                    
                    <div class="item-meta">
                        <span class="badge severity-${item.severity.toLowerCase()}">${item.severity}</span>
                        <span class="badge status-${item.status.toLowerCase().replace(' ', '-')}">${item.status}</span>
                        <span class="badge">${item.waf}</span>
                        <span class="badge">${item.service}</span>
                    </div>

                    ${options.includeComments && item.comment ? `
                        <div class="comment">
                            <strong>Comment:</strong> ${item.comment}
                        </div>
                    ` : ''}

                    ${options.includeLinks && (item.link || item.training) ? `
                        <div class="links">
                            ${item.link ? `<a href="${item.link}" target="_blank">📖 More Info</a>` : ''}
                            ${item.training ? `<a href="${item.training}" target="_blank">🎓 Training</a>` : ''}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * Save current assessment progress to local file
     */
    saveProgress() {
        const progressData = {
            timestamp: new Date().toISOString(),
            checklist: this.dataLoader.getCurrentChecklist(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(progressData, null, 2)], {
            type: 'application/json'
        });

        this.downloadFile(blob, `alz-assessment-progress-${this.getTimestamp()}.json`);
    }

    /**
     * Handle progress file loading
     */
    handleProgressLoad(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const progressData = JSON.parse(e.target.result);
                
                if (this.validateProgressData(progressData)) {
                    const success = this.dataLoader.importProgress(progressData.checklist);
                    
                    if (success) {
                        // Refresh the assessment interface
                        if (window.assessmentManager) {
                            window.assessmentManager.renderAssessmentItems();
                        }
                        
                        // Update dashboard
                        if (this.dashboardManager) {
                            this.dashboardManager.updateCharts();
                        }
                        
                        this.showNotification('Progress loaded successfully!', 'success');
                    } else {
                        this.showNotification('Failed to load progress data.', 'error');
                    }
                } else {
                    this.showNotification('Invalid progress file format.', 'error');
                }
            } catch (error) {
                console.error('Error loading progress:', error);
                this.showNotification('Error reading progress file.', 'error');
            }
        };
        
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    /**
     * Validate progress data structure
     */
    validateProgressData(data) {
        return data && 
               data.checklist && 
               data.checklist.items && 
               Array.isArray(data.checklist.items) &&
               data.timestamp;
    }

    /**
     * Download file to user's device
     */
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        this.showNotification(`${filename} downloaded successfully!`, 'success');
    }

    /**
     * Get formatted timestamp for filenames
     */
    getTimestamp() {
        const now = new Date();
        return now.toISOString().slice(0, 19).replace(/[:.]/g, '-');
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '4px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Add to page
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    /**
     * Generate shareable assessment summary
     */
    generateShareableSummary() {
        const stats = this.dataLoader.getStatistics();
        const complianceReport = this.dashboardManager?.generateComplianceReport();
        
        const summary = {
            assessmentDate: new Date().toLocaleDateString(),
            totalItems: stats.total,
            reviewedItems: stats.reviewed,
            completionPercentage: stats.completionPercentage,
            complianceScore: complianceReport?.overview.score || 0,
            complianceGrade: complianceReport?.overview.grade || 'Not Assessed',
            criticalIssues: stats.nonCompliant,
            topRecommendations: complianceReport?.recommendations.slice(0, 3) || []
        };

        return summary;
    }

    /**
     * Export summary for executive reporting
     */
    exportExecutiveSummary() {
        const summary = this.generateShareableSummary();
        
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Azure Landing Zone Assessment - Executive Summary</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .score-card { background: linear-gradient(135deg, #0078d4, #106ebe); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
        .score-number { font-size: 4em; font-weight: bold; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-number { font-size: 2em; font-weight: bold; color: #0078d4; }
        .recommendations { background: #fff3cd; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Azure Landing Zone Assessment</h1>
        <h2>Executive Summary</h2>
        <p>Assessment Date: ${summary.assessmentDate}</p>
    </div>
    
    <div class="score-card">
        <div class="score-number">${summary.complianceScore}%</div>
        <div>Compliance Score</div>
        <div>${summary.complianceGrade}</div>
    </div>
    
    <div class="metrics">
        <div class="metric">
            <div class="metric-number">${summary.totalItems}</div>
            <div>Total Items</div>
        </div>
        <div class="metric">
            <div class="metric-number">${summary.reviewedItems}</div>
            <div>Items Reviewed</div>
        </div>
        <div class="metric">
            <div class="metric-number">${summary.completionPercentage}%</div>
            <div>Assessment Complete</div>
        </div>
        <div class="metric">
            <div class="metric-number">${summary.criticalIssues}</div>
            <div>Issues Found</div>
        </div>
    </div>
    
    <div class="recommendations">
        <h3>Top Recommendations</h3>
        <ul>
            ${summary.topRecommendations.map(rec => `<li><strong>${rec.title}:</strong> ${rec.description}</li>`).join('')}
        </ul>
    </div>
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        this.downloadFile(blob, `alz-executive-summary-${this.getTimestamp()}.html`);
    }
}

// Export for use in other modules
window.ExportManager = ExportManager;