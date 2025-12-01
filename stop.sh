#!/bin/bash

# LinkedIn Agent - Easy Stop Script
# This script stops your LinkedIn Agent backend

echo "🛑 Stopping LinkedIn Agent backend..."
echo ""

# Find and kill the backend processes
if ps aux | grep -v grep | grep -q "ts-node src/index.ts"; then
    echo "   Killing backend processes..."
    pkill -f "ts-node src/index.ts"
    pkill -f "nodemon --watch src"
    sleep 2
    echo "✅ Backend stopped"
else
    echo "⚠️  Backend is not running"
fi

echo ""
echo "💡 Note: MongoDB and Redis are still running in Docker"
echo "   To stop them too, run: docker stop linkedin-agent-mongodb linkedin-agent-redis"
echo ""
