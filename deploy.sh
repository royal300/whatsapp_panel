#!/bin/bash

# Configuration
PROJECT_ROOT="/var/www/whatsapp_panel"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "🚀 Starting Deployment..."

# 0. Update Code from GitHub
echo "🔄 Pulling latest code from GitHub..."
cd $PROJECT_ROOT
git pull origin main

# 1. Update Backend
echo "📦 Updating Backend..."
cd $BACKEND_DIR
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 2. Update Frontend
echo "🏗️ Updating Frontend..."
cd $FRONTEND_DIR
npm install
npm run build

# 3. Permissions
echo "🔐 Setting Permissions..."
chown -R www-data:www-data $PROJECT_ROOT
chmod -R 775 $BACKEND_DIR/storage $BACKEND_DIR/bootstrap/cache

echo "✅ Deployment Finished Successfully!"
