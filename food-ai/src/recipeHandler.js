import { captionsHandler } from './captionsHandler.js';
import { socialMediaHandler, isSocialMediaUrl } from './socialMediaHandler.js';
import { OpenAI } from 'openai';
import { OPENAI_CONFIG } from './config.js';

// Add fetch polyfill
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Simple in-memory cache to reduce OpenAI API calls
const recipeCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (reduced from 1 hour)

function getCacheKey(videoUrl, recipeName) {
  // Create a more specific cache key including the video ID if possible
  if (videoUrl) {
    // Extract video ID from various URL formats
    const videoIdMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\s?]+)/);
    if (videoIdMatch) {
      return `yt:${videoIdMatch[1]}`;
    }
    // For other URLs, use the full URL
    return `url:${videoUrl}`;
  }
  if (recipeName) {
    return `name:${recipeName.toLowerCase().trim()}`;
  }
  return '';
}

function getCachedRecipe(key) {
  if (!key) return null;
  const cached = recipeCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`✅ Returning cached recipe for key: ${key}`);
    return cached.data;
  }
  // Clean up expired cache entry
  if (cached) {
    console.log(`🗑️ Removing expired cache entry for key: ${key}`);
    recipeCache.delete(key);
  }
  return null;
}

function setCachedRecipe(key, data) {
  if (!key) return;
  console.log(`💾 Caching recipe for key: ${key}`);
  recipeCache.set(key, { data, timestamp: Date.now() });
  // Limit cache size
  if (recipeCache.size > 100) {
    const firstKey = recipeCache.keys().next().value;
    recipeCache.delete(firstKey);
  }
}

// Clear all cached recipes (useful for debugging/deployment)
export function clearRecipeCache() {
  const size = recipeCache.size;
  recipeCache.clear();
  console.log(`🧹 Cleared ${size} cached recipes`);
  return size;
}

// Enhanced error logging helper
function logError(context, error, additionalInfo = {}) {
  console.error(`[${context}] Error:`, {
    message: error.message,
    stack: error.stack,
    ...additionalInfo,
    timestamp: new Date().toISOString()
  });
}

// Rate limiting helper with exponential backoff
async function callOpenAIWithRetry(openaiFunction, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[OpenAI] Attempt ${attempt}/${maxRetries}`);
      return await openaiFunction();
    } catch (error) {
      lastError = error;
      
      // Check if it's a rate limit error
      if (error.status === 429 || error.message.includes('rate limit') || error.message.includes('quota')) {
        const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(`[OpenAI] Rate limit hit, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // For non-rate-limit errors, don't retry
      if (attempt === 1 && !error.message.includes('rate limit')) {
        console.error(`[OpenAI] Non-retryable error:`, error.message);
        throw error;
      }
      
      // Last attempt failed
      if (attempt === maxRetries) {
        console.error(`[OpenAI] All ${maxRetries} attempts failed`);
        throw lastError;
      }
    }
  }
  
  throw lastError;
}

// API key validation helper
function validateApiKeys() {
  const issues = [];
  
  if (!process.env.OPENAI_API_KEY) {
    issues.push('OPENAI_API_KEY is required for recipe processing');
  }
  
  if (!process.env.VIDNAVIGATOR_API_KEY) {
    issues.push('VIDNAVIGATOR_API_KEY is required for social media video transcription (optional but recommended)');
  }
  
  if (!process.env.YOUTUBE_API_KEY) {
    issues.push('YOUTUBE_API_KEY is required for video search (optional but recommended)');
  }
  
  if (!process.env.GOOGLE_API_KEY) {
    issues.push('GOOGLE_API_KEY is required for image search (optional but recommended)');
  }
  
  if (!process.env.GOOGLE_SEARCH_ENGINE_ID) {
    issues.push('GOOGLE_SEARCH_ENGINE_ID is required for image search (optional but recommended)');
  }
  
  return issues;
}

// Extract clean food name from video title, removing adjectives and promotional text
function extractCleanFoodName(title) {
  if (!title || typeof title !== 'string') return 'Recipe';
  
  // Common words to remove (adjectives, promotional terms, etc.)
  const wordsToRemove = [
    'easy', 'quick', 'best', 'perfect', 'delicious', 'amazing', 'ultimate',
    'simple', 'homemade', 'authentic', 'traditional', 'classic', 'crispy',
    'creamy', 'spicy', 'tasty', 'yummy', 'mouthwatering', 'incredible',
    'how to make', 'recipe', 'cooking', 'tutorial', 'video', 'vlog',
    'asmr', 'mukbang', 'food', 'dish', 'meal', 'chef', 'kitchen'
  ];
  
  // Remove emojis and special characters
  let cleaned = title
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
    .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
    .toLowerCase()
    .trim();
  
  // Remove promotional words
  wordsToRemove.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  });
  
  // Clean up extra spaces and capitalize
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return cleaned || 'Recipe';
}

