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

# 4. Update PM2 daemon nếu cần rồi Start / reload
echo "[3/4] Starting PM2..."
pm2 update 2>/dev/null || true
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
PORT=$(node -e "const c=require('./ecosystem.config.js'); console.log(c.apps[0].env.PORT || 3000)")
echo "✓ Done! App running on port $PORT"
echo ""
echo "Tailscale IP:"
tailscale ip -4 2>/dev/null || echo "  (run: tailscale ip -4)"
echo ""
echo "Access: http://$(tailscale ip -4 2>/dev/null || echo '<tailscale-ip>'):$PORT"
