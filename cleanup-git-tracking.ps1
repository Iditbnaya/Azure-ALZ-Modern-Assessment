# Git Cleanup Script - Remove Unrelated Files from Tracking
# Run this script to remove ignored files from git tracking without deleting them locally

Write-Host "🧹 Cleaning up unrelated files from Git tracking..." -ForegroundColor Cyan
Write-Host ""

# Files to remove from git tracking (but keep locally)
$filesToUntrack = @(
    "image.png",
    "cleanup-for-public.ps1",
    "web-assessment/checklist.json",
    "alz_checklist.en.xlsx",
    "sample-azure-checklist.xlsx"
)

# Documentation files to untrack (internal development notes)
$docsToUntrack = @(
    "EXCEL-COMMENTS-FIX.md",
    "EXCEL-UPLOAD-CHANGES-SUMMARY.md",
    "EXCEL-UPLOAD-PERFORMANCE-FIX.md",
    "SAVE-ASSESSMENT-FIX.md",
    "excel-upload-format.md",
    "web-assessment/excel-upload-format.md",
    "GITHUB_INSTRUCTIONS.md"
)

$allFiles = $filesToUntrack + $docsToUntrack

Write-Host "📝 Files to remove from tracking:" -ForegroundColor Yellow
foreach ($file in $allFiles) {
    if (Test-Path $file) {
        Write-Host "  - $file" -ForegroundColor Gray
    }
}
Write-Host ""

# Confirm before proceeding
$confirm = Read-Host "Do you want to proceed? (y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "❌ Operation cancelled." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🔧 Removing files from Git tracking (keeping local copies)..." -ForegroundColor Cyan

$removedCount = 0
$notFoundCount = 0

foreach ($file in $allFiles) {
    if (Test-Path $file) {
        try {
            git rm --cached $file 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✅ Removed: $file" -ForegroundColor Green
                $removedCount++
            } else {
                Write-Host "  ⚠️  Not tracked: $file" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "  ❌ Error removing: $file" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⚠️  Not found: $file" -ForegroundColor Yellow
        $notFoundCount++
    }
}

Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  - Files removed from tracking: $removedCount" -ForegroundColor Green
Write-Host "  - Files not found: $notFoundCount" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Done! Files are now ignored by Git but remain in your local workspace." -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review changes: git status" -ForegroundColor Gray
Write-Host "  2. Commit the changes: git add .gitignore && git commit -m 'Update .gitignore - remove unrelated files'" -ForegroundColor Gray
Write-Host "  3. Push to remote: git push" -ForegroundColor Gray
Write-Host ""