// Validate if input is food-related using OpenAI
async function validateFoodInput(query) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      ...OPENAI_CONFIG
    });

    const prompt = `Analyze if the following input is food, cooking, or recipe-related. Return only a JSON object with "isFood" (boolean) and "confidence" (0-1).

Input: "${query}"

Consider food-related if it's:
- A dish name, recipe, or cooking method
- An ingredient or food item
- A cooking technique or kitchen term
- A restaurant dish or cuisine type

NOT food-related if it's:
- Clearly unrelated topics (sports, technology, politics, etc.)
- Random text or gibberish
- Non-food objects or concepts

Be strict - only return isFood: false with high confidence (>0.8) if you're absolutely certain it's not food-related.`;

    const response = await callOpenAIWithRetry(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 100,
      });
    });

    const content = response.choices[0]?.message?.content?.trim();
    
    try {
      const result = JSON.parse(content);
      // Ensure valid response format
      if (typeof result.isFood === 'boolean' && typeof result.confidence === 'number') {
        return {
          isFood: result.isFood,
          confidence: Math.min(Math.max(result.confidence, 0), 1) // Clamp between 0-1
        };
      }
    } catch (parseError) {
      console.warn('Failed to parse validation response:', content);
    }

    // Default to allowing the request if parsing fails
    return { isFood: true, confidence: 0.5 };
    
  } catch (error) {
    console.error('Food validation error:', error);
    // Default to allowing the request if validation fails
    return { isFood: true, confidence: 0.5 };
  }
}

