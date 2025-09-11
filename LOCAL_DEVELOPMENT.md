# YesChef Local Development Setup

## 🚀 Quick Start

Your YesChef app is now running locally! Here are the details:

### URLs
- **Frontend (React)**: http://localhost:3001/YesChef
- **Backend (API)**: http://localhost:5001
- **Backend Health Check**: http://localhost:5001/health

## 📁 Project Structure
```
mern-app/
├── food-ai/                    # React frontend + Express backend
│   ├── src/                   # React components, pages, context
│   ├── server-clean.mjs       # Express server
│   ├── .env.local            # API keys (already configured)
│   └── package.json          # Frontend dependencies
└── package.json              # Root deployment config
```

## 🛠 Development Commands

### Start Both Servers (Recommended)
```bash
# Terminal 1 - Backend
cd food-ai
npm run server

# Terminal 2 - Frontend  
cd food-ai
PORT=3001 npm start
```

### Individual Services
```bash
# Backend only
cd food-ai
npm run server

# Frontend only
cd food-ai
PORT=3001 npm start

# Production build
cd food-ai  
npm run build
```

## 🔧 Configuration

### Environment Variables
- **Local Development**: Uses `.env.local` (already configured)
- **Frontend API URL**: Uses `.env.development.local` → points to `http://localhost:5001`
- **Production**: Deployed frontend uses Railway backend URL

### API Endpoints
- `POST /api/recipe` - Generate structured recipe
- `POST /api/captions` - Extract video captions  
- `POST /api/stores` - Find nearby grocery stores
- `GET /health` - Health check

## 🎯 Testing Your Setup

1. **Visit**: http://localhost:3001/YesChef
2. **Enter a recipe query** (YouTube URL or recipe name)
3. **Check Network tab** - should see calls to `localhost:5001`
4. **Backend health**: http://localhost:5001/health

## 🔄 Development vs Production

| Environment | Frontend | Backend | API Calls |
|------------|----------|---------|-----------|
| **Local** | localhost:3001 | localhost:5001 | localhost:5001 |
| **Production** | GitHub Pages | Railway | yeschef-production.up.railway.app |

## 🐛 Troubleshooting

- **Port conflicts**: Change PORT=3001 to another port
- **API errors**: Check `.env.local` has valid API keys
- **CORS issues**: Backend configured for localhost:3001
- **Build issues**: Run `npm install` in food-ai directory

## 📦 Dependencies
All dependencies are installed and ready:
- React 19, React Router v7
- Express, CORS, OpenAI SDK  
- Swiper, Lottie animations
- YouTube transcript extraction

Happy coding! 🎉
