# ALZ Assessment Tool - Checklist Sync Script
# Syncs checklists from your forked Azure/review-checklists repository

param(
    [string]$YourGitHubUsername = "",
    [switch]$BackupExisting = $true,
    [switch]$UpdateFork = $true,
    [switch]$DryRun = $false
)

# Configuration
$UpstreamRepo = "Azure/review-checklists"
$YourForkRepo = "$YourGitHubUsername/review-checklists"
$LocalChecklistPath = "review-checklists/checklists"
$BackupPath = "backups/checklists-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"

# Function to write colored output
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

# Function to check if git is available
function Test-GitAvailable {
    try {
        git --version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to backup existing checklists
function Backup-ExistingChecklists {
    if (Test-Path $LocalChecklistPath) {
        Write-ColorOutput "📦 Creating backup of existing checklists..." "Yellow"
        
        if (-not (Test-Path "backups")) {
            New-Item -ItemType Directory -Path "backups" | Out-Null
        }
        
        Copy-Item -Path $LocalChecklistPath -Destination $BackupPath -Recurse
        Write-ColorOutput "✅ Backup created at: $BackupPath" "Green"
        return $true
    }
    else {
        Write-ColorOutput "⚠️  No existing checklists found to backup" "Yellow"
        return $false
    }
}

# Function to sync fork with upstream
function Sync-Fork {
    param([string]$ForkRepo)
    
    if (-not $YourGitHubUsername) {
        Write-ColorOutput "❌ GitHub username required for fork sync. Use -YourGitHubUsername parameter" "Red"
        return $false
    }
    
    Write-ColorOutput "🔄 Syncing your fork with upstream repository..." "Yellow"
    
    # Check if we're in a git repository
    if (-not (Test-Path ".git")) {
        Write-ColorOutput "📥 Cloning your forked repository..." "Cyan"
        
        if ($DryRun) {
            Write-ColorOutput "[DRY RUN] Would clone: https://github.com/$ForkRepo.git" "Gray"
            return $true
        }
        
        git clone "https://github.com/$ForkRepo.git" temp-repo
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "❌ Failed to clone repository" "Red"
            return $false
        }
        
        Push-Location temp-repo
    }
    
    try {
        if ($DryRun) {
            Write-ColorOutput "[DRY RUN] Would add upstream remote and sync" "Gray"
            return $true
        }
        
        # Add upstream remote if it doesn't exist
        $remotes = git remote
        if ($remotes -notcontains "upstream") {
            git remote add upstream "https://github.com/$UpstreamRepo.git"
        }
        
        # Fetch upstream changes
        git fetch upstream
        
        # Switch to main branch and merge upstream changes
        git checkout main
        git merge upstream/main
        
        # Push changes to your fork
        git push origin main
        
        Write-ColorOutput "✅ Fork synced successfully!" "Green"
        return $true
    }
    catch {
        Write-ColorOutput "❌ Error syncing fork: $($_.Exception.Message)" "Red"
        return $false
    }
    finally {
        if (Test-Path "temp-repo") {
            Pop-Location
        }
    }
}

# Function to download checklists directly from GitHub
function Download-Checklists {
    param([string]$SourceRepo)
    
    Write-ColorOutput "📥 Downloading latest checklists from $SourceRepo..." "Yellow"
    
    $BaseUrl = "https://raw.githubusercontent.com/$SourceRepo/main"
    $ChecklistsUrl = "$BaseUrl/checklists"
    $ChecklistsExtUrl = "$BaseUrl/checklists-ext"
    
    # Create directory if it doesn't exist
    if (-not (Test-Path $LocalChecklistPath)) {
        New-Item -ItemType Directory -Path $LocalChecklistPath -Force | Out-Null
    }
    
    # Get list of checklist files from GitHub API
    try {
        $ApiUrl = "https://api.github.com/repos/$SourceRepo/contents/checklists"
        Write-ColorOutput "🔍 Fetching checklist file list..." "Cyan"
        
        if ($DryRun) {
            Write-ColorOutput "[DRY RUN] Would fetch from: $ApiUrl" "Gray"
            return $true
        }
        
        $Response = Invoke-RestMethod -Uri $ApiUrl -Method Get
        $JsonFiles = $Response | Where-Object { $_.name -like "*.json" }
        
        Write-ColorOutput "📋 Found $($JsonFiles.Count) checklist files" "Green"
        
        # Download each file
        foreach ($File in $JsonFiles) {
            $DownloadUrl = $File.download_url
            $LocalFilePath = Join-Path $LocalChecklistPath $File.name
            
            Write-ColorOutput "⬇️  Downloading: $($File.name)" "Cyan"
            
            try {
                Invoke-WebRequest -Uri $DownloadUrl -OutFile $LocalFilePath
                Write-ColorOutput "✅ Downloaded: $($File.name)" "Green"
            }
            catch {
                Write-ColorOutput "❌ Failed to download $($File.name): $($_.Exception.Message)" "Red"
            }
        }
        
        return $true
    }
    catch {
        Write-ColorOutput "❌ Error accessing GitHub API: $($_.Exception.Message)" "Red"
        return $false
    }
}

# Function to preserve custom checklists
function Preserve-CustomChecklists {
    Write-ColorOutput "🔒 Preserving custom AI Landing Zone checklist..." "Yellow"
    
    $CustomAiFile = Join-Path $LocalChecklistPath "ai_lz_checklist.en.json"
    $BackupAiFile = Join-Path $BackupPath "ai_lz_checklist.en.json"
    
    if ((Test-Path $BackupAiFile) -and (Test-Path $CustomAiFile)) {
        # Compare files to see if we should keep the custom version
        $CustomContent = Get-Content $BackupAiFile -Raw
        $NewContent = Get-Content $CustomAiFile -Raw
        
        if ($CustomContent -ne $NewContent) {
            Write-ColorOutput "⚠️  Custom AI Landing Zone checklist detected" "Yellow"
            Write-ColorOutput "🔄 Restoring your custom AI Landing Zone checklist..." "Cyan"
            Copy-Item $BackupAiFile $CustomAiFile -Force
            Write-ColorOutput "✅ Custom AI checklist preserved" "Green"
        }
    }
}

# Main execution
function Main {
    Write-ColorOutput "🚀 ALZ Assessment Checklist Sync Tool" "Green"
    Write-ColorOutput "=" * 50 "Gray"
    
    if (-not (Test-GitAvailable)) {
        Write-ColorOutput "❌ Git is not available. Please install Git first." "Red"
        Write-ColorOutput "Download from: https://git-scm.com/downloads" "Yellow"
        exit 1
    }
    
    # Step 1: Backup existing checklists
    if ($BackupExisting) {
        Backup-ExistingChecklists
    }
    
    # Step 2: Update fork (if username provided)
    if ($UpdateFork -and $YourGitHubUsername) {
        if (-not (Sync-Fork -ForkRepo $YourForkRepo)) {
            Write-ColorOutput "⚠️  Fork sync failed, falling back to direct download" "Yellow"
        }
    }
    
    # Step 3: Download latest checklists
    $SourceRepo = if ($YourGitHubUsername) { $YourForkRepo } else { $UpstreamRepo }
    
    if (Download-Checklists -SourceRepo $SourceRepo) {
        Write-ColorOutput "✅ Checklists updated successfully!" "Green"
        
        # Step 4: Preserve custom checklists
        if ($BackupExisting -and (Test-Path $BackupPath)) {
            Preserve-CustomChecklists
        }
        
        Write-ColorOutput "" 
        Write-ColorOutput "📊 Summary:" "Yellow"
        Write-ColorOutput "- Source: $SourceRepo" "White"
        Write-ColorOutput "- Local path: $LocalChecklistPath" "White"
        if ($BackupExisting) {
            Write-ColorOutput "- Backup: $BackupPath" "White"
        }
        Write-ColorOutput ""
        Write-ColorOutput "🎉 Sync completed! Your assessment tool now has the latest checklists." "Green"
    }
    else {
        Write-ColorOutput "❌ Failed to update checklists" "Red"
        exit 1
    }
}

# Help function
function Show-Help {
    Write-ColorOutput "ALZ Assessment Checklist Sync Tool" "Green"
    Write-ColorOutput ""
    Write-ColorOutput "USAGE:" "Yellow"
    Write-ColorOutput "  .\sync-checklists.ps1 [-YourGitHubUsername <username>] [-BackupExisting] [-UpdateFork] [-DryRun]" "White"
    Write-ColorOutput ""
    Write-ColorOutput "PARAMETERS:" "Yellow"
    Write-ColorOutput "  -YourGitHubUsername  Your GitHub username (for fork sync)" "White"
    Write-ColorOutput "  -BackupExisting      Backup existing checklists before update (default: true)" "White"
    Write-ColorOutput "  -UpdateFork          Sync your fork with upstream before download (default: true)" "White"
    Write-ColorOutput "  -DryRun              Show what would be done without making changes" "White"
    Write-ColorOutput ""
    Write-ColorOutput "EXAMPLES:" "Yellow"
    Write-ColorOutput "  .\sync-checklists.ps1 -YourGitHubUsername yourusername" "White"
    Write-ColorOutput "  .\sync-checklists.ps1 -DryRun" "White"
    Write-ColorOutput "  .\sync-checklists.ps1 -YourGitHubUsername yourusername -UpdateFork:$false" "White"
}

# Check for help parameter
if ($args -contains "-h" -or $args -contains "--help" -or $args -contains "help") {
    Show-Help
    exit 0
}

# Run main function
Main