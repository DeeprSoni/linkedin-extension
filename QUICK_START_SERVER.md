# Quick Start - Deploy to Server (No Windows Dependencies!)

This is the FASTEST way to get your LinkedIn Agent running on a server.

---

## 🎯 What You'll Have

- ✅ Everything running on a remote server
- ✅ No dependencies needed on your Windows machine
- ✅ Access from anywhere
- ✅ Professional deployment

---

## ⏱️ Total Time: 20-30 minutes

---

## 📋 Prerequisites

- Windows computer (you have this ✅)
- Credit card for server ($6-12/month)
- That's it!

---

## 🚀 Step-by-Step (Ultra Simple)

### Step 1: Generate SSH Key (5 minutes)

1. Open PowerShell
2. Run:
```powershell
ssh-keygen -t ed25519 -C "your-email@example.com"
```
3. Press ENTER 3 times (accept defaults, no passphrase)
4. View your public key:
```powershell
cat C:\Users\deepr\.ssh\id_ed25519.pub
```
5. **Copy the entire output** (starts with `ssh-ed25519`)

**Detailed guide:** See `SSH_KEY_SETUP.md`

---

### Step 2: Create Server (5 minutes)

**Recommended: DigitalOcean** (easiest)

1. Go to https://www.digitalocean.com/
2. Sign up (get $200 free credit)
3. Click "Create" → "Droplets"
4. Select:
   - **Image**: Ubuntu 22.04
   - **Plan**: $12/month (4GB RAM)
   - **Datacenter**: Closest to you
   - **Authentication**: SSH Key
     - Click "New SSH Key"
     - Paste the key you copied in Step 1
     - Name it "Windows Laptop"
5. Click "Create Droplet"
6. Wait 1 minute
7. **Copy the IP address** (e.g., 123.45.67.89)

**Detailed guide:** See `SERVER_DEPLOYMENT_GUIDE.md` Part 1

---

### Step 3: Create Production Environment File (2 minutes)

1. Copy the example file:
```powershell
Copy-Item .env.production.example -Destination .env.production
```

2. Edit `.env.production` with Notepad or VS Code

3. Update these values:
```bash
# Strong passwords (make them unique!)
MONGO_ROOT_PASSWORD=YourStrongPassword123!
REDIS_PASSWORD=DifferentPassword456!

# JWT Secret (copy from your .env file or generate new)
JWT_SECRET=j8K3mN2pQ9vR5xT7zY4wA1bC6dE0fG

# Your Chrome extension ID (get this after building)
FRONTEND_URL=chrome-extension://your_extension_id_here

# Stripe keys (optional for now)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_STARTER=price_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...
```

4. Save the file

---

### Step 4: Deploy to Server (10 minutes)

**Option A: Automated Deploy (Easiest)**

Run this ONE command:

```powershell
.\deploy-to-server.ps1 -ServerIP YOUR_SERVER_IP
```

Replace `YOUR_SERVER_IP` with the IP from Step 2 (e.g., 123.45.67.89)

That's it! The script will:
- ✅ Connect to your server
- ✅ Upload all files
- ✅ Install Docker
- ✅ Start everything
- ✅ Test the API

**Wait for it to finish** (5-10 minutes)

You'll see:
```
Deployment Complete!
Your API is now running at: http://123.45.67.89:3000
```

---

**Option B: Manual Deploy**

See `SERVER_DEPLOYMENT_GUIDE.md` for detailed manual steps.

---

### Step 5: Update Chrome Extension (3 minutes)

1. Edit `src/services/apiClient.ts`:

Change this line:
```typescript
const API_BASE_URL = 'http://localhost:3000/api';
```

To:
```typescript
const API_BASE_URL = 'http://YOUR_SERVER_IP:3000/api';
```

2. Build the extension:
```powershell
npm run build
```

3. Reload extension in Chrome:
   - Go to `chrome://extensions/`
   - Click reload icon on your extension

4. Get your extension ID:
   - It's shown under your extension name
   - Copy it (long string like `abcdefgh...`)

5. Update `.env.production` on your server:

```powershell
# Connect to server
ssh root@YOUR_SERVER_IP

# Edit .env.production
cd /root/linkedin-agent
nano .env.production

# Update this line:
FRONTEND_URL=chrome-extension://YOUR_EXTENSION_ID_HERE

# Save: Ctrl+X, Y, Enter

# Restart backend
docker-compose restart backend

# Exit
exit
```

---

### Step 6: Test Everything (2 minutes)

1. **Test API from Windows:**
```powershell
curl http://YOUR_SERVER_IP:3000/health
```

Should return:
```json
{
  "success": true,
  "message": "LinkedIn Agent API is running"
}
```

2. **Test Extension:**
   - Click extension icon
   - Try to register a new account
   - Login
   - Check credits display

✅ **Everything works!**

---

## 🎉 You're Done!

