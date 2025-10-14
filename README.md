# 🏗️ ALZ Assessment Tool

[![GitHub Actions](https://github.com/your-username/ALZAssessment/workflows/Update%20Checklists/badge.svg)](https://github.com/your-username/ALZAssessment/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Interactive Azure Landing Zone Assessment Tool with Automated Checklist Updates**

A comprehensive web-based assessment tool that helps organizations evaluate their Azure implementations against Microsoft's best practices and recommendations. Features automated monthly updates from the official Azure review checklists repository.

## ✨ Features

- 🎯 **Multiple Assessment Types**: Azure Landing Zone, AI Landing Zone, AKS, App Service, and more
- 🔄 **Automated Updates**: Monthly sync with official Azure review checklists
- 📊 **Interactive Interface**: User-friendly assessment workflow with progress tracking
- 📁 **File Import/Export**: Upload existing assessments, export to Excel or JSON
- 🌐 **Progressive Web App**: Works offline and can be installed as an app
- 🔒 **Custom Preservation**: Maintains your custom checklists during updates
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🚀 Quick Start

### 1. Repository Setup
```bash
# Clone the repository
git clone https://github.com/your-username/ALZAssessment.git
cd ALZAssessment

# Fork the Azure review checklists repository
# Go to: https://github.com/Azure/review-checklists
# Click "Fork" to create your copy
```

### 2. Enable Automation
```bash
# Push the workflows to your repository
git add .github/
git commit -m "Add automated checklist sync workflows"
git push

# Enable GitHub Actions
# Go to: your-repo → Actions → "I understand my workflows, go ahead and enable them"
```

### 3. Local Development
```bash
# Start the development server
.\serve.ps1                          # Windows PowerShell
# OR
cd web-assessment && python -m http.server 8000  # Cross-platform

# Open in browser
# http://localhost:8000
```

## 📋 Assessment Types

| Assessment Type | Description | Status |
|---|---|---|
| 🏗️ **Azure Landing Zone** | Core Azure foundation best practices | ✅ Available |
| 🤖 **AI Landing Zone** | AI/ML workload specific guidelines | ✅ Available |
| ☸️ **Azure Kubernetes Service** | Container orchestration best practices | ✅ Available |
| 🌐 **App Service** | Web application hosting guidelines | ✅ Available |
| 🖥️ **Azure Virtual Desktop** | Virtual desktop infrastructure | ✅ Available |
| 🔗 **API Management** | API gateway and management | ✅ Available |
| 📦 **Container Registry** | Container image management | ✅ Available |
| 🔧 **Azure Functions** | Serverless computing best practices | ✅ Available |
| 🗄️ **Cosmos DB** | NoSQL database recommendations | ✅ Available |
| 🔒 **Security** | Azure security framework | ✅ Available |

*And many more! See the full list in the assessment tool.*

## 🔄 Automated Updates

### Monthly Automation
The tool automatically updates with the latest Azure best practices:

- **Day 1, 2:00 AM UTC**: Sync your fork with upstream Azure repository
- **Day 1, 3:00 AM UTC**: Update assessment tool with latest checklists
- **Automatic Backup**: Creates timestamped backups before updates
- **Custom Preservation**: Maintains your custom AI Landing Zone checklist

### Manual Updates
Trigger updates anytime via GitHub Actions:
1. Go to **Actions** tab in your repository
2. Select **"Manual Checklist Sync"**
3. Click **"Run workflow"**

## 🎯 Usage Guide

### Starting an Assessment
1. Open the assessment tool
2. Select your assessment type from the dropdown
3. Click "Load Assessment" to begin
4. Work through recommendations systematically

### Assessment Workflow
- **Review**: Read each recommendation carefully
- **Assess**: Mark status as:
  - ✅ **Fulfilled**: Requirement is met
  - ❌ **Open**: Needs attention
  - ⚠️ **Not verified**: Requires investigation
  - ➖ **Not required**: Not applicable
- **Comment**: Add notes and implementation details
- **Export**: Save progress to Excel or JSON

### File Operations
- **Import**: Upload previous assessment files to continue work
- **Export**: Download completed assessments in Excel or JSON format
- **Backup**: Automatic backups created during updates

## 🛠️ Development

### Project Structure
```
ALZAssessment/
├── .github/
│   ├── workflows/              # GitHub Actions automation
│   ├── ISSUE_TEMPLATE/         # Issue templates
│   └── PULL_REQUEST_TEMPLATE.md
├── web-assessment/
│   ├── index.html             # Main application
│   ├── js/
│   │   ├── app.js            # Core application logic
│   │   ├── assessment.js     # Assessment interface
│   │   ├── data-loader.js    # Checklist loading
│   │   ├── dashboard.js      # Progress tracking
│   │   └── export.js         # Export functionality
│   ├── styles/
│   │   └── main.css          # Application styling
│   └── manifest.json         # PWA configuration
├── review-checklists/         # Azure checklists (auto-synced)
├── backups/                   # Automatic backups
└── docs/                      # Documentation
```

### Technologies Used
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Data**: JSON-based checklist format
- **Export**: SheetJS for Excel generation
- **Automation**: GitHub Actions workflows
- **PWA**: Service Worker, Web App Manifest

### Local Development
```bash
# Install development dependencies (optional)
npm install -g http-server

# Start development server
http-server web-assessment -p 8000

# For PowerShell users
.\serve.ps1 -Port 8080
```

## 📚 Documentation

- 📖 **[GitHub Instructions](GITHUB_INSTRUCTIONS.md)** - Comprehensive GitHub best practices
- 🔄 **[Workflow Documentation](.github/workflows/README.md)** - GitHub Actions details
- 🐛 **[Issue Templates](.github/ISSUE_TEMPLATE/)** - Bug reports and feature requests
- 🔀 **[Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md)** - Contribution guidelines

## 🤝 Contributing

We welcome contributions! Please see our [contribution guidelines](GITHUB_INSTRUCTIONS.md#contributing).

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit with descriptive messages: `git commit -m 'Add amazing feature'`
5. Push to your branch: `git push origin feature/amazing-feature`
6. Open a Pull Request using our template

### Development Workflow
- Follow the [code standards](GITHUB_INSTRUCTIONS.md#code-standards)
- Test all assessment types
- Ensure responsive design works
- Add documentation for new features

## 📊 Monitoring & Analytics

### GitHub Actions Status
Monitor automation via the Actions tab:
- ✅ Successful updates shown in green
- ❌ Failed updates trigger notifications
- 📊 Summary issues created with update details

### Usage Analytics
Track assessment completion and export statistics:
- Assessment type popularity
- Completion rates by category
- Export format preferences

## 🔧 Troubleshooting

### Common Issues

#### Checklists Not Loading
```javascript
// Check browser console for errors
console.log('Debug mode enabled');

// Verify file paths
fetch('/review-checklists/checklists/alz_checklist.en.json')
  .then(response => console.log('Status:', response.status))
  .catch(error => console.error('Error:', error));
```

#### GitHub Actions Failing
1. Check workflow logs in Actions tab
2. Verify repository permissions
3. Ensure fork is properly configured
4. Check GitHub token permissions

#### Local Server Issues
```bash
# Check if port is in use
netstat -an | grep 8000

# Try alternative port
python -m http.server 8080
```

### Support Resources
- 📖 [GitHub Instructions](GITHUB_INSTRUCTIONS.md#troubleshooting)
- 🐛 [Report Issues](.github/ISSUE_TEMPLATE/bug_report.md)
- 💡 [Request Features](.github/ISSUE_TEMPLATE/feature_request.md)

## 📈 Roadmap

### Upcoming Features
- [ ] 🔍 Advanced filtering and search
- [ ] 📊 Enhanced analytics dashboard
- [ ] 👥 Multi-user collaboration
- [ ] 🔗 Integration with Azure DevOps
- [ ] 🌐 Internationalization support

### Long-term Vision
- Enterprise-grade assessment management
- Integration with Azure Resource Graph
- Automated compliance reporting
- Custom checklist creation tools

## 🤝 Contributing

We welcome contributions from the community! Whether it's:

- 🐛 **Bug Reports**: Help us identify and fix issues
- 💡 **Feature Requests**: Suggest new functionality
- 📝 **Documentation**: Improve our guides and examples
- 🔧 **Code Contributions**: Submit pull requests with improvements

### Getting Started
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). 
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or 
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Microsoft Azure Team** - For the comprehensive review checklists
- **Azure Community** - For feedback and contributions
- **GitHub Actions** - For reliable automation platform

## 📞 Support

- 📧 **Issues**: Use GitHub Issues for bug reports and feature requests
- 💬 **Discussions**: Join GitHub Discussions for questions and ideas
- 📖 **Documentation**: Check the docs folder for detailed guides

---

**Made with ❤️ for the Azure community**

*Last updated: October 12, 2025*