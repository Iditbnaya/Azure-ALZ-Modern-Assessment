# ALZ Assessment Tool - Checklist Sync Script
# Syncs checklists directly from Azure/review-checklists repository

param(
    [string]$ChecklistTypes = "",
    [switch]$BackupExisting = $true,
    [switch]$PreserveCustomAI = $true,
    [switch]$DryRun = $false,
    [switch]$Help = $false
)

# Configuration
$SourceRepo = "Azure/review-checklists"
$LocalChecklistPath = "web-assessment/review-checklists/checklists"
$BackupPath = "backups/checklists-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"

# Function to write colored output
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

# Function to backup existing checklists
function Backup-ExistingChecklists {
    if (Test-Path $LocalChecklistPath) {
        Write-ColorOutput " Creating backup of existing checklists..." "Yellow"
        
        if (-not (Test-Path "backups")) {
            New-Item -ItemType Directory -Path "backups" | Out-Null
        }
        
        Copy-Item -Path $LocalChecklistPath -Destination $BackupPath -Recurse
        Write-ColorOutput " Backup created at: $BackupPath" "Green"
        return $true
    }
    else {
        Write-ColorOutput "  No existing checklists found to backup" "Yellow"
        return $false
    }
}

# Function to filter checklist types
function Get-FilteredChecklists {
    param([array]$AllFiles, [string]$FilterTypes)
    
    if (-not $FilterTypes) {
        return $AllFiles
    }
    
    $Types = $FilterTypes.Split(',').Trim()
    $FilteredFiles = @()
    
    foreach ($Type in $Types) {
        $Pattern = "${Type}_checklist*.json"
        $MatchingFiles = $AllFiles | Where-Object { $_.name -like $Pattern }
        $FilteredFiles += $MatchingFiles
    }
    
    return $FilteredFiles
}

# Function to download checklists directly from Azure GitHub repository
function Get-Checklists {
    Write-ColorOutput " Downloading latest checklists from $SourceRepo..." "Yellow"
    
    # Create directory if it doesn't exist
    if (-not (Test-Path $LocalChecklistPath)) {
        New-Item -ItemType Directory -Path $LocalChecklistPath -Force | Out-Null
    }
    
    # Get list of checklist files from GitHub API
    try {
        $ApiUrl = "https://api.github.com/repos/$SourceRepo/contents/checklists"
        Write-ColorOutput " Fetching checklist file list from Azure repository..." "Cyan"
        
        if ($DryRun) {
            Write-ColorOutput "[DRY RUN] Would fetch from: $ApiUrl" "Gray"
            return $true
        }
        
        $Response = Invoke-RestMethod -Uri $ApiUrl -Method Get
        $AllJsonFiles = $Response | Where-Object { $_.name -like "*.json" }
        
        # Filter files if specific types requested
        $JsonFiles = Get-FilteredChecklists -AllFiles $AllJsonFiles -FilterTypes $ChecklistTypes
        
        if ($ChecklistTypes) {
            Write-ColorOutput " Found $($JsonFiles.Count) checklist files matching types: $ChecklistTypes" "Green"
        } else {
            Write-ColorOutput " Found $($JsonFiles.Count) checklist files" "Green"
        }
        
        # Download each file
        foreach ($File in $JsonFiles) {
            $DownloadUrl = $File.download_url
            $LocalFilePath = Join-Path $LocalChecklistPath $File.name
            
            Write-ColorOutput "  Downloading: $($File.name)" "Cyan"
            
            try {
                Invoke-WebRequest -Uri $DownloadUrl -OutFile $LocalFilePath
                Write-ColorOutput " Downloaded: $($File.name)" "Green"
            }
            catch {
                Write-ColorOutput " Failed to download $($File.name): $($_.Exception.Message)" "Red"
            }
        }
        
        return $true
    }
    catch {
        Write-ColorOutput " Error accessing GitHub API: $($_.Exception.Message)" "Red"
        return $false
    }
}

