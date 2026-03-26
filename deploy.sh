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

# Create production .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating Production .env..."
    cp .env.example .env
    sed -i "s|APP_URL=.*|APP_URL=https://whatsapp.royal300.com|g" .env
    sed -i "s|DB_HOST=.*|DB_HOST=127.0.0.1|g" .env
    sed -i "s|DB_PORT=.*|DB_PORT=3306|g" .env
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

    # Handle API requests (Laravel Backend)
    location ^~ /api/ {
        # Redirect requests like /api/login to /login internally
        rewrite ^/api/(.*)$ /\$1 break;
        root $BACKEND_DIR/public;
        index index.php;
        try_files \$uri \$uri/ /index.php?\$query_string;

        location ~ \.php\$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:$PHP_SOCKET;
            # This allows test_db.php and index.php to both work
            fastcgi_param SCRIPT_FILENAME \$request_filename;
            include fastcgi_params;
        }
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

# 3. Permissions
echo "🔐 Setting Permissions..."
chown -R www-data:www-data $PROJECT_ROOT
chmod -R 775 $BACKEND_DIR/storage $BACKEND_DIR/bootstrap/cache

echo "✅ Deployment Finished Successfully!"
