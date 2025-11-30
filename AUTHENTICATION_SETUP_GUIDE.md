# LinkedIn Agent - Complete Setup Guide (Step-by-Step)

**Welcome!** This guide will walk you through EVERY step to get your LinkedIn Agent authentication system running. No steps skipped, no assumptions made.

---

## 📋 What You're Setting Up

You're building a complete authentication and credit tracking system:
- **Users can register** and login
- **Track credit usage** (profile scans, messages, etc.)
- **Stripe payments** for plan upgrades
- **4 plan tiers** (Free, Starter, Pro, Enterprise)
- **Everything runs in Docker** (easy!)

---

## ⏱️ Time Estimate

- **If you have everything installed**: 15-20 minutes
- **If you need to install Docker**: 30-40 minutes
- **If you need to setup Stripe**: Add 10-15 minutes

---

## 🛠️ Part 1: Install Required Software

### Step 1.1: Install Docker Desktop

**What is Docker?** It's software that runs your database and backend in containers (like mini virtual machines). Makes setup super easy!

#### Windows:
1. Go to https://www.docker.com/products/docker-desktop/
2. Click "Download for Windows"
3. Run the installer (DockerDesktopInstaller.exe)
4. Follow the installation wizard (accept defaults)
5. **Important**: Restart your computer when asked
6. After restart, open Docker Desktop
7. Accept the service agreement
8. Skip the tutorial (or do it if you want!)

#### Mac:
1. Go to https://www.docker.com/products/docker-desktop/
2. Download for Mac (Intel or Apple Silicon - check your chip type)
3. Open the .dmg file
4. Drag Docker to Applications
5. Open Docker from Applications
6. Click "Open" when security prompt appears
7. Accept the service agreement

**Verify Docker is running:**
1. Open Terminal (Mac) or PowerShell (Windows)
2. Type: `docker --version`
3. You should see something like "Docker version 24.0.x"
4. Type: `docker-compose --version`
5. You should see something like "Docker Compose version v2.x.x"

✅ **Docker is installed!**

---

### Step 1.2: Install Node.js (if not already installed)

**What is Node.js?** JavaScript runtime that lets you build the extension.

1. Go to https://nodejs.org/
2. Download the **LTS version** (left button, green)
3. Run the installer
4. Accept all defaults and click Next → Next → Install
5. Restart your terminal/PowerShell

**Verify:**
```bash
node --version
# Should show v20.x.x or similar

npm --version
# Should show 10.x.x or similar
```

✅ **Node.js is installed!**

---

## 🔧 Part 2: Configure Your Project

### Step 2.1: Open Your Project Folder

1. Open Terminal (Mac) or PowerShell (Windows)
2. Navigate to your project:
```bash
cd "C:\Users\deepr\Google Drive\Personal projects\Linkedin agent"
```

**Tip:** On Windows, you can also:
- Right-click the folder in File Explorer
- Select "Open in Terminal" or "Open PowerShell here"

---

### Step 2.2: Generate a Secure JWT Secret

**What is JWT Secret?** A secret password that protects user login tokens. Must be random and secure!

#### On Windows (PowerShell):
Copy and paste this entire command:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

Press Enter. You'll see something like:
```
j8K3mN2pQ9vR5xT7zY4wA1bC6dE0fG
```

**Copy this string** - you'll need it in the next step!

#### On Mac/Linux (Terminal):
```bash
openssl rand -base64 32
```

**Copy the output** - you'll need it!

---

### Step 2.3: Configure Environment Variables

Environment variables are settings that tell your backend how to run.

1. **Open the `.env` file** in your project root folder
   - Use any text editor (Notepad, VS Code, Sublime, etc.)
   - File is located at: `C:\Users\deepr\Google Drive\Personal projects\Linkedin agent\.env`

2. **Update the file** - here's what to change:

```bash
# Environment
NODE_ENV=development

# Server
PORT=3000

# MongoDB - CHANGE THE PASSWORD!
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=MySecurePassword123!
MONGO_DATABASE=linkedin_agent

# Redis - CHANGE THE PASSWORD!
REDIS_PASSWORD=RedisSecurePass456!

# JWT - PASTE YOUR GENERATED SECRET HERE!
JWT_SECRET=j8K3mN2pQ9vR5xT7zY4wA1bC6dE0fG
JWT_EXPIRES_IN=30d

# Stripe - Leave these for now, we'll fill them in Part 3
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRICE_ID_STARTER=price_starter_id_here
STRIPE_PRICE_ID_PRO=price_pro_id_here
STRIPE_PRICE_ID_ENTERPRISE=price_enterprise_id_here

# Frontend - Leave this for now, we'll update it later
FRONTEND_URL=chrome-extension://your-extension-id-here
```

