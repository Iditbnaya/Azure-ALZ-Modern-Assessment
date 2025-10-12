/**
 * Dashboard Module
 * Handles visualization and reporting with Chart.js
 */

class DashboardManager {
    constructor(dataLoader) {
        this.dataLoader = dataLoader;
        this.charts = {};
        this.chartConfigs = this.initializeChartConfigs();
    }

    /**
     * Initialize chart configurations
     */
    initializeChartConfigs() {
        return {
            progress: {
                type: 'doughnut',
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            },
            status: {
                type: 'pie',
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            },
            severity: {
                type: 'bar',
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            },
            category: {
                type: 'horizontalBar',
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            }
        };
    }

    /**
     * Destroy all existing charts to prevent canvas reuse errors
     */
    destroyAllCharts() {
        // Destroy existing chart instances
        Object.keys(this.charts).forEach(chartKey => {
            if (this.charts[chartKey]) {
                try {
                    this.charts[chartKey].destroy();
                } catch (error) {
                    console.warn(`Error destroying chart ${chartKey}:`, error);
                }
                this.charts[chartKey] = null;
            }
        });

        // Clear canvas elements and reset their contexts
        const canvasIds = ['progressChart', 'statusChart', 'severityChart', 'categoryChart'];
        canvasIds.forEach(canvasId => {
            const canvas = document.getElementById(canvasId);
            if (canvas) {
                // Get the canvas context and clear it
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
                
                // Remove any Chart.js specific attributes
                canvas.removeAttribute('data-chartjs-chart-id');
                
                // Reset canvas size to force a clean slate
                const parent = canvas.parentElement;
                if (parent) {
                    const newCanvas = canvas.cloneNode(true);
                    parent.replaceChild(newCanvas, canvas);
                }
            }
        });

        // Clear the charts object completely
        this.charts = {};
    }

    /**
     * Initialize all dashboard charts
     */
    initializeDashboard() {
        this.destroyAllCharts();
        this.createProgressChart();
        this.createStatusChart();
        this.createSeverityChart();
        this.createCategoryChart();
        this.updateStatistics();
    }

    /**
     * Create progress chart (reviewed vs not reviewed)
     */
    createProgressChart() {
        const ctx = document.getElementById('progressChart');
        if (!ctx) return;

        const stats = this.dataLoader.getStatistics();
        
        const data = {
            labels: ['Reviewed', 'Not Reviewed'],
            datasets: [{
                data: [stats.reviewed, stats.notReviewed],
                backgroundColor: [
                    '#28a745', // Green for reviewed
                    '#e9ecef'  // Light gray for not reviewed
                ],
                borderColor: [
                    '#20c997',
                    '#dee2e6'
                ],
                borderWidth: 2
            }]
        };

        this.charts.progress = new Chart(ctx, {
            type: this.chartConfigs.progress.type,
            data: data,
            options: this.chartConfigs.progress.options
        });
    }

    /**
     * Create status distribution chart
     */
    createStatusChart() {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;

        const stats = this.dataLoader.getStatistics();
        
        const data = {
            labels: ['Compliant', 'Non-Compliant', 'Not Applicable', 'Not Reviewed'],
            datasets: [{
                data: [stats.compliant, stats.nonCompliant, stats.notApplicable, stats.notReviewed],
                backgroundColor: [
                    '#28a745', // Green for compliant
                    '#dc3545', // Red for non-compliant
                    '#6c757d', // Gray for not applicable
                    '#e9ecef'  // Light gray for not reviewed
                ],
                borderColor: [
                    '#20c997',
                    '#c82333',
                    '#5a6268',
                    '#dee2e6'
                ],
                borderWidth: 2
            }]
        };

        this.charts.status = new Chart(ctx, {
            type: this.chartConfigs.status.type,
            data: data,
            options: this.chartConfigs.status.options
        });
    }

