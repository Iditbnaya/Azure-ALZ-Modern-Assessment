# 🔄 Automated Checklist Sync with GitHub Actions

This directory contains GitHub Actions workflows to automatically keep your ALZ Assessment Tool updated with the latest checklists from the Azure review-checklists repository.

## 📋 Overview

The automated sync process works in two stages:

1. **Fork Sync** (`sync-upstream.yml`) - Keeps your forked review-checklists repository in sync with the upstream Azure repository
2. **Checklist Update** (`update-checklists.yml`) - Downloads the latest checklists from your fork and updates your assessment tool

## 🔧 Workflows

### 1. Sync Fork with Upstream (`sync-upstream.yml`)
- **Schedule**: Monthly on the 1st day at 2 AM UTC
- **Purpose**: Syncs your forked review-checklists repository with Azure/review-checklists
- **Manual Trigger**: Available via GitHub Actions tab

### 2. Update Assessment Tool Checklists (`update-checklists.yml`)
- **Schedule**: Monthly on the 1st day at 3 AM UTC (after fork sync)
- **Purpose**: Updates your assessment tool with the latest checklists
- **Features**:
  - Automatic backup of existing checklists
  - Preserves your custom AI Landing Zone checklist
  - Validates JSON files
  - Updates data-loader.js mapping
  - Creates summary issues

### 3. Manual Checklist Sync (`manual-sync.yml`)
- **Purpose**: Immediate sync when needed outside the monthly schedule
- **Features**: 
  - Option to sync fork first
  - Configurable backup and preservation options
  - Quick one-click operation

## 🚀 Setup Instructions

### Prerequisites
1. Fork the Azure/review-checklists repository to your GitHub account
2. Ensure your assessment tool repository has these workflows in `.github/workflows/`

### Initial Setup
1. **Copy workflows**: Ensure all three `.yml` files are in your repository's `.github/workflows/` directory
2. **Enable Actions**: Go to your repository's "Actions" tab and enable GitHub Actions if not already enabled
3. **Set permissions**: Ensure the `GITHUB_TOKEN` has write permissions (usually enabled by default)

### Manual Configuration
If you need to customize the setup:

1. **Change schedule**: Edit the `cron` expressions in the workflow files
2. **Fork repository**: Update the repository references if your fork has a different name
3. **Custom preservation**: Modify the AI checklist preservation logic if needed

## 📅 Monthly Automation Schedule

```
Day 1 of each month:
├── 2:00 AM UTC - Sync fork with upstream Azure repository
├── 3:00 AM UTC - Download latest checklists to assessment tool
└── Creates summary issue with update details
```

## 🎯 Manual Triggers

### Sync Fork Only
```bash
# Go to Actions tab → "Sync Fork with Upstream" → Run workflow
# Options: Force sync (ignores up-to-date check)
```

### Update Checklists Only
```bash
# Go to Actions tab → "Update Assessment Tool Checklists" → Run workflow  
# Options: Preserve custom AI checklist (recommended: true)
```

### Full Manual Sync
```bash
# Go to Actions tab → "Manual Checklist Sync" → Run workflow
# Options: 
#   - Sync fork first (recommended: true)
#   - Preserve custom AI checklist (recommended: true)
#   - Create backup (recommended: true)
```

## 🔒 Custom Checklist Preservation

The workflows automatically preserve your custom AI Landing Zone checklist:

- **Backup**: Creates timestamped backups before updates
- **Detection**: Compares custom vs. standard versions
- **Preservation**: Restores custom version if different from standard
- **Validation**: Ensures all JSON files are valid after updates

## 📊 Monitoring & Logs

### Workflow Status
- Monitor in the "Actions" tab of your repository
- Email notifications available via GitHub settings
- Status badges can be added to README

### Update Summaries
- Automatic issue creation with update details
- Lists all available assessment types
- Shows backup locations and file counts
- Tracks update history

### Troubleshooting
Common issues and solutions:

1. **Workflow fails**: Check the Actions logs for detailed error messages
2. **Fork not syncing**: Ensure the upstream remote is correctly configured
3. **Checklists not updating**: Verify file permissions and JSON validity
4. **Custom AI lost**: Check backup directory and preservation logs

## 🔧 Advanced Configuration

### Custom Checklist Types
To add support for new checklist types:

1. Ensure the files follow the naming pattern: `{type}_checklist.en.json`
2. The workflow will automatically detect and include them
3. Update the dropdown in `index.html` if needed

### Scheduling Changes
To modify the sync schedule, edit the `cron` expressions:

```yaml
schedule:
  - cron: '0 2 1 * *'  # Monthly: minute hour day month day-of-week
  - cron: '0 2 * * 1'  # Weekly: Every Monday at 2 AM
  - cron: '0 2 * * *'  # Daily: Every day at 2 AM
```

### Notification Setup
Add notification steps to workflows:

```yaml
- name: Notify on completion
  uses: actions/github-script@v7
  with:
    script: |
      // Add notification logic (email, Slack, Teams, etc.)
```

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cron Expression Generator](https://crontab.guru/)
- [Azure Review Checklists Repository](https://github.com/Azure/review-checklists)

## 🤝 Contributing

To improve the automation workflows:

1. Test changes in a fork first
2. Update documentation for any new features
3. Follow GitHub Actions best practices
4. Ensure backward compatibility

---

**Note**: The first run may take longer as it sets up the initial sync. Subsequent runs will be faster as they only process changes.