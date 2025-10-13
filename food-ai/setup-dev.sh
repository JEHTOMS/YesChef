#!/bin/bash

# YesChef Local Development Setup Script
# Run this after installing Node.js

echo "🍳 YesChef Local Development Setup"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org"
    echo "Then run this script again."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo "✅ npm found: $(npm --version)"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please update the .env file with your actual API keys:"
    echo "  - OPENAI_API_KEY=your_openai_api_key"
    echo "  - YOUTUBE_API_KEY=your_youtube_api_key"  
    echo "  - GOOGLE_API_KEY=your_google_api_key"
    echo "  - GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id"
    echo ""
    echo "A template .env file has been created for you."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check for API keys in .env
echo "🔑 Checking API key configuration..."
if grep -q "your_openai_api_key_here" .env; then
    echo "⚠️  Warning: OpenAI API key not configured"
    echo "   Please update OPENAI_API_KEY in .env file"
fi

if grep -q "your_youtube_data_api_key_here" .env; then
    echo "⚠️  Warning: YouTube API key not configured"  
    echo "   Please update YOUTUBE_API_KEY in .env file"
fi

echo ""
echo "🚀 Setup complete! To start the development server:"
echo ""
echo "   npm run dev"
echo ""
echo "The app will be available at:"
echo "   Frontend: http://localhost:3001"
echo "   Backend API: http://localhost:5001"
echo ""
echo "API endpoints:"
echo "   POST http://localhost:5001/api/recipe"
echo "   GET  http://localhost:5001/health"
echo ""