    /**
     * Create severity distribution chart
     */
    createSeverityChart() {
        const ctx = document.getElementById('severityChart');
        if (!ctx) return;

        const checklist = this.dataLoader.getCurrentChecklist();
        if (!checklist) return;

        const severityCounts = this.calculateSeverityDistribution();
        
        const data = {
            labels: Object.keys(severityCounts),
            datasets: [{
                label: 'Number of Items',
                data: Object.values(severityCounts),
                backgroundColor: [
                    '#dc3545', // Red for High
                    '#fd7e14', // Orange for Medium
                    '#28a745'  // Green for Low
                ],
                borderColor: [
                    '#c82333',
                    '#e55a00',
                    '#20c997'
                ],
                borderWidth: 2
            }]
        };

        if (this.charts.severity) {
            this.charts.severity.destroy();
        }

        this.charts.severity = new Chart(ctx, {
            type: this.chartConfigs.severity.type,
            data: data,
            options: this.chartConfigs.severity.options
        });
    }

    /**
     * Create category breakdown chart
     */
    createCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        const categoryCounts = this.calculateCategoryDistribution();
        
        // Limit to top 10 categories for readability
        const sortedCategories = Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const data = {
            labels: sortedCategories.map(item => this.truncateLabel(item[0], 30)),
            datasets: [{
                label: 'Number of Items',
                data: sortedCategories.map(item => item[1]),
                backgroundColor: '#0078d4',
                borderColor: '#106ebe',
                borderWidth: 1
            }]
        };

        if (this.charts.category) {
            this.charts.category.destroy();
        }

