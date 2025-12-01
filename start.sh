#!/bin/bash

# LinkedIn Agent - Easy Startup Script
# This script starts your entire LinkedIn Agent application

echo "🚀 Starting LinkedIn Agent..."
echo ""

# Check if MongoDB and Redis are running
echo "📊 Checking services..."
if ! docker ps | grep -q linkedin-agent-mongodb; then
    echo "⚠️  MongoDB is not running. Starting MongoDB..."
    docker start linkedin-agent-mongodb
    sleep 3
fi

if ! docker ps | grep -q linkedin-agent-redis; then
    echo "⚠️  Redis is not running. Starting Redis..."
    docker start linkedin-agent-redis
    sleep 3
fi

echo "✅ MongoDB and Redis are running"
echo ""

# Check if backend is already running
if ps aux | grep -v grep | grep -q "ts-node src/index.ts"; then
    echo "⚠️  Backend is already running!"
    echo "   If you want to restart it, run: ./stop.sh first"
    exit 1
fi

# Start backend
echo "🔧 Starting backend server..."
cd /root/linkedin-agent/backend
nohup npm run dev > /tmp/linkedin-backend.log 2>&1 &
BACKEND_PID=$!

echo "   Backend PID: $BACKEND_PID"
echo ""

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 8

# Check if backend is healthy
if curl -s http://localhost:3000/health | grep -q "success"; then
    echo ""
    echo "✅ ============================================="
    echo "✅  LinkedIn Agent is now running!"
    echo "✅ ============================================="
    echo ""
    echo "📡 Backend API: http://localhost:3000"
    echo "🔍 Health Check: http://localhost:3000/health"
    echo ""
    echo "📝 To view logs: tail -f /tmp/linkedin-backend.log"
    echo "🛑 To stop: ./stop.sh"
    echo ""
else
    echo ""
    echo "❌ Backend failed to start. Check logs with:"
    echo "   tail -100 /tmp/linkedin-backend.log"
    exit 1
fi