export async function recipeHandler(requestData) {
  try {
    console.log('Recipe handler received data:', JSON.stringify(requestData, null, 2));
    
    // Check cache first
    const cacheKey = getCacheKey(requestData.videoInput, requestData.recipeName);
    const cached = getCachedRecipe(cacheKey);
    if (cached) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, data: cached, fromCache: true }),
      };
    }
    
    // Validate API keys and log issues
    const apiKeyIssues = validateApiKeys();
    if (apiKeyIssues.length > 0) {
      console.warn('API Key Issues:', apiKeyIssues);
    }
    
    // Handle food validation requests
    if (requestData.validateOnly) {
      const validation = await validateFoodInput(requestData.recipeName);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: true, 
          validation 
        }),
      };
    }
    
    // Verify critical API key exists
    if (!process.env.OPENAI_API_KEY) {
      logError('API_VALIDATION', new Error('OpenAI API key missing'), { 
        required: 'OPENAI_API_KEY',
        provided: !!process.env.OPENAI_API_KEY
      });
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          error: 'OpenAI API key not configured - please add OPENAI_API_KEY to your environment variables',
          details: 'Missing OPENAI_API_KEY environment variable'
        }),
      };
    }

    const { recipeName, videoInput } = requestData;
    console.log('Processing input - recipeName:', recipeName, 'videoInput:', videoInput);

    let youtubeUrl = videoInput;

    // Handle food name input by finding a YouTube recipe
    if (recipeName && !videoInput) {
      console.log(`Finding YouTube recipe video for: ${recipeName}`);
      youtubeUrl = await findYoutubeVideoForQuery(recipeName);
      if (!youtubeUrl) {
        console.log('No YouTube video found, generating recipe directly from query');
        const recipeFromQuery = await generateRecipeFromQuery(recipeName);
        const imageUrl = await getFoodImage(recipeFromQuery.title || recipeName, recipeName);
        
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            data: {
              recipe: { ...recipeFromQuery, image: imageUrl }
            }
          }),
        };
      }
    }

    if (!youtubeUrl) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Please provide either a recipe name or YouTube URL' }),
      };
    }

    console.log(`Processing video URL: ${youtubeUrl}`);

    // Route to appropriate handler based on URL type
    let captionResponse;
    if (isSocialMediaUrl(youtubeUrl)) {
      console.log('Detected social media URL, using VidNavigator API');
      captionResponse = await socialMediaHandler({
        videoInput: youtubeUrl
      });
    } else {
      console.log('Detected YouTube URL, using YouTube transcript API');
      captionResponse = await captionsHandler({
        videoInput: youtubeUrl
      });
    }

    const captionData = JSON.parse(captionResponse.body);
    if (!captionData.success) {
      console.error('Caption extraction failed:', captionData.error);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false, 
          error: `Video processing failed: ${captionData.error}`,
          platform: captionData.platform 
        }),
      };
    }

    const { subtitles, videoId, title, description, platform, originalUrl, thumbnail } = captionData.data;
    const queryUsed = recipeName || '';

    // For social media videos, prioritize description (caption) as it often contains ingredients/steps
    let contentToAnalyze = '';
    let contentSource = '';
    
    // Check if description has useful recipe information (ingredients, steps, etc.)
    const hasUsefulDescription = description && description.length > 50 && (
      description.toLowerCase().includes('ingredient') ||
      description.toLowerCase().includes('recipe') ||
      description.toLowerCase().includes('cup') ||
      description.toLowerCase().includes('tbsp') ||
      description.toLowerCase().includes('step') ||
      /\d+\s*(cup|tbsp|tsp|oz|gram|ml|minute|min)/i.test(description)
    );

    if (hasUsefulDescription) {
      console.log('Using video description/caption as primary source (contains recipe info)');
      contentToAnalyze = description;
      contentSource = 'description';
    }

    // Convert subtitles array to transcript text
    let transcript = '';
    if (subtitles && subtitles.length > 0) {
      transcript = subtitles
        .map(sub => sub.text)
        .filter(text => {
          // Filter out music, sound effects, and non-verbal content
          const cleanText = text.trim().toLowerCase();
          return cleanText.length > 0 && 
                 !cleanText.match(/^\[.*\]$/) && // Remove [Music], [Applause], etc.
                 !cleanText.match(/^♪.*♪$/) &&   // Remove ♪ music lyrics ♪
                 !cleanText.match(/^[a-z]$/) &&  // Remove single letters
                 cleanText !== 'h' && 
                 cleanText !== 'k' &&
                 cleanText !== 'ээ';
        })
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log(`Filtered transcript: ${subtitles.length} subtitle entries → ${transcript.length} characters of text`);
    }

    // If description wasn't useful, use transcript
    if (!contentToAnalyze && transcript && transcript.length > 100) {
      contentToAnalyze = transcript;
      contentSource = 'transcript';
    }

    // If we have both, combine them (description first as it's more structured)
    if (hasUsefulDescription && transcript && transcript.length > 100) {
      console.log('Combining description and transcript for better recipe extraction');
      contentToAnalyze = `Caption/Description:\n${description}\n\nVideo Transcript:\n${transcript}`;
      contentSource = 'combined';
    }

    console.log(`Content source for recipe extraction: ${contentSource} (${contentToAnalyze.length} characters)`);

    // If we have sufficient transcript, extract recipe from it
    if (contentToAnalyze && contentToAnalyze.length > 50) {
      console.log(`Processing ${contentSource} content of ${contentToAnalyze.length} characters`);
      const cleanedTitle = extractCleanFoodName(title || queryUsed || 'Recipe');
      const recipeFromTranscript = await extractRecipeFromTranscript(contentToAnalyze, cleanedTitle, contentSource);
      const imageUrl = await getFoodImage(recipeFromTranscript.title || title, queryUsed);
      
      const resultData = {
        videoId,
        videoTitle: title,
        videoDescription: description,
        platform: platform || 'YouTube',
        originalUrl: originalUrl || youtubeUrl,
        thumbnail: thumbnail || null,
        recipe: { ...recipeFromTranscript, image: imageUrl }
      };
      
      // Cache the result
      setCachedRecipe(cacheKey, resultData);
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          data: resultData
        }),
      };
    } else if (title) {
      console.log('No sufficient transcript found, generating recipe based on video title');
      const recipeFromTitle = await generateRecipeFromTitle(title);
      const imageUrl = await getFoodImage(recipeFromTitle.title || title, queryUsed);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          data: {
            videoId,
            videoTitle: title,
            videoDescription: description,
            platform: platform || 'YouTube',
            originalUrl: originalUrl || youtubeUrl,
            thumbnail: thumbnail || null,
            recipe: { ...recipeFromTitle, image: imageUrl }
          }
        }),
      };
    }

    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Could not extract recipe from video' }),
    };

  } catch (error) {
    logError('RECIPE_HANDLER', error, { 
      requestData: requestData,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasYouTubeKey: !!process.env.YOUTUBE_API_KEY,
      hasGoogleKey: !!process.env.GOOGLE_API_KEY
    });
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Too many requests at the moment. Please try again later.';
    let errorCode = 500;
    
    if (error.message.includes('API key') || error.message.includes('401') || error.message.includes('authentication')) {
      errorMessage = 'API authentication error - please check your API keys';
      errorCode = 401;
    } else if (error.message.includes('quota') || error.message.includes('rate limit') || error.message.includes('429')) {
      errorMessage = 'Too many requests at the moment. Please try again later.';
      errorCode = 429;
    } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('ENOTFOUND')) {
      errorMessage = 'Network error - please check your internet connection';
      errorCode = 503;
    } else if (error.message.includes('transcript') || error.message.includes('subtitles')) {
      errorMessage = 'Could not extract transcript from video - please try a different video';
      errorCode = 422;
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timeout - please try again';
      errorCode = 408;
    }
    
    return {
      statusCode: errorCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: error.message,
        timestamp: new Date().toISOString(),
        helpUrl: 'Please ensure all required API keys are configured in your .env file'
      }),
    };
  }
}

