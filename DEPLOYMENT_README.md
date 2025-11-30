# LinkedIn Agent - Deployment Options

Choose how you want to deploy your authentication system.

---

## 🎯 Two Deployment Options

### Option 1: Server Deployment (RECOMMENDED)

**Best for:**
- ✅ No Windows dependencies
- ✅ Professional setup
- ✅ Access from anywhere
- ✅ Easy to maintain

**Cost:** $6-12/month

**Time:** 20-30 minutes

**Start here:** `QUICK_START_SERVER.md`

---

### Option 2: Local Development (Windows)

**Best for:**
- Testing
- Development
- Learning Docker

**Cost:** Free

**Time:** 15-20 minutes

**Requires:** Docker Desktop on Windows

**Start here:** `AUTHENTICATION_SETUP_GUIDE.md`

---

## 📚 Documentation Guide

### For Server Deployment:

1. **`QUICK_START_SERVER.md`** ⭐ START HERE
   - Fastest way to deploy
   - Step-by-step with no assumptions
   - Automated deployment script

2. **`SSH_KEY_SETUP.md`**
   - Generate SSH key on Windows
   - Connect to your server
   - Required before deployment

3. **`SERVER_DEPLOYMENT_GUIDE.md`**
   - Complete detailed guide
   - Manual deployment steps
   - Troubleshooting
   - Security hardening
   - Domain & HTTPS setup

4. **`deploy-to-server.ps1`**
   - Automated deployment script
   - Run from Windows PowerShell
   - Deploys everything automatically

5. **`deploy-server.sh`**
   - Server-side automation
   - Installs Docker, dependencies
   - Starts services

6. **`.env.production.example`**
   - Production environment template
   - Copy to `.env.production`
   - Update with your values

---

### For Local Development:

1. **`AUTHENTICATION_SETUP_GUIDE.md`** ⭐ START HERE
   - Local Windows setup
   - Docker Desktop
   - Complete step-by-step guide

2. **`.env`**
   - Local environment file
   - Already configured
   - Update Stripe keys if needed

3. **`docker-compose.yml`**
   - Runs MongoDB, Redis, Backend
   - Works locally and on server

---

### General Documentation:

1. **`CHANGES_SUMMARY.md`**
   - What changed when email was removed
   - How registration works now
   - Benefits of the changes

2. **`backend/README.md`**
   - API documentation
   - All endpoints
   - Request/response examples

---

## 🚀 Quick Start Commands

### Server Deployment (Windows → Server)

```powershell
# 1. Generate SSH key
ssh-keygen -t ed25519 -C "your-email@example.com"

# 2. Create .env.production
Copy-Item .env.production.example -Destination .env.production
# Edit .env.production with your values

# 3. Deploy (ONE COMMAND!)
.\deploy-to-server.ps1 -ServerIP YOUR_SERVER_IP

# 4. Update extension API URL
# Edit src/services/apiClient.ts
# Change to: http://YOUR_SERVER_IP:3000/api

# 5. Build extension
npm run build
```

---

### Local Development (Windows Only)

```powershell
# 1. Update .env file with your values

# 2. Install backend dependencies
cd backend
npm install
cd ..

# 3. Start with Docker
docker-compose up -d

# 4. Test
curl http://localhost:3000/health

# 5. Build extension
npm run build
```

---

## 📁 File Structure

```
linkedin-agent/
├── DEPLOYMENT_README.md          ← You are here!
├── QUICK_START_SERVER.md          ← Server deployment (START HERE)
├── SSH_KEY_SETUP.md               ← SSH key setup
├── SERVER_DEPLOYMENT_GUIDE.md     ← Detailed server guide
├── AUTHENTICATION_SETUP_GUIDE.md  ← Local setup guide
├── CHANGES_SUMMARY.md             ← What changed (email removed)
│
├── deploy-to-server.ps1           ← Windows deploy script
├── deploy-server.sh               ← Server automation script
├── .env.production.example        ← Production environment template
├── .env                           ← Local environment file
├── docker-compose.yml             ← Docker configuration
│
├── backend/                       ← Backend API code
│   ├── src/
│   │   ├── config/               ← Plans, database, redis
│   │   ├── models/               ← User, UsageHistory
│   │   ├── routes/               ← Auth, credits, stripe
│   │   ├── middleware/           ← Authentication, validation
│   │   ├── services/             ← Credit service, scheduler
│   │   └── index.ts              ← Main server
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md                 ← API documentation
│
└── src/                          ← Chrome extension
    ├── services/
    │   └── apiClient.ts          ← Backend API client
    ├── components/               ← React components
    ├── popup/                    ← Extension popup
    └── utils/                    ← Credit tracker
```

---

## 🎓 Recommended Learning Path

### Beginner (Just want it working):

1. Read `QUICK_START_SERVER.md`
2. Follow step-by-step
3. Done!

### Intermediate (Want to understand):

1. Read `QUICK_START_SERVER.md`
2. Deploy to server
3. Read `SERVER_DEPLOYMENT_GUIDE.md` for details
4. Learn about Docker, MongoDB, Redis

### Advanced (Want full control):

