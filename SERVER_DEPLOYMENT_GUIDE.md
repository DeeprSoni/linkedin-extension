# LinkedIn Agent - Server Deployment Guide

Deploy your LinkedIn Agent backend to a remote server (no Windows dependencies needed!).

---

## 📋 What You'll Deploy

- **Backend API** (Node.js + Express)
- **MongoDB** (Database)
- **Redis** (Cache)
- Everything runs in **Docker containers** on your server
- **Accessible from anywhere** via your server's IP/domain

---

## ⏱️ Time Estimate

- **With existing server**: 15-20 minutes
- **Setting up new server**: Add 10 minutes

---

## 🖥️ Part 1: Get a Server

You need a Linux server. Here are the best options:

### Option A: DigitalOcean (Recommended - Easiest)

**Why:** Simple dashboard, great documentation, $6/month

1. Go to https://www.digitalocean.com/
2. Sign up (get $200 credit for 60 days)
3. Click "Create" → "Droplets"
4. Choose:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($6/month or $12/month recommended)
   - **CPU**: Regular (2 GB RAM minimum)
   - **Datacenter**: Closest to you
   - **Authentication**: SSH Key (add yours from SSH_KEY_SETUP.md)
   - **Hostname**: linkedin-agent
5. Click "Create Droplet"
6. Wait 1 minute
7. **Copy the IP address** (e.g., 123.456.789.10)

✅ **Server created!**

### Option B: AWS EC2 (More complex, but scalable)

1. Go to AWS Console → EC2
2. Launch Instance
3. Choose Ubuntu 22.04
4. t2.small or t2.medium
5. Create or use existing key pair
6. Allow ports 22, 80, 443, 3000
7. Launch and get IP

### Option C: Other Providers

- **Vultr**: Similar to DigitalOcean
- **Linode**: Good alternative
- **Hetzner**: Cheap Europe-based
- **Your own server**: Any Linux server with Docker

**Server Requirements:**
- **OS**: Ubuntu 20.04+ or Debian 10+
- **RAM**: 2 GB minimum (4 GB recommended)
- **Storage**: 20 GB minimum
- **Ports**: 22 (SSH), 3000 (API), 80/443 (optional for domain)

---

## 🔑 Part 2: Setup SSH Access

Follow **SSH_KEY_SETUP.md** to:
1. Generate SSH key on your Windows machine
2. Add key to your server
3. Test connection

**Quick test:**
```powershell
ssh root@YOUR_SERVER_IP
```

You should connect without password!

---

## 🚀 Part 3: Setup Server

### Step 3.1: Connect to Server

From PowerShell on Windows:

```powershell
ssh root@YOUR_SERVER_IP
```

You're now on the server! 🎉

---

### Step 3.2: Update System

```bash
# Update package list
apt update

# Upgrade packages
apt upgrade -y
```

This takes 2-5 minutes.

---

### Step 3.3: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version
```

You should see:
```
Docker version 24.x.x
Docker Compose version v2.x.x
```

✅ **Docker installed!**

---

### Step 3.4: Install Git

```bash
apt install git -y

git --version
```

✅ **Git installed!**

---

## 📦 Part 4: Deploy Your Application

### Step 4.1: Clone Your Repository

**Option A: If you have GitHub/GitLab repo:**

```bash
cd /root
git clone https://github.com/YOUR_USERNAME/linkedin-agent.git
cd linkedin-agent
```

**Option B: Upload from Windows (No Git):**

On your Windows machine, create a zip file:
1. Right-click project folder
2. Send to → Compressed (zipped) folder
3. Name it `linkedin-agent.zip`

Upload to server:
```powershell
# On Windows PowerShell
scp "C:\Users\deepr\Google Drive\Personal projects\Linkedin agent\linkedin-agent.zip" root@YOUR_SERVER_IP:/root/
```

Then on server:
```bash
cd /root
apt install unzip -y
unzip linkedin-agent.zip
cd linkedin-agent
```

---

### Step 4.2: Create Production Environment File

On the server:

```bash
nano .env.production
```

Paste this (update with YOUR values):

```bash
# Environment
NODE_ENV=production

# Server
PORT=3000

# MongoDB
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=YOUR_SECURE_PASSWORD_HERE
MONGO_DATABASE=linkedin_agent

# Redis
REDIS_PASSWORD=YOUR_REDIS_PASSWORD_HERE

# JWT - Use your generated secret
JWT_SECRET=YOUR_JWT_SECRET_HERE
JWT_EXPIRES_IN=30d

# Stripe
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY_OR_TEST
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
STRIPE_PRICE_ID_STARTER=price_YOUR_ID
STRIPE_PRICE_ID_PRO=price_YOUR_ID
STRIPE_PRICE_ID_ENTERPRISE=price_YOUR_ID