async function extractRecipeFromTranscript(content, videoTitle, contentSource = 'transcript') {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const sourceContext = contentSource === 'description' 
    ? 'This is from the video caption/description which often contains the full recipe with ingredients and steps.'
    : contentSource === 'combined'
    ? 'This combines the video caption and transcript. The caption often has the structured recipe.'
    : 'This is from the video transcript (spoken words).';
  
  const prompt = `Extract a complete recipe from this video content. The video is titled "${videoTitle}".

${sourceContext}

Content:
${content}

IMPORTANT: Return servings and calories as plain numbers (not strings), like: "servings": 4, "calories": 350

Create a JSON response with this exact structure:
{
  "title": "Recipe name from the video",
  "description": "Brief description of the dish",
  "servings": 4,
  "cookTime": "Total cooking time",
  "difficulty": "Easy/Medium/Hard",  
  "calories": 350,
  "ingredients": [
    {
      "item": "ingredient name",
      "amount": "quantity with unit",
      "notes": "preparation notes if mentioned"
    }
  ],
  "steps": [
    {
      "step": 1,
      "instruction": "Mix flour and sugar in a large bowl",
      "equipment": "large mixing bowl",
      "ingredients": ["flour", "sugar"]
    },
    {
      "step": 2,
      "instruction": "Sauté onions over medium heat for about 5 minutes until translucent",
      "equipment": "frying pan",
      "ingredients": ["onions", "oil"]
    }
  ],
  "tools": ["list", "of", "kitchen", "equipment", "needed"],
  "allergens": ["common", "allergens", "present"],
  "tips": ["helpful", "cooking", "tips", "from", "video"]
}

IMPORTANT FORMATTING RULES:
- NEVER include "time" or "heat" fields unless the transcript explicitly mentions specific cooking times or heat levels
- If transcript says "cook for 5 minutes", include that time IN THE INSTRUCTION TEXT: "Cook for about 5 minutes"  
- If transcript says "medium heat", include that heat IN THE INSTRUCTION TEXT: "Cook over medium heat"
- DO NOT create separate time/heat fields - embed timing and heat information directly in the instruction text
- Convert hours to minutes (e.g., "1.5 hours" becomes "about 90 minutes") within instruction text
- Use SINGLE estimates like "about 5 minutes", "about 12 minutes" - NEVER ranges like "5-7 minutes"
- ALWAYS include an "ingredients" array for each step listing the specific ingredients used in that step
- Keep ingredient names simple (e.g., "onions", "garlic", "oil", "flour") matching the main ingredient list

Extract only information that is explicitly mentioned in the content. For calories, estimate per serving based on the ingredients and cooking methods mentioned, using standard nutritional values. Be accurate and detailed.

IMPORTANT for title: Extract just the core food name from "${videoTitle}", removing adjectives like "easy", "quick", "best", "perfect", "delicious", "amazing", etc. For example:
- "The BEST Crispy Fried Chicken!" → "Fried Chicken"
- "Easy Homemade Chocolate Cake" → "Chocolate Cake"  
- "Perfect Creamy Pasta Carbonara" → "Pasta Carbonara"`;

  try {
    console.log(`[OpenAI] Starting recipe extraction from ${contentSource} (${content.length} chars)`);
    const response = await callOpenAIWithRetry(async () => {
      return await openai.chat.completions.create({
        model: OPENAI_CONFIG.MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: OPENAI_CONFIG.TEMPERATURE,
        max_tokens: OPENAI_CONFIG.MAX_TOKENS,
        response_format: { type: 'json_object' }
      });
    });

    const responseContent = response.choices[0].message.content.trim();
    const data = safeParseJson(responseContent);
    const normalized = normalizeRecipe(data);
    
    // Log what fields we got from OpenAI
    console.log('[OpenAI] Recipe fields returned:', Object.keys(normalized));
    console.log('[OpenAI] Description:', normalized.description ? 'YES' : 'NO');
    console.log('[OpenAI] CookTime:', normalized.cookTime ? 'YES' : 'NO');
    console.log('[OpenAI] Servings:', normalized.servings ? 'YES' : 'NO');
    console.log('[OpenAI] Difficulty:', normalized.difficulty ? 'YES' : 'NO');
    console.log('[OpenAI] Calories:', normalized.calories ? 'YES' : 'NO');
    
    return normalized;
  } catch (error) {
    logError('OPENAI_RECIPE_EXTRACTION', error, { contentLength: content.length, contentSource });
    
    // Provide more specific error message for rate limits
    if (error.status === 429 || error.message.includes('rate limit')) {
      throw new Error('Too many requests at the moment. Please try again later.');
    }
    
    throw new Error(`Recipe extraction failed: ${error.message}`);
  }
}

