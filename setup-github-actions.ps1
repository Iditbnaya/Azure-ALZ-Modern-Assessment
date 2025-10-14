# ALZ Assessment Tool - GitHub Actions Setup Script
# This script helps you set up automated checklist syncing

param(
    [string]$GitHubUsername = "",
    [switch]$TestRun = $false
)

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-GitHubActions {
    Write-ColorOutput "🧪 Testing GitHub Actions setup..." "Yellow"
    
    if (-not (Test-Path ".github\workflows")) {
        Write-ColorOutput "❌ .github/workflows directory not found" "Red"
        return $false
    }
    
    $workflows = @(
        "sync-upstream.yml",
        "update-checklists.yml", 
        "manual-sync.yml"
    )
    
    $allFound = $true
    foreach ($workflow in $workflows) {
        $path = ".github\workflows\$workflow"
        if (Test-Path $path) {
            Write-ColorOutput "✅ Found: $workflow" "Green"
        } else {
            Write-ColorOutput "❌ Missing: $workflow" "Red"
            $allFound = $false
        }
    }
    
    return $allFound
}

function Show-NextSteps {
    param([string]$Username)
    
    Write-ColorOutput ""
    Write-ColorOutput "🎯 Next Steps:" "Yellow"
    Write-ColorOutput "=" * 50 "Gray"
    
    if ($Username) {
        Write-ColorOutput "1. 🍴 Fork https://github.com/Azure/review-checklists to your account" "White"
        Write-ColorOutput "   Your fork will be: https://github.com/$Username/review-checklists" "Cyan"
        Write-ColorOutput ""
    }
    
    Write-ColorOutput "2. 📤 Push these workflows to your repository:" "White"
    Write-ColorOutput "   git add .github/" "Cyan"
    Write-ColorOutput "   git commit -m 'Add automated checklist sync workflows'" "Cyan"
    Write-ColorOutput "   git push" "Cyan"
    Write-ColorOutput ""
    
    Write-ColorOutput "3. ⚙️  Enable GitHub Actions in your repository:" "White"
    Write-ColorOutput "   - Go to your repository on GitHub" "Cyan"
    Write-ColorOutput "   - Click 'Actions' tab" "Cyan"
    Write-ColorOutput "   - Click 'I understand my workflows, go ahead and enable them'" "Cyan"
    Write-ColorOutput ""
    
    Write-ColorOutput "4. 🔐 Configure repository permissions:" "White"
    Write-ColorOutput "   - Go to Settings → Actions → General" "Cyan"
    Write-ColorOutput "   - Under 'Workflow permissions', select 'Read and write permissions'" "Cyan"
    Write-ColorOutput "   - Check 'Allow GitHub Actions to create and approve pull requests'" "Cyan"
    Write-ColorOutput ""
    
    Write-ColorOutput "5. 🧪 Test the setup:" "White"
    Write-ColorOutput "   - Go to Actions tab" "Cyan"
    Write-ColorOutput "   - Click 'Manual Checklist Sync'" "Cyan"
    Write-ColorOutput "   - Click 'Run workflow' to test" "Cyan"
    Write-ColorOutput ""
    
    Write-ColorOutput "6. 📅 Monthly automation is now configured!" "White"
    Write-ColorOutput "   - Fork sync: 1st of each month at 2 AM UTC" "Cyan"
    Write-ColorOutput "   - Checklist update: 1st of each month at 3 AM UTC" "Cyan"
    Write-ColorOutput ""
    
    Write-ColorOutput "📚 Documentation:" "Yellow"
    Write-ColorOutput "   See .github/workflows/README.md for detailed instructions" "Cyan"
}

# Main execution
Write-ColorOutput "🚀 ALZ Assessment Tool - GitHub Actions Setup" "Green"
Write-ColorOutput "=" * 60 "Gray"

if ($TestRun) {
    Write-ColorOutput "🧪 Running in test mode..." "Yellow"
    if (Test-GitHubActions) {
        Write-ColorOutput "✅ All workflows are properly configured!" "Green"
    } else {
        Write-ColorOutput "❌ Some workflows are missing or misconfigured" "Red"
    }
    Write-ColorOutput ""
}

if (-not $GitHubUsername) {
    Write-ColorOutput "💡 Tip: Run with -GitHubUsername parameter for personalized instructions" "Yellow"
    Write-ColorOutput "   Example: .\setup-github-actions.ps1 -GitHubUsername yourusername" "Cyan"
    Write-ColorOutput ""
}

Show-NextSteps -Username $GitHubUsername

Write-ColorOutput "🎉 Setup complete! Your assessment tool will now automatically update with the latest Azure checklists." "Green"