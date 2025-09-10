# YesChef - Deployment Guide

This guide covers deploying your YesChef application using GitHub Actions and secrets.

## 🚀 Quick Start

### Required GitHub Secrets

Add these secrets to your GitHub repository:

#### For Frontend (React App)
- `REACT_APP_API_URL`: Your backend API URL (e.g., `https://your-backend.vercel.app`)
- `REACT_APP_OPENAI_API_KEY`: Your OpenAI API key (if used in frontend)

#### For Backend
- `OPENAI_API_KEY`: Your OpenAI API key
- `PORT`: Port number (default: 5001)
- `CORS_ORIGIN`: Allowed origins for CORS (e.g., `https://jehtoms.github.io`)

#### For Specific Deployment Platforms

**Vercel:**
- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

**Render:**
- `RENDER_API_KEY`: Your Render API key
- `RENDER_SERVICE_ID`: Your Render service ID

**Railway:**
- `RAILWAY_TOKEN`: Your Railway API token
- `RAILWAY_SERVICE`: Your Railway service name

**Heroku:**
- `HEROKU_API_KEY`: Your Heroku API key
- `HEROKU_APP_NAME`: Your Heroku app name
- `HEROKU_EMAIL`: Your Heroku email

## 📝 How to Add GitHub Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add the secret name and value
6. Click **Add secret**

## 🏗️ Deployment Options

### Option 1: GitHub Pages (Frontend) + Vercel (Backend)

1. **Frontend**: Automatically deploys to GitHub Pages on push to main
2. **Backend**: Deploy to Vercel by uncommenting the Vercel section in `.github/workflows/deploy.yml`

**Required Secrets:**
```
REACT_APP_API_URL=https://your-vercel-app.vercel.app
OPENAI_API_KEY=your_openai_key
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

### Option 2: Full Stack on Render

1. Uncomment the Render deployment section in the workflow
2. Add Render secrets

**Required Secrets:**
```
RENDER_API_KEY=your_render_key
RENDER_SERVICE_ID=your_service_id
OPENAI_API_KEY=your_openai_key
CORS_ORIGIN=https://jehtoms.github.io
```

### Option 3: Docker Deployment

1. Build and run locally:
```bash
docker-compose up --build
```

2. Deploy to any Docker-compatible platform (DigitalOcean, AWS, etc.)

## 🔧 Environment Variables

### Production Environment (.env.production)
```env
NODE_ENV=production
OPENAI_API_KEY=your_openai_api_key
PORT=5001
CORS_ORIGIN=https://jehtoms.github.io
```

### Development Environment (.env.local)
```env
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key
PORT=5001
CORS_ORIGIN=http://localhost:3001
```

## 🌐 Platform-Specific Setup

### Vercel
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Render
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `cd food-ai && npm install && npm run build`
4. Set start command: `cd food-ai && node server-clean.mjs`

### Railway
1. Create a new project on Railway
2. Connect your GitHub repository
3. Railway will auto-detect Node.js and deploy

### Netlify
1. Connect your GitHub repository to Netlify
2. Build settings are configured in `netlify.toml`
3. Add environment variables in Netlify dashboard

## 🔍 Monitoring and Debugging

### Health Check
Your app includes a health check endpoint: `GET /health`

### Logs
- Check GitHub Actions logs for deployment issues
- Check platform-specific logs (Vercel, Render, etc.)

### Common Issues
1. **CORS Errors**: Make sure `CORS_ORIGIN` is set correctly
2. **API Key Issues**: Verify `OPENAI_API_KEY` is set in both frontend and backend
3. **Build Failures**: Check Node.js version compatibility (use Node 18+)

## 🚦 Testing Deployment

After deployment, test these endpoints:
- `GET /health` - Should return `{"status": "ok"}`
- `POST /api/recipe` - Should process recipe requests
- `POST /api/captions` - Should fetch video captions
- `POST /api/stores` - Should return store locations

## 🔄 Continuous Deployment

The GitHub Actions workflow automatically:
1. **Tests** your code on every push/PR
2. **Builds** the application
3. **Deploys** to production on pushes to main branch

## 📞 Support

If you encounter issues:
1. Check GitHub Actions logs
2. Verify all secrets are set correctly
3. Test locally with `npm run dev`
4. Check platform-specific documentation