**What you MUST change:**
- ✅ `MONGO_ROOT_PASSWORD` - Choose a strong password
- ✅ `REDIS_PASSWORD` - Choose a different strong password
- ✅ `JWT_SECRET` - Paste the random string you generated

**Save the file!**

---

### Step 2.4: Install Backend Dependencies

This downloads all the code libraries your backend needs.

```bash
# Navigate to backend folder
cd backend

# Install dependencies (this takes 1-2 minutes)
npm install
```

You'll see a lot of text scrolling - this is normal! Wait until you see:
```
added XXX packages
```

✅ **Dependencies installed!**

---

## 🚀 Part 3: Start the Backend Services

### Step 3.1: Start Docker Services

Make sure you're in the project ROOT folder (not the backend folder):

```bash
# Go back to root
cd ..

# Verify you're in the right place
pwd
# Should show: .../Linkedin agent
```

Now start everything:

```bash
docker-compose up -d
```

**What happens:**
- `-d` means "run in background"
- Downloads Docker images (first time only, 2-5 minutes)
- Starts MongoDB (database)
- Starts Redis (cache)
- Starts your Backend API

**You'll see:**
```
[+] Running 3/3
 ✔ Container linkedin-agent-mongodb  Started
 ✔ Container linkedin-agent-redis    Started
 ✔ Container linkedin-agent-backend  Started
```

✅ **Backend is running!**

---

### Step 3.2: Verify Everything is Working

#### Check if containers are running:
```bash
docker-compose ps
```

You should see 3 services:
```
NAME                        STATUS
linkedin-agent-backend      Up
linkedin-agent-mongodb      Up
linkedin-agent-redis        Up
```

#### Test the API:
Open your web browser and go to:
```
http://localhost:3000/health
```

You should see:
```json
{
  "success": true,
  "message": "LinkedIn Agent API is running",
  "timestamp": "2024-..."
}
```

✅ **API is working!**

#### If it doesn't work:
Check the logs:
```bash
docker-compose logs backend
```

Look for errors in red. Common issues:
- Port 3000 already in use → Change PORT in .env
- MongoDB connection failed → Check MONGO_ROOT_PASSWORD matches

---

## 💳 Part 4: Setup Stripe (Payment Processing)

**Can I skip this?** Yes, but users won't be able to upgrade plans. You can do this later!

### Step 4.1: Create Stripe Account

1. Go to https://stripe.com
2. Click "Start now" (top right)
3. Fill in:
   - Email
   - Full name
   - Country
   - Password
4. Click "Create account"
5. **Verify your email** (check inbox and click link)
6. You'll see the Stripe Dashboard

---

### Step 4.2: Get Your API Keys

1. In Stripe Dashboard, click "Developers" (top right)
2. Click "API keys" in the menu
3. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...`) - NOT needed
   - **Secret key** (starts with `sk_test_...`) - YOU NEED THIS!

4. Click "Reveal test key" on the Secret key
5. **Copy the entire key** (starts with `sk_test_`)

6. Open your `.env` file
7. Replace the STRIPE_SECRET_KEY:
```bash
STRIPE_SECRET_KEY=sk_test_51P... (your actual key)
```

8. **Save the file**

---

### Step 4.3: Create Products and Prices

Now we create the 3 paid plans in Stripe.

#### Create Starter Plan:

1. In Stripe Dashboard, click "Products" (left sidebar)
2. Click "+ Add Product" (top right)
3. Fill in:
   - **Name**: `LinkedIn Agent - Starter`
   - **Description**: `200 daily credits for casual professionals`
   - **Pricing**:
     - Check ✅ "Recurring"
     - **Price**: `9.99`
     - **Currency**: `USD`
     - **Billing period**: `Monthly`
4. Click "Add product"
5. You'll see your product page
6. **Find the Price ID** - it looks like `price_1P...`
   - It's shown under "Pricing"
   - Copy it!
7. Open `.env` file
8. Paste it:
```bash
STRIPE_PRICE_ID_STARTER=price_1P... (your actual price ID)
```

#### Create Pro Plan:

Repeat the same steps:
1. Click "Products" → "+ Add Product"
2. Fill in:
   - **Name**: `LinkedIn Agent - Pro`
   - **Description**: `1,000 daily credits for power users`
   - **Price**: `29.99`
   - **Monthly recurring**
3. Add product
4. Copy the Price ID
5. Update `.env`:
```bash
STRIPE_PRICE_ID_PRO=price_1P... (your actual price ID)
```

#### Create Enterprise Plan:

Repeat again:
1. Click "Products" → "+ Add Product"
2. Fill in:
   - **Name**: `LinkedIn Agent - Enterprise`
   - **Description**: `5,000 daily credits for teams`
   - **Price**: `99.99`
   - **Monthly recurring**
3. Add product
4. Copy the Price ID
5. Update `.env`:
```bash
STRIPE_PRICE_ID_ENTERPRISE=price_1P... (your actual price ID)
```

**Save the `.env` file!**

---

### Step 4.4: Setup Webhook

Webhooks let Stripe tell your backend when payments happen.

1. In Stripe Dashboard, click "Developers" → "Webhooks"
2. Click "+ Add endpoint" (top right)
3. Fill in:
   - **Endpoint URL**: `http://localhost:3000/api/stripe/webhook`
   - **Description**: `Local development webhook`
