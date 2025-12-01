# LinkedIn Agent - Beginner's Guide

Welcome! This guide will help you run your LinkedIn Agent application every day. Don't worry if you're new to this - everything is explained step by step.

## 🎯 What You Need to Know

Your LinkedIn Agent has 3 main parts:
1. **MongoDB** - Stores your data (runs in Docker)
2. **Redis** - Caches data for speed (runs in Docker)
3. **Backend API** - Your Node.js server that handles all the logic

## 🚀 How to Start Everything

### Method 1: Easy Way (Recommended)
Just run this single command:
```bash
cd /root/linkedin-agent
./start.sh
```

This script will:
- Check if MongoDB and Redis are running (start them if needed)
- Start your backend server
- Verify everything is working

### Method 2: Manual Steps
If you want to understand what's happening:

```bash
# 1. Make sure you're in the right directory
cd /root/linkedin-agent

# 2. Start MongoDB and Redis (if not already running)
docker start linkedin-agent-mongodb
docker start linkedin-agent-redis

# 3. Start the backend
cd backend
npm run dev
```

## 🛑 How to Stop Everything

```bash
cd /root/linkedin-agent
./stop.sh
```

This stops the backend. MongoDB and Redis will keep running (which is fine - they use very little resources when idle).

## 📊 Check if Everything is Running

```bash
cd /root/linkedin-agent
./status.sh
```

This shows you the status of all services.

## 🔍 View Logs (If Something Goes Wrong)

```bash
# View recent logs
tail -100 /tmp/linkedin-backend.log

# Watch logs in real-time
tail -f /tmp/linkedin-backend.log
```

Press `Ctrl+C` to stop watching logs.

## 🔧 Daily Usage

### Every time you want to use the app:
1. Run: `./start.sh`
2. Wait 10 seconds
3. Your app is ready at http://localhost:3000

### When you're done:
1. Run: `./stop.sh`

### To check status anytime:
1. Run: `./status.sh`

## ❓ Common Issues & Solutions

### Issue: "Backend failed to start"
**Solution:**
```bash
# View the error logs
tail -100 /tmp/linkedin-backend.log

# Usually restarting fixes it:
./stop.sh
./start.sh
```

### Issue: "Port 3000 already in use"
**Solution:**
```bash
# Stop the existing process
./stop.sh
# Wait 5 seconds
sleep 5
# Start again
./start.sh
```

### Issue: "MongoDB connection failed"
**Solution:**
```bash
# Restart MongoDB
docker restart linkedin-agent-mongodb
# Wait 10 seconds
sleep 10
# Try starting again
./start.sh
```

### Issue: "Redis connection failed"
**Solution:**
```bash
# Restart Redis
docker restart linkedin-agent-redis
# Wait 5 seconds
sleep 5
# Try starting again
./start.sh
```

## 💡 Pro Tips for Beginners

1. **Always use `./status.sh` first** - This tells you what's already running
2. **Keep MongoDB and Redis running** - They don't need to be stopped daily
3. **Use `./start.sh` every day** - This is the easiest way to get everything running
4. **Check logs if stuck** - The logs usually tell you exactly what's wrong

## 🔐 Important Files

- `start.sh` - Starts everything
- `stop.sh` - Stops the backend
- `status.sh` - Shows what's running
- `.env` - Your configuration (passwords, API keys, etc.)
- `backend/.env` - Backend-specific configuration

**⚠️ Never share your .env files - they contain passwords!**

## 📱 API Endpoints

Once running, your API is available at:
- Health check: http://localhost:3000/health
- Authentication: http://localhost:3000/api/auth/...
- Credits: http://localhost:3000/api/credits/...
- Stripe: http://localhost:3000/api/stripe/...

## 🆘 Getting Help

If you're stuck:
1. Run `./status.sh` to see what's running
2. Check logs with `tail -100 /tmp/linkedin-backend.log`
3. Try stopping and starting: `./stop.sh && sleep 5 && ./start.sh`
4. If still stuck, save your error logs and ask for help!

## 🎓 What Was Fixed

The original issue was simple: **The backend server wasn't running!**

MongoDB and Redis were working fine, but the Node.js backend that connects to them wasn't started. Now you have easy scripts to start/stop/check everything.

---

**Remember:** You're doing great! It's normal to feel overwhelmed at first. With these scripts, you'll be up and running in no time! 🎉