async function generateRecipeFromTitle(videoTitle) {
  // Generate a recipe from video title using OpenAI with zero hallucination
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const prompt = `Based on this video title "${videoTitle}", generate a realistic cooking recipe.

IMPORTANT: Return servings and calories as plain numbers (not strings), like: "servings": 4, "calories": 350

Create a JSON response with this exact structure:
{
  "title": "Recipe name based on the video title",
  "description": "Brief description",
  "servings": 4,
  "cookTime": "Total cooking time",
  "difficulty": "Easy/Medium/Hard",
  "calories": 350,
  "ingredients": [
    {
      "item": "ingredient name",
      "amount": "quantity with unit",
      "notes": "any preparation notes"
    }
  ],
  "steps": [
    {
      "step": 1,
      "instruction": "Mix dry ingredients in bowl",
      "equipment": "mixing bowl",
      "ingredients": ["flour", "sugar", "salt"]
    },
    {
      "step": 2,
      "instruction": "Sauté vegetables over medium heat for about 3 minutes until softened",
      "equipment": "frying pan",
      "ingredients": ["onions", "bell peppers", "oil"]
    }
  ],
  "tools": ["list", "of", "kitchen", "tools"],
  "allergens": ["common", "allergens"],
  "tips": ["helpful", "cooking", "tips"]
}

IMPORTANT FORMATTING RULES:
- NEVER include separate "time" or "heat" fields - embed timing and heat information directly in the instruction text
- If timing is needed, include it IN THE INSTRUCTION: "Cook for about 5 minutes", "Bake for about 25 minutes"
- If heat level is needed, include it IN THE INSTRUCTION: "Sauté over medium heat", "Cook on high heat"
- Convert hours to minutes (e.g., "1.5 hours" becomes "about 90 minutes") within instruction text
- Use SINGLE estimates like "about 5 minutes", "about 12 minutes" - NEVER ranges like "5-7 minutes"
- DO NOT create separate time/heat fields - all timing and temperature info goes in instruction text
- ALWAYS include an "ingredients" array for each step listing the specific ingredients used in that step
- Keep ingredient names simple (e.g., "onions", "garlic", "oil", "flour") matching the main ingredient list

Make it realistic and detailed. Estimate calories per serving based on typical ingredients and portions for this type of dish. Only return valid JSON.`;

  try {
    console.log(`[OpenAI] Generating recipe from title: "${videoTitle}"`);
    const response = await callOpenAIWithRetry(async () => {
      return await openai.chat.completions.create({
        model: OPENAI_CONFIG.MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: OPENAI_CONFIG.TEMPERATURE,
        max_tokens: OPENAI_CONFIG.MAX_TOKENS,
        response_format: { type: 'json_object' }
      });
    });

  const content = response.choices[0].message.content.trim();
  const data = safeParseJson(content);
  return normalizeRecipe(data);
  } catch (error) {
    logError('OPENAI_RECIPE_FROM_TITLE', error, { videoTitle });
    
    if (error.status === 429 || error.message.includes('rate limit')) {
      throw new Error('Too many requests at the moment. Please try again later.');
    }
    
    throw new Error(`Recipe generation failed: ${error.message}`);
  }
}

