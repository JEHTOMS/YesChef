// Configuration for the YouTube Caption Extractor backend
// Following the architecture from DmitrySadovnikov/YouTube-Caption-Extractor

// API Base URL - uses environment variable or falls back to localhost for development
// Configuration constants for the YesChef application
// Author: DmitrySadovnikov
// Date: 2024
// Connected to Railway backend

// In production:
// - Vercel should use same-origin so /api/* is proxied via rewrites.
// - GitHub Pages/custom-domain hosting cannot proxy /api/*, so call Railway directly.
// In development we default to local backend.
const RAILWAY_BACKEND_URL = 'https://yeschef-production.up.railway.app';

const getProductionApiBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;

  // GitHub Pages / custom-domain static hosting (no rewrite/proxy support)
  const isGithubPagesHost = host.endsWith('github.io');
  const isLegacyCustomHost = host === 'yescheff.co' || host === 'www.yescheff.co';

  if (isGithubPagesHost || isLegacyCustomHost) {
    return RAILWAY_BACKEND_URL;
  }

  // Vercel and other proxy-capable hosts: same-origin
  return '';
};

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production' ? getProductionApiBaseUrl() : '');

const ROUTES = {
  HOME: '/',
  CAPTIONS: '/api/captions',
  RECIPE: '/api/recipe',
  STORES: '/api/stores',
  SPEECH_TTS: '/api/speech/tts',
  SPEECH_STT: '/api/speech/stt',
  SPEECH_CONVERSE: '/api/speech/converse',
  SPEECH_PROCESS: '/api/speech/process',
  STRIPE_CHECKOUT: '/api/stripe/create-checkout-session',
  RECIPE_SAVE: '/api/recipes/save',
};

// Full API URLs
const API_ENDPOINTS = {
  CAPTIONS: `${API_BASE_URL}/api/captions`,
  RECIPE: `${API_BASE_URL}/api/recipe`,
  STORES: `${API_BASE_URL}/api/stores`,
  HEALTH: `${API_BASE_URL}/health`,
  SPEECH_TTS: `${API_BASE_URL}/api/speech/tts`,
  SPEECH_STT: `${API_BASE_URL}/api/speech/stt`,
  SPEECH_CONVERSE: `${API_BASE_URL}/api/speech/converse`,
  SPEECH_PROCESS: `${API_BASE_URL}/api/speech/process`,
  STRIPE_CHECKOUT: `${API_BASE_URL}/api/stripe/create-checkout-session`,
  RECIPE_SAVE: `${API_BASE_URL}/api/recipes/save`,
};

const OPENAI_CONFIG = {
  MODEL: 'gpt-4o',
  TEMPERATURE: 0.0, // Zero hallucination as requested
  MAX_TOKENS: 2000,
};

const CORS_CONFIG = {
  origin: true,
  credentials: true,
  exposedHeaders: ['X-Transcript', 'X-Reply', 'X-Intent', 'X-Step-Number'],
};

const PORT = process.env.PORT || 5001;

export {
  API_BASE_URL,
  API_ENDPOINTS,
  ROUTES,
  OPENAI_CONFIG,
  CORS_CONFIG,
  PORT
};
