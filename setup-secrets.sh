#!/bin/bash

# YesChef Deployment Setup Script
# This script helps you set up GitHub secrets for deployment

echo "🚀 YesChef Deployment Setup"
echo "=============================="
echo

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Please install it from: https://cli.github.com/"
    echo
    echo "Or install with Homebrew:"
    echo "brew install gh"
    exit 1
fi

# Check if user is logged in to GitHub CLI
if ! gh auth status &> /dev/null; then
    echo "❌ Not logged in to GitHub CLI."
    echo "Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is ready!"
echo

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "📁 Repository: $REPO"
echo

# Function to set a secret
set_secret() {
    local secret_name=$1
    local secret_description=$2
    local is_required=$3
    
    echo "Setting: $secret_name"
    echo "Description: $secret_description"
    
    if [ "$is_required" = "required" ]; then
        echo "⚠️  This secret is REQUIRED for deployment"
    fi
    
    read -sp "Enter value (or press Enter to skip): " secret_value
    echo
    
    if [ -n "$secret_value" ]; then
        if gh secret set "$secret_name" --body "$secret_value"; then
            echo "✅ $secret_name set successfully"
        else
            echo "❌ Failed to set $secret_name"
        fi
    else
        echo "⏭️  Skipped $secret_name"
    fi
    echo
}

# Set up secrets
echo "🔐 Setting up GitHub Secrets"
echo "Press Enter to skip any secret you don't want to set now."
echo

# Required secrets
echo "=== REQUIRED SECRETS ==="
set_secret "OPENAI_API_KEY" "Your OpenAI API key for recipe generation" "required"
set_secret "REACT_APP_API_URL" "Your backend URL (e.g., https://your-app.vercel.app)" "required"

echo "=== GOOGLE API SECRETS (for store search) ==="
set_secret "GOOGLE_API_KEY" "Google API key for search and places" "optional"
set_secret "GOOGLE_SEARCH_ENGINE_ID" "Google Custom Search Engine ID" "optional"
set_secret "GOOGLE_PLACES_API_KEY" "Google Places API key" "optional"

echo "=== DEPLOYMENT PLATFORM SECRETS ==="
echo "Choose your deployment platform and set the appropriate secrets:"
echo

echo "1. Vercel:"
set_secret "VERCEL_TOKEN" "Your Vercel API token" "optional"
set_secret "VERCEL_ORG_ID" "Your Vercel organization ID" "optional"
set_secret "VERCEL_PROJECT_ID" "Your Vercel project ID" "optional"

echo "2. Render:"
set_secret "RENDER_API_KEY" "Your Render API key" "optional"
set_secret "RENDER_SERVICE_ID" "Your Render service ID" "optional"

echo "3. Railway:"
set_secret "RAILWAY_TOKEN" "Your Railway API token" "optional"
set_secret "RAILWAY_SERVICE" "Your Railway service name" "optional"

echo "4. Heroku:"
set_secret "HEROKU_API_KEY" "Your Heroku API key" "optional"
set_secret "HEROKU_APP_NAME" "Your Heroku app name" "optional"
set_secret "HEROKU_EMAIL" "Your Heroku email" "optional"

echo "=== OPTIONAL CONFIGURATION ==="
set_secret "CORS_ORIGIN" "CORS origin (default: https://jehtoms.github.io)" "optional"
set_secret "PORT" "Port number (default: 5001)" "optional"

echo
echo "🎉 Setup complete!"
echo
echo "Next steps:"
echo "1. Commit and push your changes to trigger deployment"
echo "2. Check GitHub Actions tab for deployment progress"
echo "3. Visit your deployed app!"
echo
echo "For detailed instructions, see DEPLOYMENT.md"
