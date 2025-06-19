#!/bin/bash

echo "🚀 Starting deployment..."

# Build Next.js
echo "📦 Building Next.js..."
npm run build

# Backup existing files
echo "💾 Creating backup..."
sudo cp -R /var/www/optipredict /var/www/optipredict.backup.$(date +%Y%m%d_%H%M%S)

# Deploy new build
echo "🔄 Deploying new build..."
sudo rm -rf /var/www/optipredict/*
sudo cp -R ./out/* /var/www/optipredict/

# Set permissions
echo "🔐 Setting permissions..."
sudo chown -R www-data:www-data /var/www/optipredict/
sudo chmod -R 755 /var/www/optipredict/

# Test Apache config
echo "🧪 Testing Apache configuration..."
sudo apache2ctl configtest

if [ $? -eq 0 ]; then
    echo "✅ Apache config OK, reloading..."
    sudo systemctl reload apache2
    echo "🎉 Deployment completed successfully!"
else
    echo "❌ Apache config error, deployment failed!"
    exit 1
fi
