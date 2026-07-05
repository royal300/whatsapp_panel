#!/bin/bash
cd /var/www/whatsapp_panel/backend

# Remove old MAIL lines
sed -i '/^MAIL_/d' .env

# Append correct MAIL lines
cat << 'EOF' >> .env
MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=whatsapp@royal300.com
MAIL_PASSWORD="Royal@2026##"
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=whatsapp@royal300.com
MAIL_FROM_NAME="Royal300"
EOF

php artisan config:cache
echo "Env updated successfully"