# Function to preserve custom checklists
function Set-CustomChecklists {
    Write-ColorOutput " Preserving custom AI Landing Zone checklist..." "Yellow"
    
    $CustomAiFile = Join-Path $LocalChecklistPath "ai_lz_checklist.en.json"
    $BackupAiFile = Join-Path $BackupPath "ai_lz_checklist.en.json"
    
    if ((Test-Path $BackupAiFile) -and (Test-Path $CustomAiFile)) {
        # Compare files to see if we should keep the custom version
        $CustomContent = Get-Content $BackupAiFile -Raw
        $NewContent = Get-Content $CustomAiFile -Raw
        
        if ($CustomContent -ne $NewContent) {
            Write-ColorOutput "  Custom AI Landing Zone checklist detected" "Yellow"
            Write-ColorOutput " Restoring your custom AI Landing Zone checklist..." "Cyan"
            Copy-Item $BackupAiFile $CustomAiFile -Force
            Write-ColorOutput " Custom AI checklist preserved" "Green"
        }
    }
}

# Main execution
function Start-Main {
    Write-ColorOutput "🚀 ALZ Assessment Checklist Sync Tool" "Green"
    Write-ColorOutput "Syncing directly from Azure/review-checklists repository" "Cyan"
    Write-ColorOutput "==================================================" "Gray"
    
    # Step 1: Backup existing checklists
    if ($BackupExisting) {
        Backup-ExistingChecklists
    }
    
    # Step 2: Download latest checklists directly from Azure
    if (Get-Checklists) {
        Write-ColorOutput " Checklists updated successfully!" "Green"
        
        # Step 3: Preserve custom checklists
        if ($PreserveCustomAI -and $BackupExisting -and (Test-Path $BackupPath)) {
            Set-CustomChecklists
        }
        
        Write-ColorOutput "" 
        Write-ColorOutput " Summary:" "Yellow"
        Write-ColorOutput "- Source: $SourceRepo (official Azure repository)" "White"
        Write-ColorOutput "- Local path: $LocalChecklistPath" "White"
        if ($ChecklistTypes) {
            Write-ColorOutput "- Filtered types: $ChecklistTypes" "White"
        }
        if ($BackupExisting) {
            Write-ColorOutput "- Backup: $BackupPath" "White"
        }
        if ($PreserveCustomAI) {
            Write-ColorOutput "- Custom AI checklist: preserved" "White"
        }
        Write-ColorOutput ""
        Write-ColorOutput " Sync completed! Your assessment tool now has the latest checklists." "Green"
    }
    else {
        Write-ColorOutput " Failed to update checklists" "Red"
        exit 1
    }
}

# Help function
function Show-Help {
    Write-ColorOutput "ALZ Assessment Checklist Sync Tool" "Green"
    Write-ColorOutput "Syncs checklists directly from Azure/review-checklists repository" "Cyan"
    Write-ColorOutput ""
    Write-ColorOutput "USAGE:" "Yellow"
    Write-ColorOutput "  .\sync-checklists.ps1 [-ChecklistTypes <types>] [-BackupExisting] [-PreserveCustomAI] [-DryRun]" "White"
    Write-ColorOutput ""
    Write-ColorOutput "PARAMETERS:" "Yellow"
    Write-ColorOutput "  -ChecklistTypes      Comma-separated list of specific types to sync (e.g., 'aks,appsvc,security')" "White"
    Write-ColorOutput "  -BackupExisting      Backup existing checklists before update (default: true)" "White"
    Write-ColorOutput "  -PreserveCustomAI    Preserve custom AI Landing Zone checklist (default: true)" "White"
    Write-ColorOutput "  -DryRun              Show what would be done without making changes" "White"
    Write-ColorOutput "  -Help                Show this help message" "White"
    Write-ColorOutput ""
    Write-ColorOutput "EXAMPLES:" "Yellow"
    Write-ColorOutput "  .\sync-checklists.ps1                                    # Sync all checklists" "White"
    Write-ColorOutput "  .\sync-checklists.ps1 -ChecklistTypes 'aks,appsvc'       # Sync only AKS and App Service" "White"
    Write-ColorOutput "  .\sync-checklists.ps1 -DryRun                           # Preview changes without applying" "White"
    Write-ColorOutput "  .\sync-checklists.ps1 -PreserveCustomAI:`$false          # Don't preserve custom AI checklist" "White"
    Write-ColorOutput ""
    Write-ColorOutput "NOTES:" "Yellow"
    Write-ColorOutput "  - No GitHub account or fork required - syncs directly from Azure repository" "White"
    Write-ColorOutput "  - Custom AI Landing Zone checklists are automatically preserved" "White"
    Write-ColorOutput "  - Backups are created with timestamps for easy rollback" "White"
}

# Check for help parameter
if ($Help -or $args -contains "-h" -or $args -contains "--help" -or $args -contains "help") {
    Show-Help
    exit 0
}

# Run main function
Start-Main
