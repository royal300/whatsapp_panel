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
if [ -d ".git" ]; then
    echo "🔄 Pulling latest code from GitHub..."
    git pull origin main
else
    echo "⚠️ Not a git repository, skipping pull. Code was synced via rsync."
fi

# 1. Update Backend
echo "📦 Updating Backend..."
cd $BACKEND_DIR

# Create production .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating Production .env..."
    cp .env.example .env
    sed -i "s|APP_URL=.*|APP_URL=https://whatsapp.royal300.com|g" .env
    sed -i "s|DB_HOST=.*|DB_HOST=localhost|g" .env
    sed -i "s|DB_PORT=.*|DB_PORT=3306|g" .env
    sed -i "s|DB_DATABASE=.*|DB_DATABASE=whatsapp_panel|g" .env
    sed -i "s|DB_USERNAME=.*|DB_USERNAME=whatsapp_user|g" .env
    sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=Royal300@2026)|g" .env
    php artisan key:generate
fi

composer install --no-dev --optimize-autoloader
php artisan migrate --force
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

    index index.html index.php;
    charset utf-8;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";

    # Handle API requests (Laravel Backend) properly
    location /api/ {
        alias $BACKEND_DIR/public/;
        try_files \$uri \$uri/ @api;
    }

    location @api {
        rewrite ^/api/(.*)\$ /api/index.php/\$1 last;
    }

    location ~ ^/api/index\.php(/|$) {
        root $BACKEND_DIR/public;
        include snippets/fastcgi-php.conf;
        
        # Override SCRIPT_FILENAME to point to the actual index.php in root
        fastcgi_param SCRIPT_FILENAME \$document_root/index.php;
        # Since rewrite keeps /api/ prefix in request, we can just use index.php as SCRIPT_NAME 
        # so Laravel sees the full path accurately including /api
        fastcgi_param SCRIPT_NAME /index.php;
        
        fastcgi_pass unix:$PHP_SOCKET;
    }

    # Serve Frontend for everything else
    location / {
        root $FRONTEND_DIR/dist;
        try_files \$uri \$uri/ /index.html;
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
npm install
npm run build

echo "🔐 Setting Permissions..."
chown -R www-data:www-data $PROJECT_ROOT
chmod -R 775 $BACKEND_DIR/storage $BACKEND_DIR/bootstrap/cache

# 4. Restart Queue
echo "🔄 Refreshing Queue Workers..."
cd $BACKEND_DIR
php artisan queue:restart
# Ensure at least one worker is running in the background
nohup php artisan queue:work --tries=3 > $BACKEND_DIR/storage/logs/queue.log 2>&1 &

echo "✅ Deployment Finished Successfully!"
