# GitHub Actions Workflows

This directory contains automated workflows for maintaining the Azure Landing Zone Assessment tool.

## Available Workflows

### 🔄 update-checklists.yml

**Purpose**: Automatically sync checklists from the official Azure/review-checklists repository

**Schedule**:

- Runs monthly on the 1st at 2:00 AM UTC
- Can be triggered manually

**Features**:

- Syncs directly from Azure/review-checklists (no fork required)
- Preserves custom AI Landing Zone checklist by default
- Creates backups before updating
- Supports filtering specific checklist types
- Creates GitHub issues when updates are available
- Comprehensive validation and error handling

**Manual Trigger**:

1. Go to Actions tab
2. Select "Update Checklists"
3. Click "Run workflow"
4. Configure options as needed

---

### ⚡ manual-sync.yml

**Purpose**: Quick manual trigger for immediate checklist updates

**When to Use**:

- Need immediate updates outside monthly schedule
- Testing checklist synchronization
- Updating specific checklist types only

**Features**:

- Instant manual triggering
- Select specific checklist types to sync
- Backup creation option
- Simplified interface for quick updates

**Manual Trigger**:

1. Go to Actions tab
2. Select "Manual Checklist Sync"
3. Click "Run workflow"
4. Specify checklist types (optional)
5. Configure preservation and backup options

---

## Workflow Configuration

### Environment Variables

- `GITHUB_TOKEN`: Automatically provided by GitHub Actions
- No additional secrets required

### Input Parameters

#### update-checklists.yml

- `checklist_types`: Comma-separated list of specific types (e.g., "aks,appsvc,security")
- `preserve_custom_ai`: Keep custom AI Landing Zone checklist (default: true)
- `create_backup`: Create backup before updating (default: true)

#### manual-sync.yml

- `checklist_types`: Comma-separated list of specific types
- `preserve_custom_ai`: Keep custom AI Landing Zone checklist (default: true)
- `create_backup`: Create backup before updating (default: true)

---

## How It Works

1. **Direct Azure Sync**: Workflows connect directly to Azure/review-checklists repository
2. **Backup Protection**: Original checklists are backed up before updates
3. **Selective Updates**: Can target specific checklist types if needed
4. **Validation**: Checks file counts and formats before applying changes
5. **Issue Creation**: Creates GitHub issues when updates are detected
6. **Error Handling**: Comprehensive error reporting and rollback capabilities

---

## Troubleshooting

### Common Issues

**Workflow fails to find checklists**:

- Check if Azure/review-checklists repository is accessible
- Verify API rate limits aren't exceeded

**Changes not applied**:

- Check if files are properly formatted JSON
- Verify backup creation succeeded
- Review workflow logs for validation errors

**Custom AI checklist overwritten**:

- Ensure `preserve_custom_ai` is set to true
- Check if ai_lz_checklist.en.json exists in backup

### Getting Help

1. Check the Actions tab for detailed logs
2. Review the backup folders for previous versions
3. Look for created GitHub issues with update details
4. Check file permissions and repository access

---

## Development Notes

- Workflows use Node.js 20 for JSON processing
- All operations are logged for debugging
- Backups are stored in `backups/` directory with timestamps
- Custom logic preserves local modifications when possible

---

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure Review Checklists Repository](https://github.com/Azure/review-checklists)
- [Cron Expression Generator](https://crontab.guru/)

## 🤝 Contributing

To improve the automation workflows:

1. Test changes in a fork first
2. Update documentation for any new features
3. Follow GitHub Actions best practices
4. Ensure backward compatibility
