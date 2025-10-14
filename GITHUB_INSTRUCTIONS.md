# 📚 GitHub Best Practices & Instructions

## ALZ Assessment Tool Repository Guide

This document outlines best practices, workflows, and instructions for working with the ALZ Assessment Tool repository, including automated checklist syncing and development workflows.

## 📋 Table of Contents

- [Repository Overview](#repository-overview)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [GitHub Actions & Automation](#github-actions--automation)
- [Branch Strategy](#branch-strategy)
- [Code Standards](#code-standards)
- [Issue Management](#issue-management)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Release Management](#release-management)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## 🏗️ Repository Overview

### Purpose
The ALZ Assessment Tool helps organizations assess their Azure Landing Zone implementations against Microsoft's best practices and recommendations.

### Key Components
- **Web Assessment Tool**: Interactive web-based assessment interface
- **Automated Checklist Sync**: GitHub Actions workflows for monthly updates
- **Assessment Data**: JSON-based checklist files from Azure/review-checklists
- **Export Functionality**: Excel and JSON export capabilities

### Repository Structure
```
ALZAssessment/
├── .github/
│   └── workflows/           # GitHub Actions automation
├── web-assessment/          # Main application
│   ├── index.html          # Main interface
│   ├── js/                 # JavaScript modules
│   ├── styles/             # CSS styling
│   └── manifest.json       # PWA configuration
├── review-checklists/      # Synced Azure checklists
│   └── checklists/         # JSON checklist files
├── backups/                # Automatic backups (auto-generated)
└── docs/                   # Documentation
```

## 🚀 Getting Started

### Prerequisites
- Git installed and configured
- GitHub account with appropriate repository access
- Modern web browser for testing
- Optional: Python 3.x for local development server

### Initial Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/iditbnaya/ALZAssessment.git
   cd ALZAssessment
   ```

2. **Fork Azure Review Checklists**
   - Fork https://github.com/Azure/review-checklists to your account
   - This enables automated checklist updates

3. **Configure Git**
   ```bash
   git config user.name "Your Name"
   git config user.email "your.email@domain.com"
   ```

4. **Enable GitHub Actions**
   - Go to repository Settings → Actions → General
   - Select "Allow all actions and reusable workflows"
   - Under "Workflow permissions", select "Read and write permissions"
   - Check "Allow GitHub Actions to create and approve pull requests"

## 💻 Development Workflow

### Local Development

1. **Start Development Server**
   ```powershell
   # Using PowerShell script (Windows)
   .\serve.ps1
   
   # Using Python (Cross-platform)
   cd web-assessment
   python -m http.server 8000
   
   # Using Node.js (Alternative)
   npx http-server web-assessment -p 8000
   ```

2. **Access Application**
   - Open http://localhost:8000 in your browser
   - Test different assessment types
   - Verify file upload/export functionality

### Code Organization

#### JavaScript Modules
- **`app.js`**: Main application logic and initialization
- **`assessment.js`**: Assessment interface and user interactions
- **`data-loader.js`**: Checklist loading and processing
- **`dashboard.js`**: Statistics and progress tracking
- **`export.js`**: Export functionality (Excel, JSON)

#### CSS Structure
- **`main.css`**: Primary styles and components
- Use CSS custom properties for theming
- Follow mobile-first responsive design

#### HTML Structure
- Semantic HTML5 elements
- ARIA labels for accessibility
- Progressive enhancement approach

## ⚙️ GitHub Actions & Automation

### Automated Workflows

#### 1. **Upstream Sync** (`sync-upstream.yml`)
- **Schedule**: 1st of each month, 2 AM UTC
- **Purpose**: Syncs your fork with Azure/review-checklists
- **Manual Trigger**: Available via Actions tab

#### 2. **Checklist Update** (`update-checklists.yml`)
- **Schedule**: 1st of each month, 3 AM UTC
- **Purpose**: Updates assessment tool with latest checklists
- **Features**: Backup, validation, custom preservation

#### 3. **Manual Sync** (`manual-sync.yml`)
- **Purpose**: On-demand sync for immediate updates
- **Options**: Configurable sync and preservation settings

### Monitoring Automation

#### Workflow Status
- Monitor via Actions tab
- Email notifications in GitHub settings
- Status badges in README (optional)

#### Issue Tracking
- Automated summary issues created monthly
- Label: `checklist-update`
- Contains update details and statistics

### Customizing Automation

#### Schedule Modification
```yaml
schedule:
  - cron: '0 2 1 * *'  # Monthly: 1st day at 2 AM
  - cron: '0 2 * * 1'  # Weekly: Every Monday at 2 AM
  - cron: '0 2 * * *'  # Daily: Every day at 2 AM
```

#### Adding Notifications
```yaml
- name: Notify Team
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 🌿 Branch Strategy

### Main Branches
- **`main`**: Production-ready code, protected branch
- **`develop`**: Integration branch for features (optional)

### Feature Branches
- **Naming**: `feature/description` or `feat/issue-number`
- **Examples**: `feature/new-export-format`, `feat/123-ui-improvements`

### Hotfix Branches
- **Naming**: `hotfix/description` or `fix/issue-number`
- **Examples**: `hotfix/critical-bug`, `fix/456-data-validation`

### Branch Protection Rules

#### Main Branch Protection
```yaml
Required status checks:
  - All GitHub Actions workflows pass
  - At least 1 review required
  - Dismiss stale reviews when new commits are pushed
  - Require branches to be up to date before merging
  - Include administrators in restrictions
```

## 📏 Code Standards

### JavaScript Standards

#### Code Style
```javascript
// Use ES6+ features
const dataLoader = new DataLoader();

// Use async/await for promises
async function loadAssessment(type) {
    try {
        const data = await dataLoader.loadChecklist(type);
        return data;
    } catch (error) {
        console.error('Loading failed:', error);
        throw error;
    }
}

// Use descriptive function names
function validateChecklistData(data) {
    return data && data.items && Array.isArray(data.items);
}
```

#### Documentation
```javascript
/**
 * Load checklist data based on type
 * @param {string} checklistType - Type of checklist (alz, aks, etc.)
 * @returns {Promise<Object>} Parsed checklist data
 * @throws {Error} When checklist cannot be loaded
 */
async function loadChecklist(checklistType) {
    // Implementation
}
```

### HTML Standards
- Use semantic HTML5 elements
- Include proper meta tags
- Ensure accessibility with ARIA labels
- Validate markup regularly

### CSS Standards
- Use CSS custom properties for theming
- Follow BEM methodology for class naming
- Mobile-first responsive design
- Minimize external dependencies

### File Organization
```
web-assessment/
├── index.html              # Main entry point
├── js/
│   ├── app.js             # Application initialization
│   ├── modules/           # Feature modules
│   └── utils/             # Utility functions
├── styles/
│   ├── main.css           # Main stylesheet
│   ├── components/        # Component styles
│   └── utilities/         # Utility classes
└── assets/
    ├── icons/             # Icon files
    └── images/            # Image assets
```

## 🎯 Issue Management

### Issue Templates

#### Bug Report Template
```markdown
**Bug Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- Browser: [e.g. Chrome, Firefox]
- Version: [e.g. 22]
- Assessment Type: [e.g. ALZ, AKS]
```

#### Feature Request Template
```markdown
**Feature Description**
A clear description of the feature.

**Use Case**
Why is this feature needed?

**Proposed Solution**
How would you like this implemented?

**Additional Context**
Any other context or screenshots.
```

### Issue Labels

#### Type Labels
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements to documentation
- `automation` - GitHub Actions related
- `checklist-update` - Automated checklist updates

#### Priority Labels
- `priority/critical` - Critical issues
- `priority/high` - High priority
- `priority/medium` - Medium priority
- `priority/low` - Low priority

#### Status Labels
- `status/in-progress` - Currently being worked on
- `status/blocked` - Blocked by external dependency
- `status/needs-review` - Needs review before proceeding

## 🔄 Pull Request Guidelines

### PR Template
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] I have tested these changes locally
- [ ] All assessment types load correctly
- [ ] Export functionality works
- [ ] No console errors

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have added comments where necessary
- [ ] My changes generate no new warnings
```

### Review Process

#### Required Reviews
- At least 1 review for feature changes
- 2 reviews for breaking changes
- Automated checks must pass

#### Review Checklist
- [ ] Code follows established patterns
- [ ] No security vulnerabilities introduced
- [ ] Performance impact considered
- [ ] Documentation updated if needed
- [ ] Tests cover new functionality

### Merge Strategy
- **Squash and merge** for feature branches
- **Merge commit** for release branches
- **Rebase and merge** for hotfixes

## 🚢 Release Management

### Versioning Strategy
Follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Process

#### 1. Prepare Release
```bash
# Create release branch
git checkout -b release/v1.2.0

# Update version numbers
# Update CHANGELOG.md
# Final testing
```

#### 2. Create Release
```bash
# Tag the release
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin v1.2.0

# Create GitHub release with changelog
```

#### 3. Post-Release
```bash
# Merge back to main
git checkout main
git merge release/v1.2.0

# Clean up
git branch -d release/v1.2.0
```

### Changelog Format
```markdown
# Changelog

## [1.2.0] - 2025-10-12

### Added
- New assessment type support
- Enhanced export functionality

### Changed
- Improved UI responsiveness
- Updated Azure checklist sync

### Fixed
- Data validation issues
- Export formatting bugs

### Security
- Updated dependencies
```

## 🔒 Security Best Practices

### Secrets Management
- Never commit secrets to repository
- Use GitHub Secrets for sensitive data
- Rotate tokens regularly
- Limit secret access to necessary workflows

### Dependencies
- Regularly update dependencies
- Monitor for security vulnerabilities
- Use Dependabot for automated updates
- Review dependency licenses

### Access Control
- Use principle of least privilege
- Enable two-factor authentication
- Regularly review collaborator access
- Protect sensitive branches

### Code Security
- Validate all user inputs
- Sanitize data before display
- Use HTTPS for all external requests
- Implement proper error handling

## 🔧 Troubleshooting

### Common Issues

#### Workflow Failures
```bash
# Check workflow logs
# Go to Actions tab → Failed workflow → View logs

# Common solutions:
1. Verify GitHub token permissions
2. Check repository settings
3. Ensure fork is properly configured
4. Validate YAML syntax
```

#### Checklist Loading Issues
```bash
# Check browser console for errors
# Verify JSON file validity
# Test API endpoints
# Check CORS configuration
```

#### Local Development Issues
```bash
# Server won't start
python --version  # Verify Python installation
netstat -an | grep 8000  # Check port availability

# Files not loading
# Check file paths and permissions
# Verify web server configuration
```

### Debug Mode
Enable debug logging in JavaScript:
```javascript
// Set debug mode in browser console
localStorage.setItem('debug', 'true');

// Check debug logs
console.log('Debug mode enabled');
```

### Performance Monitoring
```javascript
// Monitor load times
console.time('checklist-load');
// ... loading code ...
console.timeEnd('checklist-load');

// Check memory usage
console.log('Memory usage:', performance.memory);
```

## 📞 Support & Resources

### Documentation
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure Review Checklists](https://github.com/Azure/review-checklists)
- [Semantic Versioning](https://semver.org/)

### Tools
- [GitHub CLI](https://cli.github.com/) - Command line interface
- [Conventional Commits](https://www.conventionalcommits.org/) - Commit message format
- [Prettier](https://prettier.io/) - Code formatting

### Community
- Create issues for bugs and feature requests
- Participate in discussions
- Contribute to documentation improvements
- Share feedback and suggestions

---

## 📄 License & Contributing

### License
This project is licensed under the MIT License - see the LICENSE file for details.

### Contributing
1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Add tests if applicable
5. Commit your changes
6. Push to the branch
7. Create a Pull Request

### Code of Conduct
Please read and follow our Code of Conduct to ensure a welcoming environment for all contributors.

---

**Last Updated**: October 12, 2025  
**Version**: 1.0.0