#!/bin/bash
# ====================================================================
# Aden S2C SRM - One-Click Deploy Script for Tencent Cloud Lighthouse
# ====================================================================
# Usage:
#   1. Copy this script to your server (e.g., via SCP or paste)
#   2. chmod +x deploy.sh
#   3. ./deploy.sh
# ====================================================================

set -e  # Exit on any error

echo "=========================================="
echo "Aden S2C SRM Deployment Script"
echo "=========================================="

# Configuration
APP_NAME="srm"
APP_DIR="$HOME/aden-s2c-srm-prototype"
DATA_DIR="$HOME/srm-data"
DB_FILE="$DATA_DIR/srm.db"
NODE_VERSION="20"
PORT="3000"

# Step 1: Update system
echo ""
echo "[1/8] Updating system packages..."
sudo apt-get update -y

# Step 2: Install Node.js
echo ""
echo "[2/8] Installing Node.js ${NODE_VERSION}..."
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" != "$NODE_VERSION" ]; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js $(node -v) already installed, skipping."
fi

echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

# Step 3: Install PM2
echo ""
echo "[3/8] Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
else
    echo "PM2 already installed, skipping."
fi

# Step 4: Create data directory
echo ""
echo "[4/8] Creating data directory: $DATA_DIR"
mkdir -p "$DATA_DIR"

# Step 5: Clone or update code
echo ""
echo "[5/8] Setting up application..."
if [ -d "$APP_DIR" ]; then
    echo "App directory exists, updating..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "Cloning repository..."
    cd "$HOME"
    git clone https://github.com/qzw4549689/aden-s2c-srm-prototype.git
fi

# Step 6: Install dependencies
echo ""
echo "[6/8] Installing npm dependencies..."
cd "$APP_DIR"
npm install

# Step 7: Start/Restart with PM2
echo ""
echo "[7/8] Starting application with PM2..."
export DB_PATH="$DB_FILE"
export NODE_ENV="production"
export PORT="$PORT"

cd "$APP_DIR"
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
    echo "Restarting existing PM2 process..."
    pm2 restart "$APP_NAME" --update-env
else
    echo "Creating new PM2 process..."
    pm2 start server/index.js --name "$APP_NAME" \
        --env DB_PATH="$DB_FILE" \
        --env NODE_ENV="production" \
        --env PORT="$PORT"
fi

# Save PM2 config to auto-start on boot
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

# Step 8: Open firewall port
echo ""
echo "[8/8] Configuring firewall..."
# Try ufw first, then iptables
if command -v ufw &> /dev/null; then
    sudo ufw allow $PORT/tcp 2>/dev/null || true
    sudo ufw allow 80/tcp 2>/dev/null || true
    sudo ufw allow 443/tcp 2>/dev/null || true
fi

# Check if it's a Tencent Cloud VM (firewall managed in console)
if [ -f "/usr/local/qcloud/stargate/admin/sg_agent.sh" ] || [ -d "/usr/local/qcloud" ]; then
    echo ""
    echo "============================================================"
    echo "IMPORTANT: You must open port $PORT in Tencent Cloud Console!"
    echo "  1. Go to: https://console.cloud.tencent.com/lighthouse/instance"
    echo "  2. Click your server -> Firewall tab"
    echo "  3. Add rule: TCP $PORT (or 80/443 for HTTP/HTTPS)"
    echo "============================================================"
fi

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Application:  $APP_NAME"
echo "Directory:    $APP_DIR"
echo "Data Dir:     $DATA_DIR"
echo "Database:     $DB_FILE"
echo "Port:         $PORT"
echo ""
echo "Check status: pm2 status"
echo "View logs:    pm2 logs $APP_NAME"
echo ""
echo "Access your app at:"
echo "  http://<YOUR_SERVER_IP>:$PORT"
echo ""
echo "To update later:"
echo "  cd $APP_DIR && git pull && pm2 restart $APP_NAME"
echo "=========================================="
