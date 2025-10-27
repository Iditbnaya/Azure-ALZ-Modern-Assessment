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
        const saveAsButton = document.getElementById('saveAsProgress');
        const loadButton = document.getElementById('loadProgress');
        const fileInput = document.getElementById('progressFile');
        const templateFormatCheckbox = document.getElementById('templateFormat');

        if (exportButton) {
            exportButton.addEventListener('click', () => this.handleExport());
        }

        if (saveButton) {
            saveButton.addEventListener('click', () => this.handleSave());
        }

        if (saveAsButton) {
            saveAsButton.addEventListener('click', () => this.handleSaveAs());
        }

        if (loadButton) {
            loadButton.addEventListener('click', () => fileInput?.click());
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleProgressLoad(e));
        }

        if (templateFormatCheckbox) {
            templateFormatCheckbox.addEventListener('change', () => this.handleTemplateFormatChange());
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
            case 'excel':
                this.exportExcel(options);
                break;
            case 'html':
                this.exportHTML(options);
                break;
            case 'powerpoint':
                this.exportPowerPoint(options);
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
            includeOnlyReviewed: document.getElementById('includeOnlyReviewed')?.checked === true,
            templateFormat: document.getElementById('templateFormat')?.checked === true
        };
    }

    /**
     * Export data as JSON
     */
    exportJSON(options) {
        let exportData;
        
        if (options.templateFormat) {
            // Export in exact template format (checklist.json structure)
            exportData = this.generateTemplateFormatData(options);
        } else {
            // Export in enhanced format with metadata and statistics
            exportData = this.dataLoader.exportData(options);
            
            // Add compliance report if dashboard manager is available
            if (this.dashboardManager) {
                exportData.complianceReport = this.dashboardManager.generateComplianceReport();
            }
        }

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        const filename = options.templateFormat 
            ? `alz-checklist-template-${this.getTimestamp()}.json`
            : `alz-assessment-${this.getTimestamp()}.json`;

        this.downloadFile(blob, filename);
    }

    /**
     * Generate data in exact template format (matching checklist.json structure)
     */
    generateTemplateFormatData(options) {
        if (!this.dataLoader.currentChecklist) {
            return { items: [] };
        }

        const includeLinks = options.includeLinks !== false;
        const onlyReviewed = options.onlyReviewed === true;

        let items = [...this.dataLoader.currentChecklist.items];

        if (onlyReviewed) {
            items = items.filter(item => item.status !== 'Not verified');
        }

        // Format items exactly like template (checklist.json)
        const templateItems = items.map(item => {
            const templateItem = {
                category: item.category,
                subcategory: item.subcategory,
                text: item.text,
                waf: item.waf,
                service: item.service,
                guid: item.guid,
                id: item.id,
                severity: item.severity
            };

            // Only include links if they exist and option is enabled
            if (includeLinks) {
                if (item.training) {
                    templateItem.training = item.training;
                }
                if (item.link) {
                    templateItem.link = item.link;
                }
            }

            return templateItem;
        });

        return {
            items: templateItems
        };
    }

    /**
     * Handle template format checkbox change
     */
    handleTemplateFormatChange() {
        const templateFormatCheckbox = document.getElementById('templateFormat');
        const includeCommentsCheckbox = document.getElementById('includeComments');
        
        if (templateFormatCheckbox && includeCommentsCheckbox) {
            if (templateFormatCheckbox.checked) {
                // Template format doesn't include comments, so disable and uncheck
                includeCommentsCheckbox.checked = false;
                includeCommentsCheckbox.disabled = true;
                includeCommentsCheckbox.parentElement.style.opacity = '0.5';
            } else {
                // Re-enable comments option
                includeCommentsCheckbox.disabled = false;
                includeCommentsCheckbox.checked = true;
                includeCommentsCheckbox.parentElement.style.opacity = '1';
            }
        }
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
     * Convert data to CSV format - Custom column order
     */
    convertToCSV(items, options) {
        if (!items || items.length === 0) {
            return 'No data to export';
        }

        // Define CSV headers - Custom order
        // Order: id, design area, sub area, waf pillar, checklist item, description, severity, status, comment, more info, training, graph, guid
        const headers = [
            'id',
            'design area',
            'sub area',
            'waf pillar',
            'checklist item',
            'description',
            'severity',
            'status'
        ];

        if (!options.templateFormat && options.includeComments) {
            headers.push('comment');
        }

        if (options.includeLinks) {
            headers.push('more info', 'training');
        }

        headers.push('graph', 'guid');

        // Create CSV content
        const csvRows = [headers.join(',')];

        items.forEach(item => {
            const row = [
                this.escapeCsvValue(item.id),
                this.escapeCsvValue(item.category),
                this.escapeCsvValue(item.subcategory),
                this.escapeCsvValue(item.waf),
                this.escapeCsvValue(item.text),
                this.escapeCsvValue(item.service),
                this.escapeCsvValue(item.severity),
                this.escapeCsvValue(item.status || 'Not Verified')
            ];

            if (!options.templateFormat && options.includeComments) {
                row.push(this.escapeCsvValue(item.comment || ''));
            }

            if (options.includeLinks) {
                row.push(
                    this.escapeCsvValue(item.link || ''),
                    this.escapeCsvValue(item.training || '')
                );
            }

            row.push(
                '',  // graph placeholder
                this.escapeCsvValue(item.guid)
            );

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
     * Export data as Excel (.xlsx)
     */
    exportExcel(options) {
        // Check if XLSX library is available
        if (typeof XLSX === 'undefined') {
            this.showNotification('Excel export requires internet connection to load XLSX library', 'error');
            return;
        }

        let exportData;
        
        if (options.templateFormat) {
            // Export in template format
            exportData = this.generateTemplateFormatData(options);
            exportData.statistics = null; // No statistics for template format
        } else {
            // Export in full assessment format
            exportData = this.dataLoader.exportData(options);
        }
        
        if (!exportData || !exportData.items || exportData.items.length === 0) {
            this.showNotification('No data to export', 'warning');
            return;
        }

        try {
            // Create workbook
            const workbook = XLSX.utils.book_new();

            // Prepare data for Excel
            const excelData = this.prepareExcelData(exportData.items, options);

            // Create main assessment worksheet
            const worksheet = XLSX.utils.json_to_sheet(excelData.assessmentData);
            
            // Set column widths - Custom order
            // Order: id, design area, sub area, waf pillar, checklist item, description, severity, status, comment, more info, training, graph, guid
            const columnWidths = [
                { wch: 10 },  // id
                { wch: 30 },  // design area
                { wch: 25 },  // sub area
                { wch: 15 },  // waf pillar
                { wch: 60 },  // checklist item
                { wch: 20 },  // description
                { wch: 12 },  // severity
                { wch: 15 }   // status (always included)
            ];

            // Add comments column for assessment format (not template)
            if (!options.templateFormat && options.includeComments) {
                columnWidths.push({ wch: 40 }); // comment
            }

            // Add link and training columns if included
            if (options.includeLinks) {
                columnWidths.push(
                    { wch: 50 },  // more info
                    { wch: 50 }   // training
                );
            }

            // Add graph and guid columns
            columnWidths.push(
                { wch: 10 },  // graph
                { wch: 40 }   // guid
            );

            worksheet['!cols'] = columnWidths;

            // Add the main worksheet
            const sheetName = options.templateFormat ? 'Checklist Template' : 'Assessment';
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

            // Add summary worksheet if we have statistics (not in template format)
            if (exportData.statistics && !options.templateFormat) {
                const summaryData = this.prepareSummaryData(exportData.statistics);
                const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
                summaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
                XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');
            }

            // Write and download
            const filename = options.templateFormat 
                ? `alz-checklist-template-${this.getTimestamp()}.xlsx`
                : `alz-assessment-${this.getTimestamp()}.xlsx`;
            XLSX.writeFile(workbook, filename);
            
            this.showNotification(`${filename} downloaded successfully!`, 'success');

        } catch (error) {
            console.error('Error creating Excel file:', error);
            this.showNotification('Error creating Excel file', 'error');
        }
    }

    /**
     * Prepare data for Excel export - Custom column order
     */
    prepareExcelData(items, options) {
        const assessmentData = items.map(item => {
            // Column order: id, design area, sub area, waf pillar, checklist item, description, severity, status, comment, more info, training, graph, guid
            const excelItem = {
                'id': item.id || '',
                'design area': item.category || '',
                'sub area': item.subcategory || '',
                'waf pillar': item.waf || '',
                'checklist item': item.text || '',
                'description': item.service || '',
                'severity': item.severity || '',
                'status': item.status || 'Not Verified'
            };

            // Add comments for assessment format (not template)
            if (!options.templateFormat && options.includeComments) {
                excelItem['comment'] = item.comment || '';
            }

            // Add link and training columns if included
            if (options.includeLinks) {
                excelItem['more info'] = item.link || '';
                excelItem['training'] = item.training || '';
            }

            // Add graph column (placeholder)
            excelItem['graph'] = '';
            
            // Add guid at the end
            excelItem['guid'] = item.guid || '';

            return excelItem;
        });

        return { assessmentData };
    }

    /**
     * Prepare summary data for Excel
     */
    prepareSummaryData(statistics) {
        return [
            { 'Metric': 'Total Items', 'Value': statistics.total },
            { 'Metric': 'Items Reviewed', 'Value': statistics.reviewed },
            { 'Metric': 'Completion Percentage', 'Value': `${statistics.completionPercentage}%` },
            { 'Metric': 'Fulfilled Items', 'Value': statistics.fulfilled },
            { 'Metric': 'Open Items', 'Value': statistics.open },
            { 'Metric': 'Not required Items', 'Value': statistics.notRequired },
            { 'Metric': 'Not verified Items', 'Value': statistics.notVerified }
        ];
    }

    /**
     * Export data as HTML report
     */
    exportHTML(options) {
        const exportData = this.dataLoader.exportData(options);
        const complianceReport = this.dashboardManager?.generateComplianceReport();
        const openItems = this.dashboardManager?.getOpenItems() || { open: [], notVerified: [], totalOpen: 0 };
        
        const htmlContent = this.generateHTMLReport(exportData, complianceReport, openItems, options);

        const blob = new Blob([htmlContent], {
            type: 'text/html;charset=utf-8;'
        });

        this.downloadFile(blob, `alz-assessment-report-${this.getTimestamp()}.html`);
    }

    /**
     * Generate HTML report content
     */
    generateHTMLReport(exportData, complianceReport, openItems, options) {
        const stats = exportData.statistics;
        const items = exportData.items;

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Azure Landing Zone Assessment Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
        .status-fulfilled { background-color: #d4edda; color: #155724; }
        .status-open { background-color: #f8d7da; color: #721c24; }
        .status-not-required { background-color: #e2e3e5; color: #383d41; }
        .status-not-verified { background-color: #f8f9fa; color: #6c757d; }
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
        
        /* Open Items Section Styles */
        .open-items-section {
            margin: 40px 0;
            background-color: #fff8e1;
            border: 2px solid #ffc107;
            border-radius: 12px;
            padding: 30px;
        }
        .open-items-header {
            text-align: center;
            margin-bottom: 30px;
            color: #d63384;
        }
        .open-items-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .open-summary-card {
            background: linear-gradient(135deg, #dc3545, #c82333);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .open-summary-card.not-reviewed {
            background: linear-gradient(135deg, #6c757d, #545b62);
        }
        .open-summary-number {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .open-items-tabs {
            display: flex;
            margin-bottom: 20px;
            border-bottom: 2px solid #dee2e6;
        }
        .open-tab {
            padding: 12px 20px;
            background-color: #f8f9fa;
            border: none;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            cursor: pointer;
            margin-right: 5px;
            font-weight: 500;
        }
        .open-tab.active {
            background-color: #dc3545;
            color: white;
        }
        .open-tab.not-reviewed.active {
            background-color: #6c757d;
        }
        .open-items-list {
            margin-top: 20px;
        }
        .open-item {
            background-color: white;
            border: 1px solid #dc3545;
            border-left: 4px solid #dc3545;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            transition: box-shadow 0.3s ease;
        }
        .open-item.not-reviewed {
            border-color: #6c757d;
            border-left-color: #6c757d;
        }
        .open-item:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .open-item-severity-high {
            border-left-width: 6px;
            border-left-color: #dc3545 !important;
        }
        .open-item-severity-medium {
            border-left-color: #ffc107 !important;
        }
        .open-item-severity-low {
            border-left-color: #28a745 !important;
        }
        .charts-section {
            margin: 40px 0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        .chart-container {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            height: 400px;
            position: relative;
        }
        .chart-title {
            text-align: center;
            margin-bottom: 20px;
            color: #0078d4;
            font-size: 18px;
            font-weight: 600;
        }
        .chart-container canvas {
            max-width: 100% !important;
            max-height: 350px !important;
            width: auto !important;
            height: auto !important;
        }
        
        @media print {
            body { background-color: white; }
            .container { box-shadow: none; }
            .item { break-inside: avoid; }
        }
        
        @media (max-width: 768px) {
            .charts-section {
                grid-template-columns: 1fr;
            }
            .stats-grid {
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            }
            .open-items-summary {
                grid-template-columns: 1fr;
            }
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
                <div class="stat-number">${stats.fulfilled}</div>
                <div class="stat-label">Fulfilled</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.open}</div>
                <div class="stat-label">Open</div>
            </div>
        </div>

        ${complianceReport ? `
        <div class="compliance-score">
            <div class="score-number">${complianceReport.overview.score}%</div>
            <div class="score-grade">${complianceReport.overview.grade}</div>
            <div>${complianceReport.overview.description}</div>
            
            <!-- Detailed Score Breakdown -->
            <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; font-size: 14px;">
                <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 6px;">
                    <div style="font-weight: bold;">Completion Rate</div>
                    <div>${stats.completionPercentage}%</div>
                </div>
                <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 6px;">
                    <div style="font-weight: bold;">Items Reviewed</div>
                    <div>${stats.reviewed} of ${stats.total}</div>
                </div>
                <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 6px;">
                    <div style="font-weight: bold;">Compliance Rate</div>
                    <div>${stats.reviewed > 0 ? Math.round((stats.fulfilled / stats.reviewed) * 100) : 0}%</div>
                </div>
                <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 6px;">
                    <div style="font-weight: bold;">Open Issues</div>
                    <div style="color: #ffcccc;">${stats.open + stats.notVerified}</div>
                </div>
            </div>
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

        <!-- Visual Charts Section -->
        <div class="charts-section">
            <div class="chart-container">
                <div class="chart-title">Status Distribution</div>
                <div style="position: relative; height: 350px;">
                    <canvas id="statusChart"></canvas>
                </div>
            </div>
            <div class="chart-container">
                <div class="chart-title">Severity Breakdown</div>
                <div style="position: relative; height: 350px;">
                    <canvas id="severityChart"></canvas>
                </div>
            </div>
        </div>

        ${openItems && openItems.totalOpen > 0 ? `
        <!-- Open Items Section -->
        <div class="open-items-section">
            <div class="open-items-header">
                <h2>🚨 Action Required: Open Items (${openItems.totalOpen})</h2>
                <p>The following items require immediate attention to improve your compliance score.</p>
            </div>

            <div class="open-items-summary">
                <div class="open-summary-card">
                    <div class="open-summary-number">${openItems.open.length}</div>
                    <div>Open Items</div>
                    <div style="font-size: 14px; margin-top: 5px;">Requires immediate action</div>
                </div>
                <div class="open-summary-card not-reviewed">
                    <div class="open-summary-number">${openItems.notVerified.length}</div>
                    <div>Not Verified Items</div>
                    <div style="font-size: 14px; margin-top: 5px;">Requires assessment</div>
                </div>
            </div>

            ${openItems.open.length > 0 ? `
            <h3 style="color: #dc3545; margin-top: 30px;">🔴 Open Items (${openItems.open.length})</h3>
            <div class="open-items-list">
                ${openItems.open.map(item => `
                    <div class="open-item open-item-severity-${item.severity.toLowerCase()}">
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

                        ${item.comment ? `
                            <div class="comment">
                                <strong>Comment:</strong> ${item.comment}
                            </div>
                        ` : ''}

                        ${item.link || item.training ? `
                            <div class="links">
                                ${item.link ? `<a href="${item.link}" target="_blank">📖 More Info</a>` : ''}
                                ${item.training ? `<a href="${item.training}" target="_blank">🎓 Training</a>` : ''}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            ` : ''}

            ${openItems.notVerified.length > 0 ? `
            <h3 style="color: #6c757d; margin-top: 30px;">⏳ Not Verified Items (${openItems.notVerified.length})</h3>
            <div class="open-items-list">
                ${openItems.notVerified.map(item => `
                    <div class="open-item not-reviewed open-item-severity-${item.severity.toLowerCase()}">
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

                        ${item.comment ? `
                            <div class="comment">
                                <strong>Comment:</strong> ${item.comment}
                            </div>
                        ` : ''}

                        ${item.link || item.training ? `
                            <div class="links">
                                ${item.link ? `<a href="${item.link}" target="_blank">📖 More Info</a>` : ''}
                                ${item.training ? `<a href="${item.training}" target="_blank">🎓 Training</a>` : ''}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            ` : ''}
        </div>
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

    <script>
        // Initialize charts when the page loads
        document.addEventListener('DOMContentLoaded', function() {
            try {
                // Check if Chart.js is available
                if (typeof Chart === 'undefined') {
                    console.error('Chart.js library not loaded');
                    document.querySelectorAll('.chart-container').forEach(container => {
                        container.innerHTML = '<div style="text-align: center; padding: 50px; color: #6c757d;">Charts require internet connection to load</div>';
                    });
                    return;
                }

                // Status Distribution Chart
                const statusCanvas = document.getElementById('statusChart');
                if (statusCanvas) {
                    const statusCtx = statusCanvas.getContext('2d');
                    new Chart(statusCtx, {
                        type: 'pie',
                        data: {
                            labels: ['Compliant', 'Non-Compliant', 'Not Applicable', 'Not Reviewed'],
                            datasets: [{
                                data: [${stats.compliant}, ${stats.nonCompliant}, ${stats.notApplicable}, ${stats.notReviewed}],
                                backgroundColor: [
                                    '#28a745',  // Green for compliant
                                    '#dc3545',  // Red for non-compliant
                                    '#6c757d',  // Gray for not applicable
                                    '#ffc107'   // Yellow for not reviewed
                                ],
                                borderWidth: 2,
                                borderColor: '#fff'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            aspectRatio: 1,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        padding: 15,
                                        usePointStyle: true
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                                            return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                                        }
                                    }
                                }
                            },
                            layout: {
                                padding: 10
                            }
                        }
                    });
                }

                // Severity Breakdown Chart
                const severityCanvas = document.getElementById('severityChart');
                if (severityCanvas) {
                    const severityCtx = severityCanvas.getContext('2d');
                    const severityData = calculateSeverityBreakdown();
                    new Chart(severityCtx, {
                        type: 'doughnut',
                        data: {
                            labels: ['High Severity', 'Medium Severity', 'Low Severity'],
                            datasets: [{
                                data: [severityData.high, severityData.medium, severityData.low],
                                backgroundColor: [
                                    '#dc3545',  // Red for high
                                    '#ffc107',  // Yellow for medium
                                    '#28a745'   // Green for low
                                ],
                                borderWidth: 2,
                                borderColor: '#fff'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            aspectRatio: 1,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        padding: 15,
                                        usePointStyle: true
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                                            return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                                        }
                                    }
                                }
                            },
                            layout: {
                                padding: 10
                            }
                        }
                    });
                }
            } catch (error) {
                console.error('Error initializing charts:', error);
                document.querySelectorAll('.chart-container').forEach(container => {
                    container.innerHTML = '<div style="text-align: center; padding: 50px; color: #6c757d;">Error loading charts</div>';
                });
            }
        });

        // Calculate severity breakdown from the data
        function calculateSeverityBreakdown() {
            const items = ${JSON.stringify(items)};
            const breakdown = { high: 0, medium: 0, low: 0 };
            
            if (!items || !Array.isArray(items)) {
                return breakdown;
            }
            
            items.forEach(item => {
                if (item && item.severity) {
                    switch(item.severity.toLowerCase()) {
                        case 'high':
                            breakdown.high++;
                            break;
                        case 'medium':
                            breakdown.medium++;
                            break;
                        case 'low':
                            breakdown.low++;
                            break;
                    }
                }
            });
            
            return breakdown;
        }
    </script>
</body>
</html>`;
    }

    /**
     * Handle save - uses app's save functionality
     */
    handleSave() {
        if (window.alzApp) {
            window.alzApp.quickSaveProgress();
        } else {
            // Fallback to old save progress method
            this.saveProgress();
        }
    }

    /**
     * Handle save as - uses app's save as functionality
     */
    handleSaveAs() {
        if (window.alzApp) {
            window.alzApp.saveAsNewFile();
        } else {
            // Fallback to old save progress method
            this.saveProgress();
        }
    }

    /**
     * Save current assessment progress to local file (legacy method)
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

    /**
     * Export assessment as PowerPoint presentation
     */
    async exportPowerPoint(options) {
        try {
            // Check for PptxGenJS library - it can be available as PptxGenJS or pptxgen
            const PptxGen = window.PptxGenJS || window.pptxgen || (typeof PptxGenJS !== 'undefined' ? PptxGenJS : null) || (typeof pptxgen !== 'undefined' ? pptxgen : null);
            
            if (!PptxGen) {
                console.error('PptxGenJS library not found.');
                console.log('Available global objects:', Object.keys(window).filter(k => k.toLowerCase().includes('pptx')));
                this.showNotification('PowerPoint library not loaded. Please clear cache and refresh the page (Ctrl+Shift+R).', 'error');
                return;
            }

            const stats = this.dataLoader.getStatistics();
            const checklist = this.dataLoader.getCurrentChecklist();

            // Validate data before proceeding
            if (!checklist || !checklist.items || checklist.items.length === 0) {
                this.showNotification('No assessment data available. Please load or upload an assessment first.', 'error');
                return;
            }

            if (!stats || stats.total === 0) {
                this.showNotification('No assessment statistics available. Please complete at least one assessment item.', 'error');
                return;
            }

            this.showNotification('Generating PowerPoint presentation...', 'info');

            const pptx = new PptxGen();

            // Set presentation properties
            pptx.author = 'Azure Assessment Tool';
            pptx.company = 'Microsoft Azure';
            pptx.title = 'Azure Landing Zone Assessment Report';
            pptx.subject = 'Assessment Results';
            
            // Define colors matching Azure theme
            const colors = {
                primary: '0078D4',
                success: '107C10',
                danger: 'D13438',
                warning: 'F7630C',
                dark: '323130',
                light: 'F8F9FA'
            };

            // Slide 1: Title Slide
            const titleSlide = pptx.addSlide();
            titleSlide.background = { color: colors.primary };
            
            titleSlide.addText('Azure Landing Zone', {
                x: 1, y: 2, w: 8, h: 1,
                fontSize: 44,
                bold: true,
                color: 'FFFFFF',
                align: 'center'
            });
            titleSlide.addText('Assessment Report', {
                x: 1, y: 3, w: 8, h: 0.8,
                fontSize: 36,
                color: 'FFFFFF',
                align: 'center'
            });
            titleSlide.addText(new Date().toLocaleDateString(), {
                x: 1, y: 5, w: 8, h: 0.5,
                fontSize: 18,
                color: 'FFFFFF',
                align: 'center'
            });

            // Slide 2: Executive Summary
            const summarySlide = pptx.addSlide();
            summarySlide.addText('Executive Summary', {
                x: 0.5, y: 0.3, w: 9, h: 0.6,
                fontSize: 32,
                bold: true,
                color: colors.primary
            });

            const complianceScore = stats.total > 0 ? 
                Math.round((stats.fulfilled / stats.total) * 100) : 0;
            const reviewProgress = stats.total > 0 ? 
                Math.round((stats.reviewed / stats.total) * 100) : 0;

            summarySlide.addText([
                { text: 'Overall Compliance Score: ', options: { fontSize: 18, color: colors.dark } },
                { text: `${complianceScore}%`, options: { fontSize: 24, bold: true, color: colors.success } }
            ], { x: 1, y: 1.2, w: 8, h: 0.5 });

            summarySlide.addText([
                { text: 'Assessment Progress: ', options: { fontSize: 18, color: colors.dark } },
                { text: `${reviewProgress}%`, options: { fontSize: 24, bold: true, color: colors.primary } }
            ], { x: 1, y: 1.8, w: 8, h: 0.5 });

            // Add summary metrics table
            const summaryRows = [
                ['Metric', 'Count', 'Percentage'],
                ['Total Items', String(stats.total || 0), '100%'],
                ['Fulfilled', String(stats.fulfilled || 0), `${Math.round(((stats.fulfilled || 0) / (stats.total || 1)) * 100)}%`],
                ['Open Issues', String(stats.open || 0), `${Math.round(((stats.open || 0) / (stats.total || 1)) * 100)}%`],
                ['Not Required', String(stats.notRequired || 0), `${Math.round(((stats.notRequired || 0) / (stats.total || 1)) * 100)}%`],
                ['Not Verified', String(stats.notVerified || 0), `${Math.round(((stats.notVerified || 0) / (stats.total || 1)) * 100)}%`]
            ];

            summarySlide.addTable(summaryRows, {
                x: 1, y: 2.8, w: 8, h: 2.5,
                fontSize: 14,
                border: { pt: 1, color: colors.dark },
                fill: { color: colors.light },
                color: colors.dark,
                colW: [3, 2.5, 2.5],
                rowH: 0.4,
                valign: 'middle',
                align: 'center',
                bold: true
            });

            // Slide 3: Category Breakdown
            const categorySlide = pptx.addSlide();
            categorySlide.addText('Category Status Breakdown', {
                x: 0.5, y: 0.3, w: 9, h: 0.6,
                fontSize: 32,
                bold: true,
                color: colors.primary
            });

            // Calculate category statistics
            const categoryStats = this.calculateCategoryStats();
            const categoryRows = [
                ['Category', 'Not Verified', 'Open', 'Fulfilled', 'Total', 'Progress']
            ];

            Object.keys(categoryStats).sort().forEach(category => {
                const stats = categoryStats[category];
                const progress = (stats.total || 0) > 0 ? 
                    Math.round((((stats.fulfilled || 0) + (stats.notRequired || 0)) / stats.total) * 100) : 0;
                categoryRows.push([
                    category,
                    String(stats.notVerified || 0),
                    String(stats.open || 0),
                    String(stats.fulfilled || 0),
                    String(stats.total || 0),
                    `${progress}%`
                ]);
            });

            categorySlide.addTable(categoryRows, {
                x: 0.3, y: 1, w: 9.4, h: 4.5,
                fontSize: 11,
                border: { pt: 1, color: colors.dark },
                fill: { color: colors.light },
                color: colors.dark,
                colW: [2.5, 1.5, 1.2, 1.5, 1.2, 1.5],
                rowH: 0.35,
                valign: 'middle',
                align: 'center'
            });

            // Slide 4: Top Priority Recommendations (one high priority item per category)
            const topRecommendations = this.getTopPriorityRecommendations(checklist);
            if (topRecommendations.length > 0) {
                const recoSlide = pptx.addSlide();
                recoSlide.addText('🎯 Top Priority Recommendations', {
                    x: 0.5, y: 0.3, w: 9, h: 0.6,
                    fontSize: 32,
                    bold: true,
                    color: colors.danger
                });

                const recoRows = [
                    ['Category', 'Critical Recommendation', 'Priority']
                ];

                topRecommendations.forEach(item => {
                    recoRows.push([
                        item.category || 'General',
                        item.text.length > 70 ? item.text.substring(0, 67) + '...' : item.text,
                        item.severity || 'High'
                    ]);
                });

                recoSlide.addTable(recoRows, {
                    x: 0.3, y: 1, w: 9.4, h: 4.8,
                    fontSize: 10,
                    border: { pt: 1, color: colors.danger },
                    fill: { color: 'FFF5F5' },
                    color: colors.dark,
                    colW: [2, 6.2, 1.2],
                    rowH: 0.6,
                    valign: 'top',
                    align: 'left'
                });
            }

            // Slide 5: What's Going Well (fulfilled high-priority items)
            const successItems = this.getWhatIsGoingWell(checklist);
            if (successItems.length > 0) {
                const successSlide = pptx.addSlide();
                successSlide.addText('✅ What\'s Going Well', {
                    x: 0.5, y: 0.3, w: 9, h: 0.6,
                    fontSize: 32,
                    bold: true,
                    color: colors.success
                });

                successSlide.addText('Key Azure Landing Zone best practices successfully implemented:', {
                    x: 0.5, y: 1, w: 9, h: 0.4,
                    fontSize: 14,
                    color: colors.dark,
                    italic: true
                });

                let yPos = 1.6;
                const itemsToShow = successItems.slice(0, 6); // Limit to 6 items
                itemsToShow.forEach((item, index) => {
                    successSlide.addText(`✓ ${item.text}`, {
                        x: 1, y: yPos, w: 8.5, h: 0.6,
                        fontSize: 13,
                        color: colors.dark,
                        bullet: false
                    });
                    yPos += 0.65;
                });

                if (successItems.length > 6) {
                    successSlide.addText(`...and ${successItems.length - 6} more best practices implemented`, {
                        x: 1, y: 5.5, w: 8, h: 0.3,
                        fontSize: 12,
                        italic: true,
                        color: colors.success
                    });
                }
            }

            // Slide 6: Open Issues (if any)
            if (stats.open > 0 && options.includeComments) {
                const issuesSlide = pptx.addSlide();
                issuesSlide.addText('Open Issues Requiring Attention', {
                    x: 0.5, y: 0.3, w: 9, h: 0.6,
                    fontSize: 32,
                    bold: true,
                    color: colors.danger
                });

                const openItems = checklist.items.filter(item => item.status === 'Open');
                const topIssues = openItems.slice(0, 10); // Show top 10

                const issueRows = [
                    ['Category', 'Recommendation', 'Severity']
                ];

                topIssues.forEach(item => {
                    issueRows.push([
                        item.category || 'N/A',
                        item.text.length > 60 ? item.text.substring(0, 57) + '...' : item.text,
                        item.severity || 'Medium'
                    ]);
                });

                issuesSlide.addTable(issueRows, {
                    x: 0.3, y: 1, w: 9.4, h: 4.5,
                    fontSize: 10,
                    border: { pt: 1, color: colors.dark },
                    fill: { color: colors.light },
                    color: colors.dark,
                    colW: [1.8, 6.2, 1.4],
                    rowH: 0.4,
                    valign: 'top',
                    align: 'left'
                });

                if (openItems.length > 10) {
                    issuesSlide.addText(`Showing 10 of ${openItems.length} open issues`, {
                        x: 0.5, y: 5.8, w: 9, h: 0.3,
                        fontSize: 12,
                        italic: true,
                        color: colors.dark
                    });
                }
            }

            // Slide 5: Compliance by Severity
            const severitySlide = pptx.addSlide();
            severitySlide.addText('Compliance by Severity', {
                x: 0.5, y: 0.3, w: 9, h: 0.6,
                fontSize: 32,
                bold: true,
                color: colors.primary
            });

            const severityStats = this.calculateSeverityStats();
            const severityRows = [
                ['Severity', 'Total', 'Fulfilled', 'Open', 'Compliance %']
            ];

            ['High', 'Medium', 'Low'].forEach(severity => {
                if (severityStats[severity]) {
                    const s = severityStats[severity];
                    const compliance = (s.total || 0) > 0 ? Math.round(((s.fulfilled || 0) / s.total) * 100) : 0;
                    severityRows.push([
                        severity,
                        String(s.total || 0),
                        String(s.fulfilled || 0),
                        String(s.open || 0),
                        `${compliance}%`
                    ]);
                }
            });

            severitySlide.addTable(severityRows, {
                x: 2, y: 1.5, w: 6, h: 2.5,
                fontSize: 16,
                border: { pt: 1, color: colors.dark },
                fill: { color: colors.light },
                color: colors.dark,
                colW: [1.5, 1.1, 1.3, 1.1, 1],
                rowH: 0.6,
                valign: 'middle',
                align: 'center',
                bold: true
            });

            // Final Slide: Next Steps
            const nextStepsSlide = pptx.addSlide();
            nextStepsSlide.addText('📋 Next Steps', {
                x: 0.5, y: 0.3, w: 9, h: 0.6,
                fontSize: 32,
                bold: true,
                color: colors.primary
            });

            const recommendations = [
                { text: 'Address all High severity open items as priority', icon: '⚠️' },
                { text: 'Review and verify all "Not Verified" items', icon: '🔍' },
                { text: 'Document remediation plans for open issues', icon: '📝' },
                { text: 'Schedule regular compliance reviews', icon: '📅' },
                { text: 'Implement continuous monitoring and automation', icon: '📊' },
                { text: 'Maintain and expand successful practices', icon: '✅' }
            ];

            recommendations.forEach((rec, index) => {
                nextStepsSlide.addText(`${rec.icon} ${rec.text}`, {
                    x: 1, y: 1.3 + (index * 0.65), w: 8, h: 0.6,
                    fontSize: 16,
                    color: colors.dark,
                    bullet: true
                });
            });

            // Final Slide: Azure Landing Zone Documentation & Resources
            const referencesSlide = pptx.addSlide();
            referencesSlide.addText('📚 Azure Landing Zone Resources', {
                x: 0.5, y: 0.3, w: 9, h: 0.6,
                fontSize: 32,
                bold: true,
                color: colors.primary
            });

            // Key documentation links
            const references = [
                {
                    title: 'Azure Landing Zone Documentation',
                    url: 'aka.ms/alz',
                    description: 'Official Microsoft documentation and implementation guidance'
                },
                {
                    title: 'Azure Landing Zone Accelerator',
                    url: 'aka.ms/alz/accelerator',
                    description: 'Portal-based deployment experience'
                },
                {
                    title: 'Well-Architected Framework',
                    url: 'aka.ms/waf',
                    description: 'Azure architecture best practices and design principles'
                },
                {
                    title: 'Cloud Adoption Framework',
                    url: 'aka.ms/caf',
                    description: 'End-to-end cloud adoption guidance'
                },
                {
                    title: 'Azure Review Checklists',
                    url: 'github.com/Azure/review-checklists',
                    description: 'Source repository for assessment checklists'
                }
            ];

            let yPosition = 1.2;
            references.forEach((ref, index) => {
                // Title and URL
                referencesSlide.addText([
                    { text: `${index + 1}. ${ref.title}`, options: { fontSize: 14, bold: true, color: colors.dark } },
                    { text: ` - ${ref.url}`, options: { fontSize: 12, color: colors.primary, hyperlink: { url: `https://${ref.url}` } } }
                ], {
                    x: 0.7, y: yPosition, w: 8.6, h: 0.35,
                    valign: 'top'
                });
                
                // Description
                referencesSlide.addText(ref.description, {
                    x: 1, y: yPosition + 0.35, w: 8.3, h: 0.25,
                    fontSize: 11,
                    color: '666666',
                    italic: true
                });
                
                yPosition += 0.75;
            });

            // Footer
            referencesSlide.addText('For more information, visit Microsoft Learn and Azure Architecture Center', {
                x: 0.5, y: 5.5, w: 9, h: 0.4,
                fontSize: 11,
                color: colors.dark,
                align: 'center',
                italic: true
            });

            // Save the presentation
            const filename = `azure-alz-assessment-${this.getTimestamp()}.pptx`;
            await pptx.writeFile({ fileName: filename });

            this.showNotification(`PowerPoint presentation "${filename}" downloaded successfully!`, 'success');

        } catch (error) {
            console.error('Failed to generate PowerPoint:', error);
            this.showNotification(`Failed to generate PowerPoint: ${error.message}`, 'error');
        }
    }

    /**
     * Calculate category statistics for PowerPoint
     */
    calculateCategoryStats() {
        const checklist = this.dataLoader.getCurrentChecklist();
        if (!checklist) return {};

        const categoryStats = {};
        
        checklist.items.forEach(item => {
            const category = item.category || 'Unknown';
            
            if (!categoryStats[category]) {
                categoryStats[category] = {
                    notVerified: 0,
                    open: 0,
                    fulfilled: 0,
                    notRequired: 0,
                    total: 0
                };
            }
            
            categoryStats[category].total++;
            
            const status = item.status || 'Not verified';
            switch (status) {
                case 'Not verified':
                    categoryStats[category].notVerified++;
                    break;
                case 'Open':
                    categoryStats[category].open++;
                    break;
                case 'Fulfilled':
                    categoryStats[category].fulfilled++;
                    break;
                case 'Not required':
                    categoryStats[category].notRequired++;
                    break;
            }
        });

        return categoryStats;
    }

    /**
     * Calculate severity statistics for PowerPoint
     */
    calculateSeverityStats() {
        const checklist = this.dataLoader.getCurrentChecklist();
        if (!checklist) return {};

        const severityStats = {};
        
        checklist.items.forEach(item => {
            const severity = item.severity || 'Medium';
            
            if (!severityStats[severity]) {
                severityStats[severity] = {
                    total: 0,
                    fulfilled: 0,
                    open: 0,
                    notRequired: 0,
                    notVerified: 0
                };
            }
            
            severityStats[severity].total++;
            
            const status = item.status || 'Not verified';
            switch (status) {
                case 'Fulfilled':
                    severityStats[severity].fulfilled++;
                    break;
                case 'Open':
                    severityStats[severity].open++;
                    break;
                case 'Not required':
                    severityStats[severity].notRequired++;
                    break;
                default:
                    severityStats[severity].notVerified++;
            }
        });

        return severityStats;
    }

    /**
     * Get top priority recommendations - one high-priority open item per category
     */
    getTopPriorityRecommendations(checklist) {
        if (!checklist || !checklist.items) return [];

        const categoriesMap = new Map();
        
        // Find one high-priority open item per category
        checklist.items.forEach(item => {
            if (item.status === 'Open' && item.severity === 'High') {
                const category = item.category || 'General';
                if (!categoriesMap.has(category)) {
                    categoriesMap.set(category, item);
                }
            }
        });

        // If not enough high priority items, add medium priority
        if (categoriesMap.size < 5) {
            checklist.items.forEach(item => {
                if (item.status === 'Open' && item.severity === 'Medium') {
                    const category = item.category || 'General';
                    if (!categoriesMap.has(category) && categoriesMap.size < 10) {
                        categoriesMap.set(category, item);
                    }
                }
            });
        }

        return Array.from(categoriesMap.values());
    }

    /**
     * Get what's going well - fulfilled high-priority items based on ALZ best practices
     */
    getWhatIsGoingWell(checklist) {
        if (!checklist || !checklist.items) return [];

        // Key ALZ best practices keywords to look for
        const alzBestPractices = [
            'hub and spoke', 'hub-and-spoke', 'network topology',
            'privileged identity', 'pim', 'just-in-time',
            'conditional access', 'mfa', 'multi-factor',
            'private endpoint', 'private link', 'no public',
            'tag', 'tagging', 'resource tag',
            'budget', 'cost management', 'spending',
            'infrastructure as code', 'iac', 'terraform', 'bicep',
            'landing zone', 'subscription', 'management group',
            'azure policy', 'policy assignment',
            'monitoring', 'log analytics', 'diagnostic',
            'backup', 'disaster recovery', 'bcdr',
            'encryption', 'key vault', 'secrets',
            'rbac', 'role-based', 'least privilege',
            'ddos protection', 'firewall', 'nsg',
            'blueprint', 'governance'
        ];

        const successItems = [];

        // Find fulfilled high-priority items that match ALZ best practices
        checklist.items.forEach(item => {
            if (item.status === 'Fulfilled' && (item.severity === 'High' || item.severity === 'Medium')) {
                const itemText = item.text.toLowerCase();
                const itemCategory = (item.category || '').toLowerCase();
                
                // Check if item relates to key ALZ best practices
                const isKeyPractice = alzBestPractices.some(practice => 
                    itemText.includes(practice) || itemCategory.includes(practice)
                );

                if (isKeyPractice) {
                    successItems.push(item);
                }
            }
        });

        // Sort by severity (High first) and limit to most important items
        successItems.sort((a, b) => {
            if (a.severity === 'High' && b.severity !== 'High') return -1;
            if (a.severity !== 'High' && b.severity === 'High') return 1;
            return 0;
        });

        return successItems.slice(0, 12); // Return top 12 items
    }
}

// Export for use in other modules
window.ExportManager = ExportManager;