#!/bin/bash

# ==========================================
# 🚀 ROYAL300 WHATSAPP PANEL - SYNC SCRIPT
# ==========================================
# This script securely transfers local code to the production VPS.
# You can run this from any machine to push updates to the live server.
#
# --- CREDENTIALS (KEEP SECURE) ---
# VPS IP Address: 93.127.206.52
# VPS Username: root
# VPS Password: Royal300@2026
# ==========================================

# Configuration
VPS_IP="93.127.206.52"
VPS_USER="root"
REMOTE_PATH="/var/www/whatsapp_panel"

echo "🔄 Synchronizing project files to VPS ($VPS_IP)..."

# Create remote directory if it doesn't exist
ssh -o ConnectTimeout=10 $VPS_USER@$VPS_IP "mkdir -p $REMOTE_PATH"

# Rsync backend (excluding local environment/logs)
echo "📂 Syncing Backend..."
rsync -avz --progress --delete \
    --exclude='.env' \
    --exclude='vendor/' \
    --exclude='storage/logs/*' \
    --exclude='node_modules/' \
    "./backend/" "$VPS_USER@$VPS_IP:$REMOTE_PATH/backend/"

# Rsync frontend
echo "📂 Syncing Frontend..."
rsync -avz --progress --delete \
    --exclude='node_modules/' \
    --exclude='dist/' \
    "./frontend/" "$VPS_USER@$VPS_IP:$REMOTE_PATH/frontend/"

# Sync root files
echo "📂 Syncing Deploy Scripts..."
rsync -avz --progress \
    --include='deploy.sh' \
    --exclude='*' \
    "./" "$VPS_USER@$VPS_IP:$REMOTE_PATH/"

echo "✅ Sync Complete!"

# Automatically commit and push to GitHub
echo "📦 Committing and Pushing to GitHub..."
git add .
if ! git diff-index --quiet HEAD; then
    git commit -m "Auto-sync update to VPS"
    git push origin main
    echo "✅ GitHub Push Complete!"
else
    echo "ℹ️ No changes to commit to GitHub."
fi

echo "🚀 Now run the deployment script on your VPS if needed."
