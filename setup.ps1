# Uboho Dashboard Setup Script for Windows PowerShell
# This script automates the installation and setup process

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "       Uboho Dashboard Setup Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
    
    # Check if version is 18 or higher
    $versionNumber = [version]($nodeVersion -replace 'v', '')
    if ($versionNumber.Major -lt 18) {
        Write-Host "⚠ Warning: Node.js version 18.0.0 or higher is recommended" -ForegroundColor Red
        Write-Host "Current version: $nodeVersion" -ForegroundColor Red
        Write-Host "Please update Node.js from https://nodejs.org/" -ForegroundColor Red
        $continue = Read-Host "Continue anyway? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            exit 1
        }
    }
} catch {
    Write-Host "✗ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Write-Host "Then restart this script." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm is installed
Write-Host "Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm is installed: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm is not installed or not in PATH" -ForegroundColor Red
    Write-Host "npm usually comes with Node.js. Please reinstall Node.js." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Installing project dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
Write-Host ""

# Install dependencies
try {
    npm install
    Write-Host ""
    Write-Host "✓ Dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Clear npm cache: npm cache clean --force" -ForegroundColor White
    Write-Host "2. Delete node_modules folder and package-lock.json" -ForegroundColor White
    Write-Host "3. Run: npm install" -ForegroundColor White
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "           Setup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run 'npm run dev' to start the development server" -ForegroundColor White
Write-Host "2. Open your browser to http://localhost:5173" -ForegroundColor White
Write-Host "3. Start developing!" -ForegroundColor White
Write-Host ""

$startServer = Read-Host "Would you like to start the development server now? (y/N)"
if ($startServer -eq "y" -or $startServer -eq "Y") {
    Write-Host ""
    Write-Host "Starting development server..." -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop the server when you're done." -ForegroundColor Yellow
    Write-Host ""
    npm run dev
} else {
    Write-Host ""
    Write-Host "Setup complete! Run 'npm run dev' when you're ready to start." -ForegroundColor Green
    Write-Host ""
}

Read-Host "Press Enter to exit"