4. Under "Select events to listen to", click "+ Select events"
5. Find and check these 5 events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
6. Click "Add events"
7. Click "Add endpoint"

8. **Get the Webhook Secret:**
   - You'll see your new webhook
   - Click on it
   - Find "Signing secret" (click "Reveal")
   - It starts with `whsec_...`
   - **Copy it!**

9. Update `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_... (your actual secret)
```

10. **Save and restart backend:**
```bash
docker-compose restart backend
```

✅ **Stripe is configured!**

**Note:** For production, you'll need to update the webhook URL to your live domain.

---

## 🎨 Part 5: Build and Install the Chrome Extension

### Step 5.1: Build the Extension

Make sure you're in the project root folder:

```bash
# Check you're in the right place
pwd
# Should show: .../Linkedin agent

# Build the extension
npm run build
```

This creates a `dist` folder with your extension.

You'll see:
```
webpack 5.x.x compiled successfully in XXXX ms
```

✅ **Extension built!**

---

### Step 5.2: Load Extension in Chrome

1. Open Google Chrome
2. Go to: `chrome://extensions/`
   - Or click the 3 dots (⋮) → Extensions → Manage Extensions

3. **Enable Developer Mode**
   - Toggle switch in top right corner
   - It should turn blue

4. **Load your extension**
   - Click "Load unpacked" (top left)
   - Browse to your project folder
   - Select the **dist** folder
   - Click "Select Folder"

5. Your extension appears!
   - You'll see "LinkedIn Connection Scanner"
   - Note the **ID** below the name (looks like: `abcdefghijklmnopqrstuvwxyz123456`)

6. **Copy the Extension ID**
   - It's a long string of random letters/numbers
   - Copy it!

---

### Step 5.3: Update Backend with Extension ID

The backend needs to know your extension ID to allow requests from it.

1. Open `.env` file
2. Update FRONTEND_URL:
```bash
FRONTEND_URL=chrome-extension://abcdefghijklmnopqrstuvwxyz123456
```
(Use YOUR actual extension ID!)

3. **Save the file**

4. **Restart the backend:**
```bash
docker-compose restart backend
```

Wait 5-10 seconds for it to restart.

✅ **Extension is installed and connected!**

---

## ✅ Part 6: Test Everything

### Step 6.1: Test User Registration

1. Click the extension icon in Chrome (puzzle piece icon in toolbar)
2. Click your LinkedIn Agent extension
3. You should see a login form
4. Click "Sign up"
5. Fill in:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Password: password123
6. Click "Create Account"

**You should see:**
```
Registration successful! You can now log in.
```

✅ **Registration works!**

---

### Step 6.2: Test Login

1. The form should switch to login mode
2. Enter:
   - Email: test@example.com
   - Password: password123
3. Click "Login"

**You should see:**
- Your name (Test User)
- Plan badge showing "FREE"
- Credit status: 50/50 credits
- All the extension buttons

✅ **Login works!**

---

### Step 6.3: Test Credit Tracking

1. Make sure you're logged in
2. Navigate to LinkedIn.com
3. Go to any profile or search results
4. Click "Start Scan" in the extension popup

**Watch the credits:**
- They should decrease as profiles are scanned
- Credit display updates in real-time
- When you hit 80% usage, warning level changes to "low"
- When you hit 90% usage, warning level changes to "critical"

✅ **Credit tracking works!**

---

### Step 6.4: Test Stripe Upgrade (Optional)

