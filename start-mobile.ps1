# ScanTrak Mobile Development Setup
# This script helps you test the camera on mobile devices

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  ScanTrak Mobile Testing Setup  " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if ngrok is installed
$ngrokInstalled = Get-Command ngrok -ErrorAction SilentlyContinue

if (-not $ngrokInstalled) {
    Write-Host "ngrok is not installed." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor White
    Write-Host "1. Install ngrok via npm: npm install -g ngrok" -ForegroundColor Green
    Write-Host "2. Download from: https://ngrok.com/download" -ForegroundColor Green
    Write-Host ""
    Write-Host "After installing ngrok, run this script again." -ForegroundColor Yellow
    Write-Host ""
    
    # Offer to start without HTTPS
    $choice = Read-Host "Start dev server on local network WITHOUT HTTPS? (y/n)"
    if ($choice -eq "y" -or $choice -eq "Y") {
        Write-Host ""
        Write-Host "Starting dev server on local network..." -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  WARNING: Camera will NOT work on mobile without HTTPS!" -ForegroundColor Red
        Write-Host "   Use manual QR input instead." -ForegroundColor Yellow
        Write-Host ""
        npm run dev -- --host
    }
    exit
}

Write-Host "✓ ngrok found!" -ForegroundColor Green
Write-Host ""
Write-Host "Starting development server..." -ForegroundColor Cyan
Write-Host ""

# Start dev server in background
Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev -- --host
} -Name "ViteServer"

# Wait for server to start
Write-Host "Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Get the port from vite.config.js (default 5173)
$port = 5173

Write-Host ""
Write-Host "Starting ngrok tunnel on port $port..." -ForegroundColor Cyan
Write-Host ""

# Start ngrok
Write-Host "================================" -ForegroundColor Green
Write-Host "Your HTTPS URL will appear below" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Open this URL on your mobile device to test the camera!" -ForegroundColor Yellow
Write-Host ""

ngrok http $port

# Cleanup on exit
Stop-Job -Name "ViteServer" -ErrorAction SilentlyContinue
Remove-Job -Name "ViteServer" -ErrorAction SilentlyContinue
