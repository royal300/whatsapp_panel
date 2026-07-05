#!/bin/bash

# ==========================================
# 🚀 ROYAL300 WHATSAPP PANEL - DEPLOY SCRIPT
# ==========================================
# This script configures the VPS, database, and Nginx.
# It can be run after 'bash vps_sync.sh'.
#
# --- CREDENTIALS (KEEP SECURE) ---
# VPS IP Address: 93.127.206.52
# VPS Username: root
# VPS Password: Royal300@2026
#
# Database Name: whatsapp_panel
# Database User: whatsapp_user
# Database Pass: Royal300@2026)
# ==========================================

# Configuration
PROJECT_ROOT="/var/www/whatsapp_panel"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "🚀 Starting Deployment..."

# 0. Update Code from GitHub
echo "🔄 Updating code..."
# if [ -d ".git" ]; then
#     echo "🔄 Pulling latest code from GitHub..."
#     git pull origin main
# else
#     echo "⚠️ Not a git repository, skipping pull. Code was synced via rsync."
# fi

# 1. Update Backend
echo "📦 Updating Backend..."
cd $BACKEND_DIR

# Create production .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating Production .env..."
    cat <<'ENVFILE' > .env
APP_NAME=Royal300
APP_ENV=production
APP_KEY=
APP_DEBUG=true
APP_URL=https://whatsapp.royal300.com
SANCTUM_STATEFUL_DOMAINS=whatsapp.royal300.com
FRONTEND_URL=https://whatsapp.royal300.com

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

APP_MAINTENANCE_DRIVER=file

BCRYPT_ROUNDS=12

LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=whatsapp_panel
DB_USERNAME=whatsapp_user
DB_PASSWORD=Royal300@2026)

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=whatsapp.royal300.com

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync

CACHE_STORE=database

PUSHER_APP_ID=placeholder
PUSHER_APP_KEY=placeholder
PUSHER_APP_SECRET=placeholder
PUSHER_APP_CLUSTER=mt1

MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=whatsapp@royal300.com
MAIL_PASSWORD="Royal@2026##"
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS="whatsapp@royal300.com"
MAIL_FROM_NAME="Royal300"

VITE_APP_NAME="Royal300"
VITE_WHATSAPP_VERIFY_TOKEN=royal300_secret_token
ENVFILE
    php artisan key:generate
fi

composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 1.5 Setup Nginx Configuration
echo "🌐 Configuring Nginx..."
NGINX_CONF="/etc/nginx/sites-available/whatsapp_panel"
PHP_SOCKET=$(find /var/run/php/ -name "php*-fpm.sock" | head -n 1)

if [ -z "$PHP_SOCKET" ]; then
    echo "❌ Error: Could not find PHP-FPM socket in /var/run/php/"
    exit 1
fi

cat <<EOF > $NGINX_CONF
server {
    listen 80;
    server_name whatsapp.royal300.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name whatsapp.royal300.com;

    ssl_certificate /etc/letsencrypt/live/whatsapp.royal300.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/whatsapp.royal300.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root $FRONTEND_DIR/dist;
    index index.html index.php;
    charset utf-8;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API and Backend handled via symlink /var/www/whatsapp_panel/frontend/dist/api -> /var/www/whatsapp_panel/backend/public
    location /api {
        try_files \$uri \$uri/ /api/index.php?\$query_string;
    }

    # Serve storage directly from backend
    location /storage {
        alias /var/www/whatsapp_panel/backend/public/storage;
        access_log off;
        expires max;
    }

    # Override SCRIPT_NAME for /api/index.php to prevent Laravel from stripping /api prefix
    location = /api/index.php {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        fastcgi_param SCRIPT_NAME /index.php;
        fastcgi_pass unix:$PHP_SOCKET;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        fastcgi_pass unix:$PHP_SOCKET;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
EOF

ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 2. Update Frontend
echo "🏗️ Updating Frontend..."
cd $FRONTEND_DIR
rm -rf dist
npm install
npm run build || { echo "❌ Frontend Build Failed!"; exit 1; }

# CRITICAL: Create the symlink so Nginx can find the API
echo "🔗 Linking API to Frontend..."
ln -sf $BACKEND_DIR/public $FRONTEND_DIR/dist/api

# 3. Permissions
echo "🔐 Setting Permissions..."
chown -R www-data:www-data $PROJECT_ROOT
chmod -R 775 $BACKEND_DIR/storage $BACKEND_DIR/bootstrap/cache

echo "✅ Deployment Finished Successfully!"
