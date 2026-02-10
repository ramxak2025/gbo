#!/bin/bash
# Deploy script for iBorcuha
# Run on VDS: bash deploy.sh

set -e

BRANCH="claude/iborcuha-saas-platform-m8HZw"
APP_DIR="/root/gbo"

cd "$APP_DIR"

echo "=== iBorcuha Deploy ==="

echo "1. Pulling latest from $BRANCH..."
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "2. Installing dependencies..."
npm install --production

echo "3. Building frontend..."
npm run build

echo "4. Restarting server..."
pm2 restart iborcuha 2>/dev/null || pm2 start ecosystem.config.cjs
pm2 save

echo "=== Deploy complete! ==="
echo "App running at http://$(hostname -I | awk '{print $1}')"
