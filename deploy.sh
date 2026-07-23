#!/bin/bash
set -e
npm run build
# restaurants.json on the server is the live, admin-writable data — never overwrite it
rsync -avz --delete --exclude=restaurants.json dist/ food-list-vps:/var/www/food-list/
echo "Deployed to https://food.srv1099441.hstgr.cloud"
