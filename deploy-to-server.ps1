# LinkedIn Agent - Deploy to Server from Windows
# PowerShell script to deploy from Windows to Linux server

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,

    [Parameter(Mandatory=$false)]
    [string]$ServerUser = "root"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "LinkedIn Agent - Deploy to Server" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$ProjectPath = Get-Location

# Check if .env.production exists
if (-not (Test-Path ".env.production")) {
    Write-Host "ERROR: .env.production not found!" -ForegroundColor Red
    Write-Host "Please create .env.production first." -ForegroundColor Yellow
    Write-Host "Copy from .env.production.example and update values." -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Testing SSH connection..." -ForegroundColor Yellow
ssh -o ConnectTimeout=5 $ServerUser@$ServerIP "echo 'Connection successful'" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Cannot connect to server!" -ForegroundColor Red
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "1. Server IP is correct: $ServerIP" -ForegroundColor Yellow
    Write-Host "2. SSH key is setup (see SSH_KEY_SETUP.md)" -ForegroundColor Yellow
    Write-Host "3. Server is running" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ SSH connection successful" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Creating deployment package..." -ForegroundColor Yellow

# Create temporary directory for deployment files
$TempDir = "$env:TEMP\linkedin-agent-deploy"
if (Test-Path $TempDir) {
    Remove-Item $TempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $TempDir | Out-Null

# Copy necessary files
Write-Host "  Copying files..." -ForegroundColor Gray
Copy-Item "backend" -Destination "$TempDir\backend" -Recurse -Exclude "node_modules","dist"
Copy-Item "docker-compose.yml" -Destination "$TempDir\"
Copy-Item ".env.production" -Destination "$TempDir\"
Copy-Item "deploy-server.sh" -Destination "$TempDir\"

# Make deploy script executable
$deployScript = Get-Content "$TempDir\deploy-server.sh" -Raw
Set-Content "$TempDir\deploy-server.sh" -Value $deployScript -NoNewline

Write-Host "✓ Deployment package created" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Uploading files to server..." -ForegroundColor Yellow

# Create directory on server
ssh $ServerUser@$ServerIP "mkdir -p /root/linkedin-agent"

# Upload files using SCP
Write-Host "  Uploading backend..." -ForegroundColor Gray
scp -r "$TempDir\backend" "${ServerUser}@${ServerIP}:/root/linkedin-agent/"

Write-Host "  Uploading docker-compose.yml..." -ForegroundColor Gray
scp "$TempDir\docker-compose.yml" "${ServerUser}@${ServerIP}:/root/linkedin-agent/"

Write-Host "  Uploading .env.production..." -ForegroundColor Gray
scp "$TempDir\.env.production" "${ServerUser}@${ServerIP}:/root/linkedin-agent/"

Write-Host "  Uploading deploy script..." -ForegroundColor Gray
scp "$TempDir\deploy-server.sh" "${ServerUser}@${ServerIP}:/root/linkedin-agent/"

Write-Host "✓ Files uploaded" -ForegroundColor Green
Write-Host ""

# Clean up temp directory
Remove-Item $TempDir -Recurse -Force

Write-Host "Step 4: Running deployment script on server..." -ForegroundColor Yellow
Write-Host ""

ssh $ServerUser@$ServerIP "cd /root/linkedin-agent && chmod +x deploy-server.sh && bash deploy-server.sh"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Get server IP
Write-Host "Your API is now running at:" -ForegroundColor Yellow
Write-Host "  http://${ServerIP}:3000" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test the API:" -ForegroundColor White
Write-Host "   curl http://${ServerIP}:3000/health" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Update Chrome extension:" -ForegroundColor White
Write-Host "   Edit src/services/apiClient.ts" -ForegroundColor Gray
Write-Host "   Change API_BASE_URL to: http://${ServerIP}:3000/api" -ForegroundColor Gray
Write-Host "   Then run: npm run build" -ForegroundColor Gray
Write-Host ""
Write-Host "3. View logs:" -ForegroundColor White
Write-Host "   ssh $ServerUser@$ServerIP" -ForegroundColor Gray
Write-Host "   cd /root/linkedin-agent" -ForegroundColor Gray
Write-Host "   docker-compose logs -f" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Manage services:" -ForegroundColor White
Write-Host "   docker-compose restart  # Restart" -ForegroundColor Gray
Write-Host "   docker-compose down     # Stop" -ForegroundColor Gray
Write-Host "   docker-compose up -d    # Start" -ForegroundColor Gray
Write-Host ""
