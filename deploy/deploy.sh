#!/usr/bin/env bash
# Food List — Production Deploy Script
# Usage: SERVER_USER=user SERVER_HOST=yourserver.com DEPLOY_PATH=/var/www/food-list ./deploy/deploy.sh
# Requires: rsync, ssh access to SERVER_HOST, VITE_GOOGLE_MAPS_API_KEY set in environment

set -euo pipefail

: "${SERVER_USER:?Set SERVER_USER (e.g. export SERVER_USER=ubuntu)}"
: "${SERVER_HOST:?Set SERVER_HOST (e.g. export SERVER_HOST=yourserver.com)}"
: "${DEPLOY_PATH:?Set DEPLOY_PATH (e.g. export DEPLOY_PATH=/var/www/food-list)}"
: "${VITE_GOOGLE_MAPS_API_KEY:?Set VITE_GOOGLE_MAPS_API_KEY before building}"

echo "Building production bundle..."
npm run build

echo "Syncing dist/ to ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/"
rsync -avz --delete --checksum dist/ "${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/"

echo "Deploy complete. Verify at: https://${SERVER_HOST}"
echo ""
echo "NOTE: If you updated deploy/nginx.conf, reload nginx on the server:"
echo "  ssh ${SERVER_USER}@${SERVER_HOST} 'sudo nginx -t && sudo systemctl reload nginx'"