# Frontend - Your Chrome Extension ID
FRONTEND_URL=chrome-extension://YOUR_EXTENSION_ID
```

**IMPORTANT - Update these:**
- `MONGO_ROOT_PASSWORD` - Use a STRONG password!
- `REDIS_PASSWORD` - Different strong password!
- `JWT_SECRET` - Copy from your local `.env` file or generate new
- `STRIPE_*` - Your Stripe keys
- `FRONTEND_URL` - Your extension ID

**Save:** Press `Ctrl + X`, then `Y`, then `Enter`

---

### Step 4.3: Install Backend Dependencies

```bash
cd backend
npm install --production
cd ..
```

This takes 1-2 minutes.

---

### Step 4.4: Start Services with Docker

```bash
# Use production environment file
docker-compose --env-file .env.production up -d
```

**First time:** Docker will download images (2-5 minutes)

You'll see:
```
[+] Running 3/3
 ✔ Container linkedin-agent-mongodb  Started
 ✔ Container linkedin-agent-redis    Started
 ✔ Container linkedin-agent-backend  Started
```

✅ **Backend is running!**

---

### Step 4.5: Verify It's Working

Check if containers are running:
```bash
docker-compose ps
```

Should show all 3 services as "Up"

Check backend logs:
```bash
docker-compose logs backend
```

Look for:
```
✅ MongoDB connected successfully
✅ Redis connected successfully
🚀 LinkedIn Agent API Server
```

---

### Step 4.6: Test the API

From the server:
```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "success": true,
  "message": "LinkedIn Agent API is running",
  "timestamp": "..."
}
```

From your Windows machine (test external access):
```powershell
curl http://YOUR_SERVER_IP:3000/health
```

If this works - **YOU'RE DONE!** 🎉

---

## 🌐 Part 5: Configure Firewall (Security)

### Step 5.1: Install UFW (Firewall)

```bash
# Install firewall
apt install ufw -y

# Allow SSH (IMPORTANT - don't lock yourself out!)
ufw allow 22/tcp

# Allow API port
ufw allow 3000/tcp

# Enable firewall
ufw --force enable

# Check status
ufw status
```

You should see:
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
3000/tcp                   ALLOW       Anywhere
```

✅ **Firewall configured!**

---

## 🔒 Part 6: Optional - Setup Domain & HTTPS

### Step 6.1: Point Domain to Server

If you have a domain (e.g., `api.yourdomain.com`):

1. Go to your domain registrar (Namecheap, GoDaddy, etc.)
2. Add an A record:
   - **Type**: A
   - **Name**: api (or @)
   - **Value**: YOUR_SERVER_IP
   - **TTL**: 300
3. Wait 5-60 minutes for DNS propagation

Test:
```powershell
ping api.yourdomain.com
```

Should show your server IP!

---

### Step 6.2: Install Nginx (Reverse Proxy)

```bash
# Install Nginx
apt install nginx -y

# Create config
nano /etc/nginx/sites-available/linkedin-agent
```

Paste:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Change this!

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Save and activate:
```bash
# Link config
ln -s /etc/nginx/sites-available/linkedin-agent /etc/nginx/sites-enabled/

# Remove default
rm /etc/nginx/sites-enabled/default

# Test config
nginx -t

# Restart Nginx
systemctl restart nginx
```

---

### Step 6.3: Install SSL Certificate (HTTPS)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get certificate
certbot --nginx -d api.yourdomain.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Select 2 (redirect HTTP to HTTPS)
```

Now your API is available at:
```
https://api.yourdomain.com/health
```

Certificate auto-renews every 90 days!

✅ **HTTPS enabled!**

Update `.env.production`:
```bash
FRONTEND_URL=https://api.yourdomain.com
```

Restart:
```bash
docker-compose restart backend
```

---

## 📱 Part 7: Update Chrome Extension

### Step 7.1: Update API URL

On your Windows machine, edit:
`src/services/apiClient.ts`

Change:
```typescript
const API_BASE_URL = 'http://localhost:3000/api';
```

To:
```typescript
const API_BASE_URL = 'http://YOUR_SERVER_IP:3000/api';
```

Or if you setup domain:
```typescript
const API_BASE_URL = 'https://api.yourdomain.com/api';
```

---

### Step 7.2: Rebuild Extension

```powershell
npm run build
```

---

### Step 7.3: Reload Extension

1. Go to `chrome://extensions/`
2. Click reload icon on your extension
3. Test login - should work with server!

✅ **Extension connected to server!**

---

## 🔄 Part 8: Manage Your Deployment

### View Logs

```bash
# All logs
docker-compose logs -f

# Just backend
docker-compose logs -f backend

# Last 50 lines
docker-compose logs --tail=50 backend
```

---

### Restart Services

```bash
# Restart everything
docker-compose restart

# Restart just backend
docker-compose restart backend
```

---

### Stop Services

```bash
docker-compose down
```

---

### Start Services

```bash
docker-compose up -d
```

---

### Update Code

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build
```

---

### Check MongoDB Data

```bash
# Access MongoDB
docker exec -it linkedin-agent-mongodb mongosh -u admin -p YOUR_PASSWORD

# List databases
show dbs

# Use database
use linkedin_agent

# Count users
db.users.countDocuments()

# Find user
db.users.findOne({ email: "test@example.com" })

