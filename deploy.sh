#!/bin/bash
set -e

echo "=== Arena Device Form — Deploy ==="

# 1. Pull latest code (nếu dùng git)
# git pull origin main

# 2. Install dependencies
echo "[1/4] Installing dependencies..."
npm install --production=false

# 3. Build
echo "[2/4] Building..."
npm run build

# 4. Start / reload PM2
echo "[3/4] Starting PM2..."
if pm2 describe arena-device-form > /dev/null 2>&1; then
  echo "  → Reloading existing PM2 process..."
  pm2 reload ecosystem.config.js --update-env
else
  echo "  → Starting new PM2 process..."
  pm2 start ecosystem.config.js
fi

# 5. Save PM2 process list (survive reboot)
echo "[4/4] Saving PM2 process list..."
pm2 save

echo ""
echo "✓ Done! App running on port 3000"
echo ""
echo "Tailscale IP:"
tailscale ip -4 2>/dev/null || echo "  (run: tailscale ip -4)"
echo ""
echo "Access: http://$(tailscale ip -4 2>/dev/null || echo '<tailscale-ip>'):3000"
