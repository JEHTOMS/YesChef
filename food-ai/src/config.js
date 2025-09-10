// Configuration for the YouTube Caption Extractor backend
// Following the architecture from DmitrySadovnikov/YouTube-Caption-Extractor

const ROUTES = {
  HOME: '/',
  CAPTIONS: '/api/captions',
  RECIPE: '/api/recipe',
  STORES: '/api/stores',
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
  ROUTES,
  OPENAI_CONFIG,
  CORS_CONFIG,
  PORT
};
