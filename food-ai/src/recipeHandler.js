import { captionsHandler } from './captionsHandler.js';
import { OpenAI } from 'openai';
import { OPENAI_CONFIG } from './config.js';

// Add fetch polyfill
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

export async function recipeHandler(requestData) {
  try {
    console.log('Recipe handler received data:', JSON.stringify(requestData, null, 2));
    
    // Verify API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not found');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'OpenAI API key not configured' }),
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

    console.log(`Processing YouTube URL: ${youtubeUrl}`);

    // Extract video details from YouTube
    const captionResponse = await captionsHandler({
      videoInput: youtubeUrl
    });

    const captionData = JSON.parse(captionResponse.body);
    if (!captionData.success) {
      console.error('Caption extraction failed:', captionData.error);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: `Video processing failed: ${captionData.error}` }),
      };
    }

    const { subtitles, videoId, title, description } = captionData.data;
    const queryUsed = recipeName || '';

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

    // If we have sufficient transcript, extract recipe from it
    if (transcript && transcript.length > 100) {
      console.log(`Processing transcript of ${transcript.length} characters from ${subtitles.length} subtitle entries`);
      const recipeFromTranscript = await extractRecipeFromTranscript(transcript, title || queryUsed || 'Recipe');
      const imageUrl = await getFoodImage(recipeFromTranscript.title || title, queryUsed);
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          data: {
            videoId,
            videoTitle: title,
            videoDescription: description,
            recipe: { ...recipeFromTranscript, image: imageUrl }
          }
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
    console.error('Recipe handler error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: false, 
        error: 'Internal server error during recipe processing',
        details: error.message 
      }),
    };
  }
}

async function extractRecipeFromTranscript(transcript, videoTitle) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const prompt = `Extract a complete recipe from this video transcript. The video is titled "${videoTitle}".

Transcript:
${transcript}

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

Extract only information that is explicitly mentioned in the transcript. For calories, estimate per serving based on the ingredients and cooking methods mentioned, using standard nutritional values. Be accurate and detailed.`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_CONFIG.MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: OPENAI_CONFIG.TEMPERATURE,
      max_tokens: OPENAI_CONFIG.MAX_TOKENS,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content.trim();
  const data = safeParseJson(content);
  return normalizeRecipe(data);
  } catch (error) {
    console.error('OpenAI recipe extraction failed:', error);
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
    const response = await openai.chat.completions.create({
      model: OPENAI_CONFIG.MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: OPENAI_CONFIG.TEMPERATURE,
      max_tokens: OPENAI_CONFIG.MAX_TOKENS,
      response_format: { type: 'json_object' }
    });

  const content = response.choices[0].message.content.trim();
  const data = safeParseJson(content);
  return normalizeRecipe(data);
  } catch (error) {
    console.error('Recipe generation from title failed:', error);
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

  const response = await openai.chat.completions.create({
    model: OPENAI_CONFIG.MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: OPENAI_CONFIG.TEMPERATURE,
    max_tokens: OPENAI_CONFIG.MAX_TOKENS,
    response_format: { type: 'json_object' }
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
    const firstYoutube = items.find(i => /youtube\.com|youtu\.be/.test(i.link || ''));
    
    if (firstYoutube) {
      console.log('✅ Found YouTube video:', firstYoutube.link);
      return firstYoutube.link;
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
      .replace(/recipe|food|dish/gi, '') // Remove redundant words
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    // Create a highly specific query for the exact dish
    const specificQuery = encodeURIComponent(`"${cleanQuery}" food prepared dish recipe high quality photo`);
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${specificQuery}&searchType=image&num=8&safe=active&imgType=photo&imgSize=large&imgColorType=color&fileType=jpg,png`;
    
    console.log(`🔍 Searching for specific image: "${cleanQuery}"`);
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Prioritize images that are likely recipe photos
    const bestImage = data.items?.find(item => {
      const link = item.link?.toLowerCase() || '';
      const title = item.title?.toLowerCase() || '';
      const snippet = item.snippet?.toLowerCase() || '';
      
      // Prefer images from recipe/food content
      const isRecipeImage = 
        link.includes('recipe') ||
        title.includes('recipe') ||
        snippet.includes('recipe') ||
        title.includes(cleanQuery.toLowerCase()) ||
        snippet.includes(cleanQuery.toLowerCase());
      
      const hasGoodDimensions = 
        item.image?.width >= 400 && 
        item.image?.height >= 300;
      
      return isRecipeImage && hasGoodDimensions;
    });
    
    if (bestImage) {
      console.log('✅ Found specific recipe image:', bestImage.title);
      return bestImage.link;
    }
    
    // Fallback to first high-quality image
    const fallbackImage = data.items?.find(item =>
      item.image?.width >= 400 &&
      item.image?.height >= 300
    );
    
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