async function generateRecipeFromQuery(query) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = `You are a precise recipe creation AI. Create a realistic, well-structured recipe for "${query}".

IMPORTANT: Return servings and calories as plain numbers (not strings), like: "servings": 4, "calories": 350

Return ONLY valid JSON with this exact schema:
{
  "title": "Recipe name",
  "description": "Brief description",
  "servings": 4,
  "cookTime": "Total cooking time",
  "difficulty": "Easy/Medium/Hard",
  "calories": 350,
  "ingredients": [
    { "item": "ingredient name", "amount": "quantity with unit", "notes": "optional notes" }
  ],
  "steps": [
    { "step": 1, "instruction": "Chop vegetables finely", "equipment": "knife", "ingredients": ["onions", "carrots", "celery"] },
    { "step": 2, "instruction": "Sauté onions over medium heat for about 4 minutes until translucent", "equipment": "pan", "ingredients": ["onions", "oil"] }
  ],
  "tools": ["list", "of", "kitchen", "tools"],
  "allergens": ["common", "allergens"],
  "tips": ["useful", "tips"]
}

IMPORTANT FORMATTING RULES:
- NEVER include separate "time" or "heat" fields - embed timing and heat information directly in the instruction text
- If timing is needed, include it IN THE INSTRUCTION: "Cook for about 10 minutes", "Simmer for about 30 minutes" 
- If heat level is needed, include it IN THE INSTRUCTION: "Cook over medium heat", "Bake at 350°F"
- Convert hours to minutes (e.g., "1.5 hours" becomes "about 90 minutes") within instruction text
- Use SINGLE estimates like "about 5 minutes", "about 12 minutes" - NEVER ranges like "5-7 minutes"
- DO NOT create separate time/heat fields - all timing and temperature info goes in instruction text
- ALWAYS include an "ingredients" array for each step listing the specific ingredients used in that step
- Keep ingredient names simple (e.g., "onions", "garlic", "oil", "flour") matching the main ingredient list

Estimate calories per serving based on typical ingredients and portions for this dish.`;

  console.log(`[OpenAI] Generating recipe from query: "${query}"`);
  const response = await callOpenAIWithRetry(async () => {
    return await openai.chat.completions.create({
      model: OPENAI_CONFIG.MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: OPENAI_CONFIG.TEMPERATURE,
      max_tokens: OPENAI_CONFIG.MAX_TOKENS,
      response_format: { type: 'json_object' }
    });
  });

  const content = response.choices[0].message.content.trim();
  const data = safeParseJson(content);
  return normalizeRecipe(data);
}

async function findYoutubeVideoForQuery(query) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    console.log('🔍 YouTube search debug:');
    console.log('- Query:', query);
    console.log('- API Key exists:', !!apiKey);
    console.log('- Search Engine ID exists:', !!searchEngineId);
    
    if (!apiKey || !searchEngineId) {
      console.log('❌ Missing Google API credentials');
      return null;
    }

    // TIER 1: Try YouTube first
    const ytUrl = await searchYouTubeRecipes(query, apiKey, searchEngineId);
    if (ytUrl) return ytUrl;

    // TIER 2: Try Allrecipes.com
    console.log('🥘 Trying Allrecipes.com fallback...');
    const allrecipesUrl = await searchAllRecipes(query, apiKey, searchEngineId);
    if (allrecipesUrl) return allrecipesUrl;

    // TIER 3: Try other reliable recipe sites
    console.log('🍳 Trying other reliable recipe sites...');
    const reliableSiteUrl = await searchReliableRecipeSites(query, apiKey, searchEngineId);
    return reliableSiteUrl;
    
  } catch (err) {
    console.warn('❌ Recipe search failed:', err.message);
    return null;
  }
}

async function searchYouTubeRecipes(query, apiKey, searchEngineId) {
  try {
    const q = encodeURIComponent(`${query} recipe cooking site:youtube.com`);
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${q}&num=5&safe=active`;
    console.log('- YouTube Search URL:', url.replace(apiKey, 'API_KEY_HIDDEN'));
    
    const res = await fetch(url);
    console.log('- YouTube Response status:', res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.log('❌ YouTube API Error response:', errorText);
      return null;
    }
    
    const data = await res.json();
    console.log('- YouTube Search results count:', data.items?.length || 0);
    
    const items = data.items || [];
    // Filter YouTube videos
    const youtubeVideos = items.filter(i => /youtube\.com|youtu\.be/.test(i.link || ''));
    
    if (youtubeVideos.length > 0) {
      // Add randomization to prevent duplicate results for repeated searches
      const randomIndex = Math.floor(Math.random() * youtubeVideos.length);
      const selectedVideo = youtubeVideos[randomIndex];
      console.log(`✅ Found YouTube video (${randomIndex + 1}/${youtubeVideos.length}):`, selectedVideo.link);
      return selectedVideo.link;
    } else {
      console.log('❌ No YouTube video found in results');
      return null;
    }
  } catch (err) {
    console.warn('❌ YouTube search error:', err.message);
    return null;
  }
}

async function searchAllRecipes(query, apiKey, searchEngineId) {
  try {
    const q = encodeURIComponent(`${query} recipe site:allrecipes.com`);
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${q}&num=3&safe=active`;
    
    const res = await fetch(url);
    if (!res.ok) return null;
    
    const data = await res.json();
    const firstResult = data.items?.[0];
    
    if (firstResult && /allrecipes\.com/.test(firstResult.link)) {
      console.log('✅ Found Allrecipes.com recipe:', firstResult.link);
      return firstResult.link;
    }
    
    return null;
  } catch (err) {
    console.warn('❌ Allrecipes search error:', err.message);
    return null;
  }
}

