# Deploy to Your Server NOW!

Server: **147.93.154.31:2221**

Follow these steps EXACTLY:

---

## Step 1: Upload Files to Server (From Windows PowerShell)

Open a **NEW PowerShell window** (don't close your SSH connection).

```powershell
# Navigate to your project
cd "C:\Users\deepr\Google Drive\Personal projects\Linkedin agent"

# Create temporary upload directory on server
ssh -p 2221 root@147.93.154.31 "mkdir -p /root/linkedin-agent"

# Upload backend folder (this takes 1-2 minutes)
scp -P 2221 -r backend root@147.93.154.31:/root/linkedin-agent/

# Upload docker-compose.yml
scp -P 2221 docker-compose.yml root@147.93.154.31:/root/linkedin-agent/

# Upload deployment script
scp -P 2221 deploy-server.sh root@147.93.154.31:/root/linkedin-agent/
```

Wait for uploads to complete... ⏳

---

## Step 2: Create Production Environment File

Still in Windows PowerShell:

```powershell
# Create production env file locally first
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
"@ | Out-File -FilePath .env.production -Encoding ASCII

# Upload to server
scp -P 2221 .env.production root@147.93.154.31:/root/linkedin-agent/
```

✅ Files uploaded!

---

## Step 3: Run Deployment on Server

Now go back to your SSH window (or connect again):

```bash
ssh root@147.93.154.31 -p 2221
```

Then run these commands:

```bash
# Navigate to project
cd /root/linkedin-agent

# Make deploy script executable
chmod +x deploy-server.sh

# Run deployment (this takes 5-10 minutes)
bash deploy-server.sh
```

**Watch the output!** You'll see:
- ✅ System updating
- ✅ Docker installing
- ✅ Containers starting
- ✅ Health check

---

## Step 4: Verify Everything Works

After deployment completes, test the API:

```bash
# On the server:
curl http://localhost:3000/health
```

Should return:
```json
{
  "success": true,
  "message": "LinkedIn Agent API is running"
}
```

Check container status:
```bash
docker-compose ps
```

All 3 should show "Up":
- linkedin-agent-mongodb
- linkedin-agent-redis
- linkedin-agent-backend

✅ Server deployment complete!

---

## Step 5: Test from Windows

Open PowerShell on Windows:

```powershell
curl http://147.93.154.31:3000/health
```

Should return the same success message!

---

## Step 6: Update Chrome Extension

### 6.1: Update API URL

Edit `src\services\apiClient.ts`:

Change this line:
```typescript
const API_BASE_URL = 'http://localhost:3000/api';
```

To:
```typescript
const API_BASE_URL = 'http://147.93.154.31:3000/api';
```

### 6.2: Build Extension

```powershell
npm run build
```

### 6.3: Reload Extension in Chrome

1. Go to `chrome://extensions/`
2. Find your LinkedIn Agent extension
3. Click the reload icon (🔄)
4. **Copy the Extension ID** (long string under the name)

### 6.4: Update Server with Extension ID

```bash
# Connect to server
ssh root@147.93.154.31 -p 2221

# Edit environment file
cd /root/linkedin-agent
nano .env.production
```

Find this line:
```
FRONTEND_URL=chrome-extension://your_extension_id_here
```

Replace `your_extension_id_here` with your actual extension ID.

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

**Restart backend:**
```bash
docker-compose restart backend
```

**Exit server:**
```bash
exit
```

---

## Step 7: Test Everything!

1. Click your extension icon in Chrome
2. Try to register a new user:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Password: password123
3. Click "Create Account"
4. Should see: "Registration successful! You can now log in."
5. Login with the same credentials
6. Should see:
   - Your name
   - "FREE" plan badge
   - Credits: 50/50

✅ **EVERYTHING WORKS!**

---

## 🎉 Success!

Your LinkedIn Agent is now running on your server!

**API URL:** http://147.93.154.31:3000

**What's working:**
- ✅ Backend API on server
- ✅ MongoDB database
- ✅ Redis cache
- ✅ User registration & login
- ✅ Credit tracking
- ✅ Chrome extension connected

---

## Manage Your Server

### View Logs:
```bash
ssh root@147.93.154.31 -p 2221
cd /root/linkedin-agent
docker-compose logs -f backend
# Press Ctrl+C to exit logs
```

### Restart Services:
```bash
ssh root@147.93.154.31 -p 2221
cd /root/linkedin-agent
docker-compose restart
```

### Stop Services:
```bash
docker-compose down
```

### Start Services:
```bash
docker-compose up -d
```

### Check MongoDB Data:
```bash
docker exec -it linkedin-agent-mongodb mongosh -u admin -p ds06bb01*
use linkedin_agent
db.users.find().pretty()
exit
```

---

## Troubleshooting

### If containers won't start:

```bash
# Check logs
docker-compose logs

# Restart everything
docker-compose down
docker-compose up -d

# Check status
docker-compose ps
```

### If API not responding:

```bash
# Check if port is open
netstat -tulpn | grep 3000

# Check firewall
ufw status
# Should show: 3000/tcp ALLOW

# If not, add it:
ufw allow 3000/tcp
```

### If extension can't connect:

1. Verify API URL in `src/services/apiClient.ts`
2. Rebuild: `npm run build`
3. Reload extension in Chrome
4. Check browser console for errors
5. Verify FRONTEND_URL in server's `.env.production`

---

## Important Notes

- **Server IP:** 147.93.154.31
- **SSH Port:** 2221 (non-standard, more secure!)
- **API Port:** 3000
- **MongoDB Password:** ds06bb01*
- **Redis Password:** ds06bb01*
- **JWT Secret:** j8K3mN2pQ9vR5xT7zY4wA1bC6dE0fG

Keep these secure! 🔒

---

## Next Steps

1. ✅ Everything is deployed and working
2. Setup Stripe (optional) - Add real Stripe keys to `.env.production`
3. Get a domain name (optional) - Makes URL cleaner
4. Setup HTTPS (optional) - See SERVER_DEPLOYMENT_GUIDE.md
5. Start using your extension!

You're all set! 🚀
