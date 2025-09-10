// Clean Express server following DmitrySadovnikov architecture
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { ROUTES, CORS_CONFIG, PORT } from './src/config.js';
import { captionsHandler } from './src/captionsHandler.js';
import { recipeHandler } from './src/recipeHandler.js';
import { storesHandler } from './src/storesHandler.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables with absolute path
dotenv.config({ path: join(__dirname, '.env.local') });

const app = express();

// Use Railway's PORT or fallback to config PORT
const serverPort = process.env.PORT || PORT;

// Middleware
app.use(cors(CORS_CONFIG));
app.use(express.json());
app.use(express.static('build')); // Serve React build

// Environment check
console.log('\n🔧 Environment Status:');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing');
console.log('GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? '✅ Configured' : '❌ Missing');
console.log('GOOGLE_SEARCH_ENGINE_ID:', process.env.GOOGLE_SEARCH_ENGINE_ID ? '✅ Configured' : '❌ Missing');
console.log('GOOGLE_PLACES_API_KEY:', process.env.GOOGLE_PLACES_API_KEY ? '✅ Configured' : '❌ Missing');
console.log();

// Helper function to send handler responses
const sendHandlerResponse = (res, handlerResult) => {
  res.status(handlerResult.statusCode);

  if (handlerResult.headers) {
    Object.entries(handlerResult.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }

  res.send(handlerResult.body);
};

// API Routes
app.post(ROUTES.CAPTIONS, async (req, res) => {
  const result = await captionsHandler(req.body);
  sendHandlerResponse(res, result);
});

app.post(ROUTES.RECIPE, async (req, res) => {
  const result = await recipeHandler(req.body);
  sendHandlerResponse(res, result);
});

app.post(ROUTES.STORES, async (req, res) => {
  const result = await storesHandler(req.body);
  sendHandlerResponse(res, result);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: {
      openai: !!process.env.OPENAI_API_KEY,
      google: !!process.env.GOOGLE_API_KEY && !!process.env.GOOGLE_SEARCH_ENGINE_ID
    }
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'build', 'index.html'));
});

// Start server
app.listen(serverPort, () => {
  console.log(`🚀 Clean Recipe AI server running on http://localhost:${serverPort}`);
  console.log('📋 Available endpoints:');
  console.log(`   POST ${ROUTES.CAPTIONS} - Extract video captions`);
  console.log(`   POST ${ROUTES.RECIPE} - Generate structured recipe`);
  console.log(`   POST ${ROUTES.STORES} - Find nearby grocery stores`);
  console.log(`   GET  /health - Health check`);
  console.log();
});

export default app;