        this.charts.category = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                ...this.chartConfigs.category.options,
                scales: {
                    ...this.chartConfigs.category.options.scales,
                    y: {
                        ...this.chartConfigs.category.options.scales?.y,
                        ticks: {
                            callback: function(value, index, values) {
                                const label = this.getLabelForValue(value);
                                return label.length > 25 ? label.substring(0, 25) + '...' : label;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Calculate severity distribution
     */
    calculateSeverityDistribution() {
        const checklist = this.dataLoader.getCurrentChecklist();
        if (!checklist) return {};

        const severityCounts = {};
        
        checklist.items.forEach(item => {
            const severity = item.severity || 'Unknown';
            severityCounts[severity] = (severityCounts[severity] || 0) + 1;
        });

        // Ensure consistent order
        const orderedSeverities = {};
        ['High', 'Medium', 'Low'].forEach(severity => {
            if (severityCounts[severity]) {
                orderedSeverities[severity] = severityCounts[severity];
            }
        });

        // Add any other severities
        Object.keys(severityCounts).forEach(severity => {
            if (!orderedSeverities[severity]) {
                orderedSeverities[severity] = severityCounts[severity];
            }
        });

        return orderedSeverities;
    }

    /**
     * Calculate category distribution
     */
    calculateCategoryDistribution() {
        const checklist = this.dataLoader.getCurrentChecklist();
        if (!checklist) return {};

        const categoryCounts = {};
        
        checklist.items.forEach(item => {
            const category = item.category || 'Unknown';
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        return categoryCounts;
    }

    /**
     * Update summary statistics
     */
    updateStatistics() {
        const stats = this.dataLoader.getStatistics();

        // Update stat cards
        const totalItems = document.getElementById('totalItems');
        const completedItems = document.getElementById('completedItems');
        const compliantItems = document.getElementById('compliantItems');
        const nonCompliantItems = document.getElementById('nonCompliantItems');

        if (totalItems) totalItems.textContent = stats.total;
        if (completedItems) completedItems.textContent = stats.reviewed;
        if (compliantItems) compliantItems.textContent = stats.compliant;
        if (nonCompliantItems) nonCompliantItems.textContent = stats.nonCompliant;
    }

    /**
     * Update all charts with current data
     */
    updateCharts() {
        this.destroyAllCharts();
        this.createProgressChart();
        this.createStatusChart();
        this.createSeverityChart();
        this.createCategoryChart();
        this.updateStatistics();
    }

    /**
     * Generate compliance score
     */
    calculateComplianceScore() {
        const stats = this.dataLoader.getStatistics();
        
        if (stats.reviewed === 0) {
            return {
                score: 0,
                grade: 'Not Assessed',
                description: 'No items have been reviewed yet.'
            };
        }

        // Calculate compliance percentage (excluding Not Applicable items)
        const applicableItems = stats.compliant + stats.nonCompliant;
        const compliancePercentage = applicableItems > 0 ? (stats.compliant / applicableItems) * 100 : 0;

        let grade, description;
        
        if (compliancePercentage >= 90) {
            grade = 'Excellent';
            description = 'Your implementation follows Azure best practices very well.';
        } else if (compliancePercentage >= 75) {
            grade = 'Good';
            description = 'Your implementation is mostly compliant with some areas for improvement.';
        } else if (compliancePercentage >= 60) {
            grade = 'Fair';
            description = 'Your implementation has several areas that need attention.';
        } else {
            grade = 'Needs Improvement';
            description = 'Your implementation has significant compliance gaps that should be addressed.';
        }

        return {
            score: Math.round(compliancePercentage),
            grade: grade,
            description: description,
            details: {
                totalReviewed: stats.reviewed,
                totalCompliant: stats.compliant,
                totalNonCompliant: stats.nonCompliant,
                totalNotApplicable: stats.notApplicable
            }
        };
    }

    /**
     * Generate detailed compliance report
     */
    generateComplianceReport() {
        const checklist = this.dataLoader.getCurrentChecklist();
        if (!checklist) return null;

        const complianceScore = this.calculateComplianceScore();
        const categoryBreakdown = this.getCategoryComplianceBreakdown();
        const severityBreakdown = this.getSeverityComplianceBreakdown();
        const nonCompliantItems = this.getNonCompliantItems();

        return {
            overview: complianceScore,
            categoryBreakdown: categoryBreakdown,
            severityBreakdown: severityBreakdown,
            nonCompliantItems: nonCompliantItems,
            recommendations: this.generateRecommendations(categoryBreakdown, severityBreakdown),
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Get compliance breakdown by category
     */
    getCategoryComplianceBreakdown() {
        const checklist = this.dataLoader.getCurrentChecklist();
        if (!checklist) return {};

        const categoryStats = {};

        checklist.items.forEach(item => {
            const category = item.category;
            if (!categoryStats[category]) {
                categoryStats[category] = {
                    total: 0,
                    reviewed: 0,
                    compliant: 0,
                    nonCompliant: 0,
                    notApplicable: 0
                };
            }

            categoryStats[category].total++;
            if (item.status !== 'Not Reviewed') {
                categoryStats[category].reviewed++;
                
                switch (item.status) {
                    case 'Compliant':
                        categoryStats[category].compliant++;
                        break;
                    case 'Non-Compliant':
                        categoryStats[category].nonCompliant++;
                        break;
                    case 'Not Applicable':
                        categoryStats[category].notApplicable++;
                        break;
                }
            }
        });

        // Calculate compliance percentages
        Object.keys(categoryStats).forEach(category => {
            const stats = categoryStats[category];
            const applicableItems = stats.compliant + stats.nonCompliant;
            stats.compliancePercentage = applicableItems > 0 ? Math.round((stats.compliant / applicableItems) * 100) : 0;
            stats.reviewPercentage = Math.round((stats.reviewed / stats.total) * 100);
        });

        return categoryStats;
    }

    /**
     * Get compliance breakdown by severity
     */
    getSeverityComplianceBreakdown() {
        const checklist = this.dataLoader.getCurrentChecklist();
        if (!checklist) return {};

        const severityStats = {};

        checklist.items.forEach(item => {
            const severity = item.severity;
            if (!severityStats[severity]) {
                severityStats[severity] = {
                    total: 0,
                    reviewed: 0,
                    compliant: 0,
                    nonCompliant: 0,
                    notApplicable: 0
                };
            }

            severityStats[severity].total++;
            if (item.status !== 'Not Reviewed') {
                severityStats[severity].reviewed++;
                
                switch (item.status) {
                    case 'Compliant':
                        severityStats[severity].compliant++;
                        break;
                    case 'Non-Compliant':
                        severityStats[severity].nonCompliant++;
                        break;
                    case 'Not Applicable':
                        severityStats[severity].notApplicable++;
                        break;
                }
            }
        });

        // Calculate compliance percentages
        Object.keys(severityStats).forEach(severity => {
            const stats = severityStats[severity];
            const applicableItems = stats.compliant + stats.nonCompliant;
            stats.compliancePercentage = applicableItems > 0 ? Math.round((stats.compliant / applicableItems) * 100) : 0;
            stats.reviewPercentage = Math.round((stats.reviewed / stats.total) * 100);
        });

        return severityStats;
    }

    /**
     * Get all non-compliant items
     */
    getNonCompliantItems() {
        const checklist = this.dataLoader.getCurrentChecklist();
        if (!checklist) return [];

        return checklist.items
            .filter(item => item.status === 'Non-Compliant')
            .map(item => ({
                id: item.id,
                category: item.category,
                subcategory: item.subcategory,
                text: item.text,
                severity: item.severity,
                comment: item.comment,
                link: item.link,
                training: item.training
            }));
    }

    /**
     * Generate recommendations based on compliance data
     */
    generateRecommendations(categoryBreakdown, severityBreakdown) {
        const recommendations = [];

        // High severity recommendations
        if (severityBreakdown['High'] && severityBreakdown['High'].nonCompliant > 0) {
            recommendations.push({
                priority: 'Critical',
                title: 'Address High Severity Non-Compliance Issues',
                description: `You have ${severityBreakdown['High'].nonCompliant} high severity items that are non-compliant. These should be your top priority.`,
                actionItems: [
                    'Review all high severity non-compliant items',
                    'Create remediation plans with timelines',
                    'Assign owners for each high severity issue'
                ]
            });
        }

        // Category-specific recommendations
        Object.entries(categoryBreakdown).forEach(([category, stats]) => {
            if (stats.compliancePercentage < 70 && stats.nonCompliant > 0) {
                recommendations.push({
                    priority: 'High',
                    title: `Improve ${category} Compliance`,
                    description: `The ${category} category has a compliance rate of ${stats.compliancePercentage}% which needs improvement.`,
                    actionItems: [
                        `Review all non-compliant items in ${category}`,
                        'Consider engaging subject matter experts',
                        'Prioritize based on business impact'
                    ]
                });
            }
        });

        // Review completion recommendations
        const totalStats = this.dataLoader.getStatistics();
        if (totalStats.completionPercentage < 100) {
            recommendations.push({
                priority: 'Medium',
                title: 'Complete Assessment Review',
                description: `${totalStats.notReviewed} items still need to be reviewed (${100 - totalStats.completionPercentage}% remaining).`,
                actionItems: [
                    'Schedule time to complete the remaining reviews',
                    'Consider involving additional team members',
                    'Focus on high and medium severity items first'
                ]
            });
        }

        return recommendations;
    }

    /**
     * Truncate label text for display
     */
    truncateLabel(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    /**
     * Destroy all charts (cleanup)
     */
    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    /**
     * Export dashboard as image
     */
    async exportDashboardImage() {
        // This would require additional libraries like html2canvas
        // For now, we'll just provide the data structure
        return {
            statistics: this.dataLoader.getStatistics(),
            complianceReport: this.generateComplianceReport(),
            exportedAt: new Date().toISOString()
        };
    }
}

// Export for use in other modules
window.DashboardManager = DashboardManager;