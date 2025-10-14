# =====================================================
# Repository Cleanup Script for Public Release
# =====================================================
# Run this script before pushing to public repository

Write-Host "Cleaning up repository for public release..." -ForegroundColor Yellow

# Remove personal/test files
Write-Host "Removing personal and test files..."
Remove-Item -Path "Azure Landing Zone Assissement.xlsx" -ErrorAction SilentlyContinue
Remove-Item -Path "web-assessment/Azure Landing Zone Assissement.xlsx" -ErrorAction SilentlyContinue
Remove-Item -Path "web-assessment/test-upload.csv" -ErrorAction SilentlyContinue
Remove-Item -Path "excel-test.html" -ErrorAction SilentlyContinue
Remove-Item -Path "web-assessment/test.html" -ErrorAction SilentlyContinue
Remove-Item -Path "Azure-ALZ-Modern-Assessment.code-workspace" -ErrorAction SilentlyContinue

# Remove development directories
Write-Host "Removing development and backup directories..."
Remove-Item -Path ".playwright-mcp" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "backups" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "js.old" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "js.old2" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "styles.old" -Recurse -Force -ErrorAction SilentlyContinue

# Remove root directory duplicates (keep web-assessment as primary)
Write-Host "Removing duplicate files from root directory..."
Remove-Item -Path "index.html" -ErrorAction SilentlyContinue
Remove-Item -Path "checklist.json" -ErrorAction SilentlyContinue
Remove-Item -Path "sample-assessment.csv" -ErrorAction SilentlyContinue
Remove-Item -Path "sample-assessment.json" -ErrorAction SilentlyContinue
Remove-Item -Path "sample-excel-converted.json" -ErrorAction SilentlyContinue
Remove-Item -Path "favicon.svg" -ErrorAction SilentlyContinue
Remove-Item -Path "manifest.json" -ErrorAction SilentlyContinue

# Remove checklists (will be fetched dynamically)
Write-Host "Removing checklist data (will be fetched from Azure repo)..."
Remove-Item -Path "checklists" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "review-checklists" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "web-assessment/review-checklists" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Repository cleanup complete!" -ForegroundColor Green
Write-Host "Review the changes with 'git status' before committing" -ForegroundColor Cyan

# Show what will be committed
Write-Host ""
Write-Host "Git status after cleanup:" -ForegroundColor Blue
git status --porcelain