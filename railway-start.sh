#!/bin/bash
# Railway deployment script for YesChef backend

echo "Starting YesChef Backend on Railway..."
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Navigate to the food-ai directory
cd food-ai

# Install dependencies
echo "Installing dependencies..."
npm install --production

# Start the server
echo "Starting server on port $PORT..."
export NODE_ENV=production
node server-clean.mjs
