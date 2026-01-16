#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "🚀 Starting Unified Build Process..."

# 1. Build Frontend
echo "📦 Building Frontend..."
cd Front/Frontend
npm install
npm run build
cd ../..
echo "✅ Frontend build complete."

# 2. Install Backend Dependencies
echo "🐍 Installing Backend Dependencies..."
pip install -r Backend/requirements.txt
echo "✅ Backend dependencies installed."

echo "🎉 Build finished successfully!"