# Exit
exit
```

---

### Check Redis

```bash
# Access Redis
docker exec -it linkedin-agent-redis redis-cli -a YOUR_REDIS_PASSWORD

# List keys
KEYS *

# Exit
exit
```

---

### Backup Database

```bash
# Create backup directory
mkdir -p /root/backups

# Backup MongoDB
docker exec linkedin-agent-mongodb mongodump \
  --username=admin \
  --password=YOUR_PASSWORD \
  --authenticationDatabase=admin \
  --out=/data/backup

# Copy backup to server
docker cp linkedin-agent-mongodb:/data/backup /root/backups/mongodb-$(date +%Y%m%d)
```

---

## 🔧 Troubleshooting

### Problem: Can't connect to server

```bash
# Check if containers are running
docker-compose ps

# Check backend logs
docker-compose logs backend

# Check if port is open
netstat -tulpn | grep 3000
```

---

### Problem: Extension can't reach API

1. Check firewall allows port 3000:
```bash
ufw status
```

2. Test from Windows:
```powershell
curl http://YOUR_SERVER_IP:3000/health
```

3. Check CORS settings in backend
4. Verify FRONTEND_URL in `.env.production`

---

### Problem: MongoDB connection failed

```bash
# Check MongoDB logs
docker-compose logs mongodb

# Verify password matches
cat .env.production | grep MONGO_ROOT_PASSWORD

# Restart MongoDB
docker-compose restart mongodb
```

---

### Problem: Out of disk space

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a

# Clean old logs
truncate -s 0 /var/log/syslog
```

---

## 📊 Monitoring (Optional)

### Install htop (Resource Monitor)

```bash
apt install htop -y
htop
```

Press `q` to exit

---

### Check Resource Usage

```bash
# CPU and Memory
docker stats

# Disk space
df -h

# Network
nethogs
```

---

## 🔐 Security Best Practices

1. **Change default SSH port:**
```bash
nano /etc/ssh/sshd_config
# Change Port 22 to Port 2222
systemctl restart sshd

# Update firewall
ufw allow 2222/tcp
ufw delete allow 22/tcp
```

2. **Disable root login:**
```bash
# Create new user
adduser yourusername
usermod -aG sudo yourusername

# Add SSH key for new user
mkdir /home/yourusername/.ssh
cp ~/.ssh/authorized_keys /home/yourusername/.ssh/
chown -R yourusername:yourusername /home/yourusername/.ssh
chmod 700 /home/yourusername/.ssh
chmod 600 /home/yourusername/.ssh/authorized_keys

# Disable root SSH login
nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
systemctl restart sshd
```

3. **Setup automatic security updates:**
```bash
apt install unattended-upgrades -y
dpkg-reconfigure --priority=low unattended-upgrades
```

4. **Install fail2ban (prevent brute force):**
```bash
apt install fail2ban -y
systemctl enable fail2ban
systemctl start fail2ban
```

---

## 🎯 Quick Reference

### Connect to Server:
```powershell
ssh root@YOUR_SERVER_IP
```

### Start Services:
```bash
cd /root/linkedin-agent
docker-compose up -d
```

### Stop Services:
```bash
docker-compose down
```

### View Logs:
```bash
docker-compose logs -f backend
```

### Restart After Code Changes:
```bash
git pull
docker-compose up -d --build
```

### Check Status:
```bash
docker-compose ps
curl http://localhost:3000/health
```

---

## ✅ Deployment Checklist

- ✅ Server created and accessible via SSH
- ✅ Docker and Docker Compose installed
- ✅ Project code uploaded/cloned to server
- ✅ `.env.production` file configured
- ✅ Backend dependencies installed
- ✅ Docker containers running
- ✅ API health check returns success
- ✅ Firewall configured
- ✅ Extension updated with server IP/domain
- ✅ Extension connects successfully
- ✅ Users can register and login
- ✅ Credits track correctly

---

## 🎉 Success!

Your LinkedIn Agent is now running on a remote server!

**Your API is available at:**
- `http://YOUR_SERVER_IP:3000`
- Or `https://api.yourdomain.com` (if you setup domain)

**What's working:**
- ✅ Backend API on server (no Windows needed!)
- ✅ MongoDB and Redis in Docker
- ✅ Chrome extension connects to server
- ✅ Users can register/login from anywhere
- ✅ Credits tracked centrally
- ✅ Automatic daily credit refresh

**No more local dependencies needed on Windows!** 🎊

---

## 📚 Additional Resources

- Server management: https://www.digitalocean.com/community/tutorials
- Docker documentation: https://docs.docker.com/
- Ubuntu security: https://ubuntu.com/security
- Nginx configuration: https://nginx.org/en/docs/

---

## Need Help?

Check the logs first:
```bash
docker-compose logs -f
```

Common solutions:
1. Restart services: `docker-compose restart`
2. Check firewall: `ufw status`
3. Verify .env.production settings
4. Test API: `curl http://localhost:3000/health`

Everything is working! Start using your LinkedIn Agent! 🚀
