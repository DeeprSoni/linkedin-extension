# Upload Files to Server
# Quick script to upload all necessary files

$ServerIP = "147.93.154.31"
$ServerPort = "2221"
$ServerUser = "root"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Uploading to Server: $ServerIP" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Test connection
Write-Host "Testing SSH connection..." -ForegroundColor Yellow
ssh -p $ServerPort -o ConnectTimeout=5 $ServerUser@$ServerIP "echo 'Connected successfully'" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Cannot connect to server!" -ForegroundColor Red
    Write-Host "Make sure you can connect with: ssh root@147.93.154.31 -p 2221" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Connection successful" -ForegroundColor Green
Write-Host ""

# Create directory on server
Write-Host "Creating directory on server..." -ForegroundColor Yellow
ssh -p $ServerPort $ServerUser@$ServerIP "mkdir -p /root/linkedin-agent"
Write-Host "✓ Directory created" -ForegroundColor Green
Write-Host ""

# Create .env.production if it doesn't exist
if (-not (Test-Path ".env.production")) {
    Write-Host "Creating .env.production file..." -ForegroundColor Yellow
    @"
NODE_ENV=production
PORT=3000
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=ds06bb01*
MONGO_DATABASE=linkedin_agent
REDIS_PASSWORD=ds06bb01*
JWT_SECRET=j8K3mN2pQ9vR5xT7zY4wA1bC6dE0fG
JWT_EXPIRES_IN=30d
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRICE_ID_STARTER=price_starter_id_here
STRIPE_PRICE_ID_PRO=price_pro_id_here
STRIPE_PRICE_ID_ENTERPRISE=price_enterprise_id_here
FRONTEND_URL=chrome-extension://your_extension_id_here
"@ | Out-File -FilePath .env.production -Encoding ASCII -NoNewline
    Write-Host "✓ .env.production created" -ForegroundColor Green
} else {
    Write-Host "✓ .env.production already exists" -ForegroundColor Green
}
Write-Host ""

# Upload backend folder
Write-Host "Uploading backend folder (this may take 1-2 minutes)..." -ForegroundColor Yellow
Write-Host "  Please wait..." -ForegroundColor Gray

# Create a temporary directory without node_modules
$TempBackend = "$env:TEMP\backend-upload"
if (Test-Path $TempBackend) {
    Remove-Item $TempBackend -Recurse -Force
}
New-Item -ItemType Directory -Path $TempBackend | Out-Null

# Copy backend files excluding node_modules and dist
Copy-Item "backend\*" -Destination $TempBackend -Recurse -Exclude "node_modules","dist"

scp -P $ServerPort -r $TempBackend "${ServerUser}@${ServerIP}:/root/linkedin-agent/backend"
Remove-Item $TempBackend -Recurse -Force

Write-Host "✓ Backend uploaded" -ForegroundColor Green
Write-Host ""

# Upload docker-compose.yml
Write-Host "Uploading docker-compose.yml..." -ForegroundColor Yellow
scp -P $ServerPort docker-compose.yml "${ServerUser}@${ServerIP}:/root/linkedin-agent/"
Write-Host "✓ docker-compose.yml uploaded" -ForegroundColor Green
Write-Host ""

# Upload .env.production
Write-Host "Uploading .env.production..." -ForegroundColor Yellow
scp -P $ServerPort .env.production "${ServerUser}@${ServerIP}:/root/linkedin-agent/"
Write-Host "✓ .env.production uploaded" -ForegroundColor Green
Write-Host ""

# Upload deployment script
Write-Host "Uploading deployment script..." -ForegroundColor Yellow
scp -P $ServerPort deploy-server.sh "${ServerUser}@${ServerIP}:/root/linkedin-agent/"
Write-Host "✓ Deployment script uploaded" -ForegroundColor Green
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Upload Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Connect to server:" -ForegroundColor White
Write-Host "   ssh root@147.93.154.31 -p 2221" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Run deployment:" -ForegroundColor White
Write-Host "   cd /root/linkedin-agent" -ForegroundColor Gray
Write-Host "   chmod +x deploy-server.sh" -ForegroundColor Gray
Write-Host "   bash deploy-server.sh" -ForegroundColor Gray
Write-Host ""
Write-Host "Or see DEPLOY_NOW.md for detailed instructions!" -ForegroundColor Cyan
Write-Host ""