1. Read `AUTHENTICATION_SETUP_GUIDE.md`
2. Setup locally first
3. Read `SERVER_DEPLOYMENT_GUIDE.md`
4. Deploy to server
5. Setup domain, HTTPS, monitoring
6. Read `backend/README.md` for API details

---

## ✅ What's Included

### Authentication System:
- ✅ User registration (no email verification needed)
- ✅ JWT-based login
- ✅ Secure password hashing
- ✅ Session management with Redis

### Credit Management:
- ✅ 4 plan tiers (Free, Starter, Pro, Enterprise)
- ✅ Daily credit limits (50, 200, 1000, 5000)
- ✅ Credit consumption tracking
- ✅ Automatic daily refresh
- ✅ Hard blocking when depleted
- ✅ Usage analytics

### Payment Integration:
- ✅ Stripe checkout for upgrades
- ✅ Automatic plan activation
- ✅ Webhook handling
- ✅ Subscription management

### Credit Costs:
- Profile Scan: 1 credit
- CRM Sync: 2 credits
- Bulk Message: 3 credits
- Connection Request: 5 credits

---

## 💰 Costs

### Server Deployment:
- **Server**: $6-12/month (DigitalOcean)
- **Domain**: $10/year (optional)
- **Stripe**: Free (2.9% + 30¢ per transaction)
- **First 60 days**: FREE with DigitalOcean credit

### Local Development:
- **Everything**: FREE
- No ongoing costs
- Good for testing

---

## 🔒 Security Features

- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens with expiration
- ✅ Redis session caching
- ✅ CORS protection
- ✅ Helmet.js security headers
- ✅ Environment variable secrets
- ✅ Stripe webhook verification
- ✅ Firewall configuration (server)
- ✅ SSH key authentication (server)

---

## 🐛 Troubleshooting

### Common Issues:

1. **Can't connect to server**
   - Check SSH key: `SSH_KEY_SETUP.md`
   - Verify server IP
   - Check firewall: `ufw status`

2. **API not responding**
   - Check logs: `docker-compose logs backend`
   - Verify containers running: `docker-compose ps`
   - Test health: `curl http://YOUR_IP:3000/health`

3. **Extension can't reach API**
   - Update API URL in `src/services/apiClient.ts`
   - Rebuild: `npm run build`
   - Check CORS settings
   - Verify FRONTEND_URL in `.env.production`

4. **Database connection failed**
   - Check passwords in `.env` or `.env.production`
   - Restart services: `docker-compose restart`
   - View MongoDB logs: `docker-compose logs mongodb`

See detailed troubleshooting in:
- `SERVER_DEPLOYMENT_GUIDE.md` (for server issues)
- `AUTHENTICATION_SETUP_GUIDE.md` (for local issues)

---

## 📊 Monitoring

### Server:
```bash
# View logs
docker-compose logs -f

# Check resource usage
docker stats

# Check disk space
df -h
```

### Local:
```bash
# View logs
docker-compose logs -f

# Check containers
docker-compose ps

# Check health
curl http://localhost:3000/health
```

---

## 🎯 Next Steps After Deployment

1. **Test everything:**
   - Register a user
   - Login
   - Check credits
   - Test scanning profiles
   - Verify credit deduction

2. **Setup Stripe** (optional):
   - Create products
   - Add price IDs to `.env`
   - Test with test card
   - See `AUTHENTICATION_SETUP_GUIDE.md` Part 4

3. **Get a domain** (optional):
   - Makes API URL professional
   - Required for SSL
   - See `SERVER_DEPLOYMENT_GUIDE.md` Part 6

4. **Integrate credit tracking:**
   - Update your extension code
   - Use `CreditTracker` utility
   - Track all user actions

5. **Launch!**
   - You're ready to go
   - Everything works
   - Start getting users!

---

## 💡 Pro Tips

1. **Start with server deployment** - It's easier and more practical
2. **Use test Stripe keys** until you're ready for real payments
3. **Take server snapshots** after successful setup (DigitalOcean feature)
4. **Keep `.env` files secure** - Never commit to git
5. **Monitor server costs** in your provider dashboard
6. **Setup alerts** for server downtime (optional)
7. **Backup database** regularly (automated script in guide)

---

## 🆘 Need Help?

### Quick Checks:

1. Is Docker running?
   - Local: Docker Desktop icon in taskbar
   - Server: `docker --version`

2. Are containers running?
   - `docker-compose ps`

3. Is API responding?
   - `curl http://localhost:3000/health` (local)
   - `curl http://YOUR_IP:3000/health` (server)

4. Check logs:
   - `docker-compose logs -f backend`

5. Verify environment:
   - Local: Check `.env`
   - Server: Check `.env.production`

### Still Stuck?

1. Read the detailed guides
2. Check troubleshooting sections
3. Review error messages carefully
4. Restart services: `docker-compose restart`

---

## 🎉 You're Ready!

Choose your deployment method:

**Want it on a server?** → `QUICK_START_SERVER.md`

**Want to run locally?** → `AUTHENTICATION_SETUP_GUIDE.md`

Both work great! Server deployment is recommended for production use.

Good luck! 🚀