async function searchReliableRecipeSites(query, apiKey, searchEngineId) {
  try {
    // Target reliable recipe sites with good images
    const sites = [
      'foodnetwork.com',
      'bonappetit.com', 
      'epicurious.com',
      'seriouseats.com',
      'food.com',
      'delish.com',
      'tasteofhome.com'
    ];
    
    const siteQuery = sites.map(site => `site:${site}`).join(' OR ');
    const q = encodeURIComponent(`${query} recipe (${siteQuery})`);
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${q}&num=5&safe=active`;
    
    const res = await fetch(url);
    if (!res.ok) return null;
    
    const data = await res.json();
    const firstReliable = data.items?.find(item => 
      sites.some(site => item.link?.includes(site))
    );
    
    if (firstReliable) {
      console.log('✅ Found reliable recipe site:', firstReliable.link);
      return firstReliable.link;
    }
    
    return null;
  } catch (err) {
    console.warn('❌ Reliable sites search error:', err.message);
    return null;
  }
}

async function getFoodImage(dishName, originalQuery = null) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    if (!apiKey || !searchEngineId) return null;

    // Use the original user input for more specific searches
    const searchTerm = originalQuery || dishName;
    console.log(`🖼️ Searching for specific image for: "${searchTerm}"`);

    // TIER 1: Search for exact user input/recipe name
    const specificImage = await searchSpecificFoodImage(searchTerm, apiKey, searchEngineId);
    if (specificImage) return specificImage;

    // TIER 2: Search reliable food sites for high-quality images
    console.log('🖼️ Searching reliable food sites...');
    const reliableImage = await searchReliableFoodImages(dishName, apiKey, searchEngineId);
    if (reliableImage) return reliableImage;

    // TIER 3: General high-quality food photo search
    console.log('📸 Fallback to general food photos...');
    const generalImage = await searchGeneralFoodImages(dishName, apiKey, searchEngineId);
    return generalImage;
    
  } catch (error) {
    console.warn('Error fetching recipe image:', error.message);
    return null;
  }
}

async function searchSpecificFoodImage(searchTerm, apiKey, searchEngineId) {
  try {
    // Clean and enhance the search term for better results
    const cleanQuery = searchTerm
      .replace(/recipe|food|dish|video|tutorial/gi, '') // Remove redundant words
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    // Create a highly specific query for the exact dish with better filters
    const specificQuery = encodeURIComponent(`${cleanQuery} prepared dish plated food photography`);
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${specificQuery}&searchType=image&num=10&safe=active&imgType=photo&imgSize=large&imgColorType=color&fileType=jpg,png`;
    
    console.log(`🔍 Searching for specific image: "${cleanQuery}"`);
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Filter out images that are likely not actual food photos
    const relevantImages = data.items?.filter(item => {
      const link = item.link?.toLowerCase() || '';
      const title = item.title?.toLowerCase() || '';
      const snippet = item.snippet?.toLowerCase() || '';
      const contextLink = item.image?.contextLink?.toLowerCase() || '';
      
      // Exclude common non-food image types
      const isExcluded = 
        link.includes('icon') ||
        link.includes('logo') ||
        link.includes('button') ||
        link.includes('avatar') ||
        link.includes('profile') ||
        title.includes('icon') ||
        title.includes('logo') ||
        contextLink.includes('wikipedia') || // Often show ingredient photos instead of dishes
        contextLink.includes('wiki');
      
      // Must have good dimensions
      const hasGoodDimensions = 
        item.image?.width >= 500 && 
        item.image?.height >= 400;
      
      return !isExcluded && hasGoodDimensions;
    }) || [];
    
    // Prioritize images that are from recipe sites or clearly show the dish
    const bestImage = relevantImages.find(item => {
      const link = item.link?.toLowerCase() || '';
      const title = item.title?.toLowerCase() || '';
      const snippet = item.snippet?.toLowerCase() || '';
      const contextLink = item.image?.contextLink?.toLowerCase() || '';
      
      // Prefer images from known recipe sites
      const isFromRecipeSite = 
        contextLink.includes('recipe') ||
        contextLink.includes('allrecipes') ||
        contextLink.includes('foodnetwork') ||
        contextLink.includes('bonappetit') ||
        contextLink.includes('epicurious') ||
        contextLink.includes('seriouseats') ||
        contextLink.includes('food');
      
      // Prefer images that mention the dish name
      const mentionsDish = 
        title.includes(cleanQuery.toLowerCase()) ||
        snippet.includes(cleanQuery.toLowerCase());
      
      return (isFromRecipeSite || mentionsDish);
    });
    
    if (bestImage) {
      console.log('✅ Found high-quality recipe image from:', bestImage.image?.contextLink);
      return bestImage.link;
    }
    
    // Fallback to first relevant image with good dimensions
    const fallbackImage = relevantImages[0];
    
    if (fallbackImage) {
      console.log('✅ Using fallback image from:', fallbackImage.image?.contextLink);
    }
    
    return fallbackImage?.link || null;
  } catch (error) {
    console.warn('Specific food image search error:', error.message);
    return null;
  }
}

