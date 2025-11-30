#!/bin/bash

#########################################
# LinkedIn Agent - Server Deployment Script
# Run this on your Linux server
#########################################

set -e  # Exit on error

echo "========================================="
echo "LinkedIn Agent - Server Setup"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root: sudo bash deploy-server.sh${NC}"
  exit 1
fi

echo -e "${YELLOW}Step 1: Updating system...${NC}"
apt update -y
apt upgrade -y
echo -e "${GREEN}✓ System updated${NC}"
echo ""

echo -e "${YELLOW}Step 2: Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi
echo ""

echo -e "${YELLOW}Step 3: Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    apt install docker-compose -y
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi
echo ""

echo -e "${YELLOW}Step 4: Installing Git...${NC}"
if ! command -v git &> /dev/null; then
    apt install git -y
    echo -e "${GREEN}✓ Git installed${NC}"
else
    echo -e "${GREEN}✓ Git already installed${NC}"
fi
echo ""

echo -e "${YELLOW}Step 5: Installing other dependencies...${NC}"
apt install curl nano htop ufw -y
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 6: Configuring firewall...${NC}"
ufw --force enable
ufw allow 22/tcp  # SSH
ufw allow 3000/tcp  # API
echo -e "${GREEN}✓ Firewall configured${NC}"
echo ""

echo -e "${YELLOW}Step 7: Checking for .env.production file...${NC}"
if [ ! -f ".env.production" ]; then
    echo -e "${RED}ERROR: .env.production file not found!${NC}"
    echo "Please create .env.production with your configuration."
    echo "See .env.example or SERVER_DEPLOYMENT_GUIDE.md for template."
    exit 1
fi
echo -e "${GREEN}✓ .env.production found${NC}"
echo ""

echo -e "${YELLOW}Step 8: Installing backend dependencies...${NC}"
cd backend
if command -v node &> /dev/null; then
    npm install --production
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${YELLOW}Note: Node.js not found, but it's okay - Docker will handle it${NC}"
fi
cd ..
echo ""

echo -e "${YELLOW}Step 9: Starting Docker containers...${NC}"
docker-compose --env-file .env.production up -d
echo -e "${GREEN}✓ Containers started${NC}"
echo ""

echo -e "${YELLOW}Step 10: Waiting for services to start...${NC}"
sleep 10
echo -e "${GREEN}✓ Services should be ready${NC}"
echo ""

echo -e "${YELLOW}Step 11: Checking container status...${NC}"
docker-compose ps
echo ""

echo -e "${YELLOW}Step 12: Testing API health...${NC}"
sleep 5
if curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✓ API is responding!${NC}"
    curl http://localhost:3000/health | python3 -m json.tool 2>/dev/null || curl http://localhost:3000/health
else
    echo -e "${RED}WARNING: API not responding yet${NC}"
    echo "Check logs with: docker-compose logs backend"
fi
echo ""

echo "========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "========================================="
echo ""
echo "Your LinkedIn Agent API is running!"
echo ""
echo "API URL: http://$(curl -s ifconfig.me):3000"
echo ""
echo "Next steps:"
echo "1. Test the API from your computer:"
echo "   curl http://$(curl -s ifconfig.me):3000/health"
echo ""
echo "2. Update your Chrome extension API URL to:"
echo "   http://$(curl -s ifconfig.me):3000/api"
echo ""
echo "3. View logs: docker-compose logs -f"
echo "4. Stop services: docker-compose down"
echo "5. Restart services: docker-compose restart"
echo ""
echo "See SERVER_DEPLOYMENT_GUIDE.md for more details!"
echo ""