1. In the extension popup, click "Upgrade Plan"
2. You'll be taken to Stripe checkout
3. Use test card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - Name: Test User
   - ZIP: Any 5 digits (e.g., 12345)
4. Click "Subscribe"

**You should see:**
- Success page
- Back in extension, your plan updated to "STARTER" (or whatever you selected)
- Credits increased to 200/200

✅ **Payments work!**

**To cancel test subscription:**
1. Go to Stripe Dashboard
2. Click "Customers"
3. Find your test customer
4. Click on them → Subscriptions → Cancel

---

## 🔍 Part 7: Viewing Your Data

### See Users in MongoDB

```bash
# Access MongoDB shell
docker exec -it linkedin-agent-mongodb mongosh -u admin -p MySecurePassword123!
```

(Use YOUR password from .env)

In the MongoDB shell:
```javascript
// Switch to your database
use linkedin_agent

// See all users
db.users.find().pretty()

// See specific user
db.users.findOne({ email: "test@example.com" })

// Check user's credits
db.users.findOne(
  { email: "test@example.com" },
  { credits: 1, plan: 1 }
)

// Exit
exit
```

---

### See Usage History

```javascript
// In MongoDB shell:
use linkedin_agent

// See recent usage
db.usagehistories.find().sort({ timestamp: -1 }).limit(10).pretty()

// See usage for a specific user
db.usagehistories.find({ userId: "USER_ID_HERE" }).pretty()

// Count profile scans
db.usagehistories.countDocuments({ action: "profile_scan" })
```

---

### Check Redis Cache

```bash
# Access Redis CLI
docker exec -it linkedin-agent-redis redis-cli -a RedisSecurePass456!
```

(Use YOUR Redis password from .env)

```bash
# List all keys
KEYS *

# Get a session (replace USER_ID with actual ID)
GET session:USER_ID

# Exit
exit
```

---

## 🐛 Troubleshooting

### Problem: "Docker command not found"

**Solution:**
- Docker Desktop not installed or not running
- Start Docker Desktop application
- Wait for it to fully start (whale icon in taskbar)

---

### Problem: "Port 3000 already in use"

**Solution:**
1. Find what's using port 3000:

Windows:
```powershell
netstat -ano | findstr :3000
```

Mac/Linux:
```bash
lsof -i :3000
```

2. Either:
   - Kill that process, OR
   - Change the port in `.env`: `PORT=3001`
   - Update health check URL: `http://localhost:3001/health`

---

### Problem: "MongoDB connection failed"

**Solution:**
1. Check if MongoDB is running:
```bash
docker-compose ps
```

2. Check MongoDB logs:
```bash
docker-compose logs mongodb
```

3. Verify password in `.env` matches what you set
4. Restart MongoDB:
```bash
docker-compose restart mongodb
```

---

### Problem: "Extension not showing login form"

**Solution:**
1. Check if backend is running:
```bash
curl http://localhost:3000/health
```

2. Check browser console:
   - Right-click extension popup
   - Click "Inspect"
   - Look for errors in Console tab

3. Verify API URL in `src/services/apiClient.ts`:
```typescript
const API_BASE_URL = 'http://localhost:3000/api';
```

4. Rebuild extension:
```bash
npm run build
```

5. Reload extension:
   - Go to `chrome://extensions/`
   - Click the reload icon on your extension

---

### Problem: "Invalid or expired token"

**Solution:**
1. Logout and login again
2. If JWT_SECRET changed, all tokens are invalid
3. Clear extension storage:
   - Right-click extension popup
   - Inspect
   - Application tab → Storage → Clear

---

### Problem: "Stripe webhook not receiving events"

**Solution:**

For local testing, use Stripe CLI:

1. Install Stripe CLI:
   - Windows: Download from https://github.com/stripe/stripe-cli/releases
   - Mac: `brew install stripe/stripe-cli/stripe`

2. Login:
```bash
stripe login
```

3. Forward webhooks:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

4. Use the webhook secret shown in terminal
5. Update `.env` with new secret
6. Restart backend

---

### Problem: "Can't see logs or errors"

**Solution:**

View all logs:
```bash
docker-compose logs -f
```

View just backend:
```bash
docker-compose logs -f backend
```

View last 50 lines:
```bash
docker-compose logs --tail=50 backend
```

---

## 📊 Understanding the System

### Credit Costs:

