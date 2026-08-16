#!/bin/bash
set -e

SERVER="root@47.99.138.250"
PASS="TongWei131700"
DEPLOY_DIR="/var/www/verra-voile-end"
TAR_FILE="/tmp/verra-voile-end.tar.gz"
LOG="/Users/hongli/WorkSpace/Verra-Voile-End/scripts/deploy_log.txt"

export SSH_PASS="$PASS"

echo "=== Step 1: Upload tar ===" | tee "$LOG"
sshpass -p "$PASS" scp -P 22 -o StrictHostKeyChecking=no "$TAR_FILE" "$SERVER:/tmp/" 2>&1 | tee -a "$LOG"
echo "Upload done" | tee -a "$LOG"

echo "=== Step 2: Extract and install ===" | tee -a "$LOG"
sshpass -p "$PASS" ssh -p 22 -o StrictHostKeyChecking=no "$SERVER" \
  "cd $DEPLOY_DIR && rm -rf src package.json package-lock.json && tar -xzf $TAR_FILE && npm install --production 2>&1 | tail -5 && echo DEPLOY_OK" 2>&1 | tee -a "$LOG"
echo "Extract done" | tee -a "$LOG"

echo "=== Step 3: Stop and clear port ===" | tee -a "$LOG"
sshpass -p "$PASS" ssh -p 22 -o StrictHostKeyChecking=no "$SERVER" \
  "pm2 stop verra-voile-api 2>/dev/null; sleep 1; fuser -k 3000/tcp 2>/dev/null; sleep 2 && echo PORT_CLEARED" 2>&1 | tee -a "$LOG"

echo "=== Step 4: Start service ===" | tee -a "$LOG"
sshpass -p "$PASS" ssh -p 22 -o StrictHostKeyChecking=no "$SERVER" \
  "cd $DEPLOY_DIR && pm2 start src/index.js --name verra-voile-api && sleep 3 && curl -s http://localhost:3000/health" 2>&1 | tee -a "$LOG"

echo "=== ALL DONE ===" | tee -a "$LOG"
