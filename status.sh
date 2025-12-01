#!/bin/bash

# LinkedIn Agent - Status Check Script
# This script shows the current status of all services

echo "📊 LinkedIn Agent Status"
echo "========================================"
echo ""

# Check MongoDB
echo "🗄️  MongoDB:"
if docker ps | grep -q linkedin-agent-mongodb; then
    echo "   ✅ Running (Container: linkedin-agent-mongodb)"
else
    echo "   ❌ Not running"
fi

# Check Redis
echo ""
echo "💾 Redis:"
if docker ps | grep -q linkedin-agent-redis; then
    echo "   ✅ Running (Container: linkedin-agent-redis)"
else
    echo "   ❌ Not running"
fi

# Check Backend
echo ""
echo "🔧 Backend API:"
if ps aux | grep -v grep | grep -q "ts-node src/index.ts"; then
    echo "   ✅ Running (Port: 3000)"

    # Check health
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo "   ✅ Health check: PASSED"
    else
        echo "   ⚠️  Health check: FAILED"
    fi
else
    echo "   ❌ Not running"
fi

echo ""
echo "========================================"
echo ""
echo "💡 Quick Commands:"
echo "   Start:  ./start.sh"
echo "   Stop:   ./stop.sh"
echo "   Logs:   tail -f /tmp/linkedin-backend.log"
echo ""
