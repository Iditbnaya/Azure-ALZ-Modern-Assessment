# ALZ Assessment Tool - Development Server (PowerShell)
# Simple HTTP server for testing the web application locally

param(
    [int]$Port = 8000,
    [string]$HostName = "localhost"
)

# Function to check if port is available
function Test-Port {
    param([int]$PortNumber)
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $PortNumber)
        $listener.Start()
        $listener.Stop()
        return $true
    }
    catch {
        return $false
    }
}

# Function to open browser
function Start-Browser {
    param(
        [string]$Url,
        [int]$DelaySeconds = 3
    )
    
    Write-Host "🌐 Opening browser in $DelaySeconds seconds..." -ForegroundColor Green
    
    # Start browser in background after delay
    Start-Job -ScriptBlock {
        param($Url, $Delay)
        Start-Sleep $Delay
        try {
            Start-Process $Url
        }
        catch {
            # Fallback for different systems
            try {
                & cmd /c start $Url
            }
            catch {
                Write-Host "Could not open browser automatically. Please visit: $Url" -ForegroundColor Yellow
            }
        }
    } -ArgumentList $Url, $DelaySeconds | Out-Null
}

# Function to start simple HTTP server
function Start-WebServer {
    param(
        [string]$WebPath,
        [int]$Port,
        [string]$HostName
    )
    
    Write-Host "🚀 ALZ Assessment Tool Development Server" -ForegroundColor Green
    Write-Host "📁 Serving from: $WebPath" -ForegroundColor Cyan
    Write-Host "🌐 Server starting at http://${HostName}:${Port}/" -ForegroundColor Yellow
    Write-Host "🧪 Test page: http://${HostName}:${Port}/test.html" -ForegroundColor Yellow
    Write-Host "📊 Main app: http://${HostName}:${Port}/index.html" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor White
    Write-Host "=" * 60 -ForegroundColor Gray
    
    # Open browser automatically
    $appUrl = "http://${HostName}:${Port}/index.html"
    Start-Browser -Url $appUrl -DelaySeconds 3
    
    # Use Python if available, otherwise use PowerShell's built-in capabilities
    if (Get-Command python -ErrorAction SilentlyContinue) {
        Push-Location $WebPath
        try {
            python -m http.server $Port --bind $HostName
        }
        finally {
            Pop-Location
        }
    }
    elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
        Push-Location $WebPath
        try {
            python3 -m http.server $Port --bind $HostName
        }
        finally {
            Pop-Location
        }
    }
    else {
        Write-Host "Python not found. Please install Python or use IIS Express." -ForegroundColor Red
        Write-Host ""
        Write-Host "Alternative options:" -ForegroundColor Yellow
        Write-Host "1. Install Python: https://python.org/downloads/" -ForegroundColor White
        Write-Host "2. Use Node.js: npm install -g http-server and http-server $WebPath" -ForegroundColor White
        Write-Host "3. Use Visual Studio Code Live Server extension" -ForegroundColor White
        exit 1
    }
}

# Main execution
try {
    # Get script directory
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $webDir = Join-Path $scriptDir "web-assessment"
    
    # Check if web directory exists
    if (-not (Test-Path $webDir)) {
        Write-Host " Web directory not found: $webDir" -ForegroundColor Red
        Write-Host "Please run this script from the ALZ Assessment root directory." -ForegroundColor Yellow
        exit 1
    }
    
    # Check if port is available
    if (-not (Test-Port -PortNumber $Port)) {
        Write-Host "Port $Port is already in use." -ForegroundColor Red
        Write-Host "Try a different port: .\serve.ps1 -Port 8080" -ForegroundColor Yellow
        exit 1
    }
    
    # Start the server
    Start-WebServer -WebPath $webDir -Port $Port -HostName $HostName
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    Write-Host "Server stopped" -ForegroundColor Yellow
}