| Action | Credits | When It Happens |
|--------|---------|-----------------|
| Profile Scan | 1 | Each profile viewed/scanned |
| CRM Sync | 2 | Adding lead to CRM |
| Bulk Message | 3 | Sending each message |
| Connection Request | 5 | Sending connection request |

### Plan Limits:

| Plan | Daily Credits | Price | Best For |
|------|--------------|-------|----------|
| Free | 50 | $0 | Testing, light use |
| Starter | 200 | $9.99/mo | Casual users |
| Pro | 1,000 | $29.99/mo | Power users |
| Enterprise | 5,000 | $99.99/mo | Teams |

### Credit Refresh:

- Credits refresh **every 24 hours** from last refresh
- Unused credits **do not roll over**
- Warnings at 80% and 90% usage
- **Hard block** when credits run out (can't perform actions)

---

## 🎯 Quick Reference Commands

### Start everything:
```bash
docker-compose up -d
```

### Stop everything:
```bash
docker-compose down
```

### Restart backend only:
```bash
docker-compose restart backend
```

### View logs:
```bash
docker-compose logs -f backend
```

### Rebuild and restart:
```bash
docker-compose up -d --build
```

### Check if running:
```bash
docker-compose ps
```

### Rebuild extension:
```bash
npm run build
```

### Install new backend dependencies:
```bash
cd backend
npm install
cd ..
docker-compose restart backend
```

---

## 📁 File Structure Reference

```
Linkedin agent/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── config/            # Database, Redis, Plans config
│   │   ├── models/            # User, UsageHistory models
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Auth, validation
│   │   ├── services/          # Credit service, scheduler
│   │   ├── utils/             # JWT utilities
│   │   └── index.ts           # Main server file
│   ├── package.json           # Backend dependencies
│   ├── tsconfig.json          # TypeScript config
│   └── .env.example           # Environment template
├── src/                       # Chrome extension
│   ├── services/
│   │   └── apiClient.ts       # Backend API client
│   ├── components/            # React components
│   ├── popup/                 # Extension popup
│   └── utils/                 # Credit tracker
├── docker-compose.yml         # Docker services config
├── .env                       # YOUR environment variables
└── AUTHENTICATION_SETUP_GUIDE.md  # This file!
```

---

## 🎓 Next Steps

Now that everything is running:

1. **Test all features** thoroughly
2. **Integrate credit tracking** into existing features:
   - Update connection request handler to call `CreditTracker.trackConnectionRequest()`
   - Update bulk messaging to call `CreditTracker.trackBulkMessage()`
   - Update CRM sync to call `CreditTracker.trackCRMSync()`

3. **Customize the plans** if needed:
   - Edit `backend/src/config/plans.ts`
   - Update credit costs
   - Add/remove features

4. **Deploy to production:**
   - Get a domain name
   - Deploy backend to cloud (Heroku, DigitalOcean, AWS)
   - Use managed MongoDB (MongoDB Atlas)
   - Use managed Redis (Redis Cloud)
   - Update Stripe webhook to production URL
   - Submit extension to Chrome Web Store

---

## 🆘 Still Stuck?

### Check these:

1. ✅ Docker Desktop is running (check taskbar/menu bar)
2. ✅ All containers are running: `docker-compose ps`
3. ✅ Health check works: http://localhost:3000/health
4. ✅ .env file has all values filled in
5. ✅ Extension is loaded in Chrome
6. ✅ Extension ID is updated in .env FRONTEND_URL
7. ✅ Backend was restarted after updating .env

### View comprehensive logs:

```bash
# See everything
docker-compose logs -f

# See just errors
docker-compose logs -f | grep -i error

# See MongoDB specifically
docker-compose logs -f mongodb

# See Redis specifically
docker-compose logs -f redis
```

---

## 🎉 Success Checklist

- ✅ Docker Desktop installed and running
- ✅ Node.js installed
- ✅ `.env` file configured with:
  - ✅ Secure passwords for MongoDB and Redis
  - ✅ Random JWT_SECRET
  - ✅ Stripe API keys (if using payments)
  - ✅ Chrome extension ID
- ✅ Backend running (health check returns success)
- ✅ Extension built and loaded in Chrome
- ✅ Can register new user
- ✅ Can login
- ✅ Credits display correctly
- ✅ Credits decrease when scanning profiles
- ✅ Can upgrade plan with Stripe (if configured)

**You're all set!** 🚀

Your LinkedIn Agent now has:
- Complete user authentication
- Credit-based usage tracking
- Payment processing with Stripe
- 4-tier pricing system
- Real-time credit monitoring
- Usage analytics

Start building amazing features! 💪