async function searchReliableFoodImages(dishName, apiKey, searchEngineId) {
  try {
    // Target sites known for high-quality food photography
    const reliableSites = [
      'allrecipes.com',
      'foodnetwork.com',
      'bonappetit.com',
      'epicurious.com',
      'seriouseats.com',
      'food.com',
      'delish.com',
      'tasteofhome.com'
    ];
    
    const siteQuery = reliableSites.map(site => `site:${site}`).join(' OR ');
    const query = encodeURIComponent(`${dishName} recipe food (${siteQuery})`);
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${query}&searchType=image&num=5&safe=active&imgType=photo&imgSize=large&imgColorType=color`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    const bestImage = data.items?.find(item => 
      reliableSites.some(site => item.displayLink?.includes(site)) &&
      item.image?.width >= 400 &&
      item.image?.height >= 300
    );
    
    if (bestImage) {
      console.log('✅ Found high-quality image from reliable site:', bestImage.displayLink);
      return bestImage.link;
    }
    
    return null;
  } catch (error) {
    console.warn('Reliable food image search error:', error.message);
    return null;
  }
}

async function searchGeneralFoodImages(dishName, apiKey, searchEngineId) {
  try {
    const query = encodeURIComponent(`${dishName} food dish prepared crispy clear high quality`);
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${query}&searchType=image&num=3&safe=active&imgType=photo&imgSize=large&imgColorType=color`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    const bestImage = data.items?.find(item =>
      item.image?.width >= 400 &&
      item.image?.height >= 300
    );
    
    if (bestImage) {
      console.log('✅ Found general high-quality food image');
      return bestImage.link;
    }
    
    return data.items?.[0]?.link || null;
  } catch (error) {
    console.warn('General food image search error:', error.message);
    return null;
  }
}

function safeParseJson(content) {
  // Strip code fences if present
  let c = content.trim();
  if (c.startsWith('```')) {
    c = c.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```\s*$/, '');
  }
  const start = c.indexOf('{');
  const end = c.lastIndexOf('}') + 1;
  const jsonStr = start >= 0 && end > start ? c.slice(start, end) : c;
  return JSON.parse(jsonStr);
}

// Normalize and sanitize recipe fields for strict UX rules
function normalizeRecipe(recipe) {
  if (!recipe || typeof recipe !== 'object') return recipe;

  // Ensure numeric servings/calories
  if (recipe.servings != null) {
    recipe.servings = Number(recipe.servings);
    if (!Number.isFinite(recipe.servings) || recipe.servings <= 0) delete recipe.servings;
  }
  if (recipe.calories != null) {
    recipe.calories = Number(recipe.calories);
    if (!Number.isFinite(recipe.calories) || recipe.calories <= 0) delete recipe.calories;
  }

  // Clean steps - remove any separate time/heat fields since they should be in instruction text
  if (Array.isArray(recipe.steps)) {
    recipe.steps = recipe.steps.map(s => {
      if (s && typeof s === 'object') {
        // Remove separate time/heat fields - everything should be in instruction text now
        const cleaned = { ...s };
        delete cleaned.time;
        delete cleaned.heat;
        return cleaned;
      }
      return s;
    });
  }
  return recipe;
}


