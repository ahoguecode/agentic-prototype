#!/bin/bash

echo "🚀 Adobe Learning Assistant - Quick Deploy Script"
echo "================================================"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed. Please install Node.js first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📤 Deployment options:"
    echo "1. Vercel: Run 'npx vercel' to deploy instantly"
    echo "2. Netlify: Run 'npx netlify deploy --prod --dir=dist'"
    echo "3. Local sharing: Your built files are in the 'dist' folder"
    echo ""
    echo "🌐 Your built app is ready to deploy!"
    echo "   Built files location: ./dist/"
    echo "   Main file: ./dist/index.html"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi 