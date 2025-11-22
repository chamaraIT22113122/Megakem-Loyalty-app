# Deployment Script for Megakem Loyalty App

Write-Host "🚀 Megakem Loyalty App - Deployment Script" -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

# Check if Git is installed
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git is not installed. Please install Git first." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Step 1: Committing changes to Git..." -ForegroundColor Yellow
git add .
git status

$commitMessage = Read-Host "`nEnter commit message (or press Enter for default)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Deploy: Updated Megakem Loyalty App"
}

git commit -m "$commitMessage"
git push origin main

Write-Host "`n✅ Changes committed and pushed to GitHub!" -ForegroundColor Green

Write-Host "`n🌐 Step 2: Choose Deployment Platform" -ForegroundColor Yellow
Write-Host "1. Render (Recommended - Free tier)" -ForegroundColor White
Write-Host "2. Vercel" -ForegroundColor White
Write-Host "3. Heroku" -ForegroundColor White
Write-Host "4. Docker (Local/VPS)" -ForegroundColor White
Write-Host "5. Manual (I'll deploy myself)" -ForegroundColor White

$choice = Read-Host "`nEnter your choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host "`n📖 Deploying to Render..." -ForegroundColor Cyan
        Write-Host "`nFollow these steps:" -ForegroundColor White
        Write-Host "1. Go to https://dashboard.render.com/" -ForegroundColor Gray
        Write-Host "2. Create a new Web Service for backend (Root: backend)" -ForegroundColor Gray
        Write-Host "3. Add environment variables: MONGODB_URI, JWT_SECRET" -ForegroundColor Gray
        Write-Host "4. Create a Static Site for frontend (Root: frontend)" -ForegroundColor Gray
        Write-Host "5. Update frontend/.env.production with backend URL" -ForegroundColor Gray
        Write-Host "`nOpening Render dashboard..." -ForegroundColor Yellow
        Start-Process "https://dashboard.render.com/"
    }
    "2" {
        Write-Host "`n📖 Deploying to Vercel..." -ForegroundColor Cyan
        if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
            Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
            npm install -g vercel
        }
        Write-Host "`nDeploying backend..." -ForegroundColor Yellow
        Set-Location backend
        vercel --prod
        Set-Location ..
        Write-Host "`nDeploying frontend..." -ForegroundColor Yellow
        Set-Location frontend
        vercel --prod
        Set-Location ..
    }
    "3" {
        Write-Host "`n📖 Deploying to Heroku..." -ForegroundColor Cyan
        if (!(Get-Command heroku -ErrorAction SilentlyContinue)) {
            Write-Host "❌ Heroku CLI not installed. Install from: https://devcenter.heroku.com/articles/heroku-cli" -ForegroundColor Red
            Start-Process "https://devcenter.heroku.com/articles/heroku-cli"
            exit 1
        }
        $appName = Read-Host "Enter your Heroku app name prefix (e.g., megakem)"
        Write-Host "`nCreating Heroku apps..." -ForegroundColor Yellow
        heroku create "$appName-backend"
        heroku create "$appName-frontend"
        Write-Host "`nSet environment variables in Heroku dashboard" -ForegroundColor Yellow
        Start-Process "https://dashboard.heroku.com/apps"
    }
    "4" {
        Write-Host "`n🐳 Deploying with Docker..." -ForegroundColor Cyan
        if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
            Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
            Start-Process "https://www.docker.com/products/docker-desktop"
            exit 1
        }
        Write-Host "`nBuilding and starting containers..." -ForegroundColor Yellow
        docker-compose up -d --build
        Write-Host "`n✅ App is running at http://localhost" -ForegroundColor Green
        Write-Host "Backend: http://localhost:5000" -ForegroundColor Gray
        Write-Host "Frontend: http://localhost" -ForegroundColor Gray
    }
    "5" {
        Write-Host "`n📖 Manual Deployment Instructions" -ForegroundColor Cyan
        Write-Host "Check DEPLOYMENT.md for detailed instructions" -ForegroundColor White
        Start-Process "DEPLOYMENT.md"
    }
    default {
        Write-Host "`n❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n✨ Deployment process initiated!" -ForegroundColor Green
Write-Host "📖 See DEPLOYMENT.md for detailed instructions" -ForegroundColor Cyan
Write-Host "`n⚠️  Don't forget to:" -ForegroundColor Yellow
Write-Host "  1. Update .env.production with your backend URL" -ForegroundColor Gray
Write-Host "  2. Seed admin user after deployment" -ForegroundColor Gray
Write-Host "  3. Test the application" -ForegroundColor Gray
