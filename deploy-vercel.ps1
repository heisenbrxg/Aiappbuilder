# Starsky-v3 Vercel Deployment Script for Windows

# Check if Vercel CLI is installed
try {
    vercel --version | Out-Null
} catch {
    Write-Host "Vercel CLI is not installed. Installing..."
    try {
        npm install -g vercel
    } catch {
        Write-Host "Failed to install Vercel CLI. Please install it manually with: npm install -g vercel" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n🚀 Starsky-v3 Vercel Deployment Script 🚀`n" -ForegroundColor Cyan

# Ask for environment
$environment = Read-Host "Deploy to which environment? (production/preview/development) [production]"
if ([string]::IsNullOrWhiteSpace($environment)) {
    $environment = "production"
}

if ($environment -notin @("production", "preview", "development")) {
    Write-Host "Invalid environment. Please choose production, preview, or development." -ForegroundColor Red
    exit 1
}

Write-Host "`nPreparing to deploy to $environment..." -ForegroundColor Yellow

# Build the deployment command
$deployCommand = "vercel"
if ($environment -eq "production") {
    $deployCommand += " --prod"
}

# Add confirmation before proceeding
$confirmation = Read-Host "`nReady to deploy to $environment? (y/n)"
if ($confirmation -notmatch "^[yY]") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host "`nDeploying to Vercel..." -ForegroundColor Cyan

try {
    # Execute the deployment
    Invoke-Expression $deployCommand
    Write-Host "`n✅ Deployment initiated successfully!" -ForegroundColor Green
    Write-Host "`nYou can check the status of your deployment on the Vercel dashboard."
} catch {
    Write-Host "`n❌ Deployment failed: $_" -ForegroundColor Red
    Write-Host "`nTroubleshooting tips:" -ForegroundColor Yellow
    Write-Host "1. Make sure you are logged in to Vercel (run 'vercel login')"
    Write-Host "2. Check your vercel.json configuration"
    Write-Host "3. Verify your project settings in the Vercel dashboard"
} 