Your LinkedIn Agent is now running on a professional server!

**What you have:**
- ✅ Backend API on server (accessible from anywhere)
- ✅ MongoDB database (persistent storage)
- ✅ Redis cache (fast performance)
- ✅ Chrome extension connected to server
- ✅ No dependencies on your Windows machine!

---

## 📊 Managing Your Server

### View Logs

```powershell
# Connect to server
ssh root@YOUR_SERVER_IP

# View backend logs
cd /root/linkedin-agent
docker-compose logs -f backend

# Exit logs: Ctrl+C
# Exit server: exit
```

---

### Restart Services

```powershell
ssh root@YOUR_SERVER_IP
cd /root/linkedin-agent
docker-compose restart
```

---

### Stop Services (to save costs)

```powershell
ssh root@YOUR_SERVER_IP
cd /root/linkedin-agent
docker-compose down
```

---

### Start Services Again

```powershell
ssh root@YOUR_SERVER_IP
cd /root/linkedin-agent
docker-compose up -d
```

---

### Update Code (After Changes)

After you make changes to your code:

```powershell
# Deploy updated code
.\deploy-to-server.ps1 -ServerIP YOUR_SERVER_IP

# Or manually:
ssh root@YOUR_SERVER_IP
cd /root/linkedin-agent
docker-compose up -d --build
```

---

## 💰 Server Costs

**DigitalOcean:**
- $6/month: 2GB RAM (minimum, might be slow)
- $12/month: 4GB RAM (recommended)
- $24/month: 8GB RAM (for heavy usage)

**First 60 days:** FREE ($200 credit)

You can destroy the server anytime to stop billing!

---

## 🔒 Security (Do This Later)

After everything works, improve security:

1. **Setup domain name** (optional but recommended)
   - Buy domain from Namecheap ($10/year)
   - Point to your server IP
   - Setup SSL with Let's Encrypt (free)
   - See `SERVER_DEPLOYMENT_GUIDE.md` Part 6

2. **Change SSH port** (prevent bots)
3. **Disable root login** (more secure)
4. **Setup automatic backups**

All detailed in `SERVER_DEPLOYMENT_GUIDE.md`

---

## 🐛 Troubleshooting

### Extension can't connect to API

1. Check firewall allows port 3000:
```powershell
ssh root@YOUR_SERVER_IP
ufw status
# Should show: 3000/tcp ALLOW
```

2. Test from Windows:
```powershell
curl http://YOUR_SERVER_IP:3000/health
```

3. Check backend logs:
```powershell
ssh root@YOUR_SERVER_IP
cd /root/linkedin-agent
docker-compose logs backend
```

---

### Services not starting

```powershell
ssh root@YOUR_SERVER_IP
cd /root/linkedin-agent

# Check status
docker-compose ps

# Check logs
docker-compose logs

# Restart
docker-compose restart
```

---

### Forgot server IP

1. Login to DigitalOcean
2. Click "Droplets"
3. Your server is listed with IP

---

## 📚 Full Documentation

- **`SSH_KEY_SETUP.md`** - Detailed SSH setup
- **`SERVER_DEPLOYMENT_GUIDE.md`** - Complete deployment guide
- **`AUTHENTICATION_SETUP_GUIDE.md`** - Local setup (if you want)

---

## ✅ Success Checklist

- ✅ SSH key generated
- ✅ Server created on DigitalOcean
- ✅ `.env.production` configured
- ✅ Code deployed to server
- ✅ API returns health check
- ✅ Extension updated with server IP
- ✅ Can register and login
- ✅ Credits tracking works

**You're all set!** 🎊

---

## 🎯 What's Next?

1. **Setup Stripe** for payments (optional)
   - See `AUTHENTICATION_SETUP_GUIDE.md` Part 4
   - Use test mode first

2. **Get a domain name** (optional but professional)
   - Makes API URL cleaner
   - Required for SSL/HTTPS
   - See `SERVER_DEPLOYMENT_GUIDE.md` Part 6

3. **Setup monitoring** (optional)
   - Get alerts if server goes down
   - Track resource usage

4. **Start using your extension!**
   - Everything works now
   - Users can register from anywhere
   - Credits tracked centrally

---

## 💡 Pro Tips

1. **Save your server IP** somewhere safe
2. **Backup your `.env.production`** file
3. **Take a snapshot** of your server after setup (DigitalOcean feature)
4. **Monitor costs** in DigitalOcean dashboard
5. **Don't forget** to update extension ID in `.env.production`

---

## Need Help?

1. Check logs: `docker-compose logs -f`
2. Restart services: `docker-compose restart`
3. Review guides: `SERVER_DEPLOYMENT_GUIDE.md`
4. Test API: `curl http://YOUR_SERVER_IP:3000/health`

---

**Congratulations!** You now have a production-ready LinkedIn Agent running on a professional server! 🚀
