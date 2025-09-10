// Configuration for the YouTube Caption Extractor backend
// Following the architecture from DmitrySadovnikov/YouTube-Caption-Extractor

// API Base URL - uses environment variable or falls back to localhost for development
// Configuration constants for the YesChef application
// Author: DmitrySadovnikov
// Date: 2024
// Connected to Railway backend

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const ROUTES = {
  HOME: '/',
  CAPTIONS: '/api/captions',
  RECIPE: '/api/recipe',
  STORES: '/api/stores',
};

// Full API URLs
const API_ENDPOINTS = {
  CAPTIONS: `${API_BASE_URL}/api/captions`,
  RECIPE: `${API_BASE_URL}/api/recipe`,
  STORES: `${API_BASE_URL}/api/stores`,
  HEALTH: `${API_BASE_URL}/health`,
};

const OPENAI_CONFIG = {
  MODEL: 'gpt-4o',
  TEMPERATURE: 0.0, // Zero hallucination as requested
  MAX_TOKENS: 2000,
};

const CORS_CONFIG = {
  origin: true,
  credentials: true,
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
