#!/bin/bash
# Deploy script for iBorcuha
# Run on VDS: bash deploy.sh

set -e

cd /root/gbo

echo "Pulling latest changes..."
git pull origin main

echo "Installing dependencies..."
npm install --production

echo "Building frontend..."
npm run build

echo "Restarting server..."
pm2 restart iborcuha

echo "Deploy complete!"
