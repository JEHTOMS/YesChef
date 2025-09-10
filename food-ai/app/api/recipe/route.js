import OpenAI from "openai";
import { YoutubeTranscript } from "youtube-transcript";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// YouTube Data API search
async function searchYouTube(query) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' recipe cooking tutorial')}&maxResults=10&type=video&videoEmbeddable=true&key=${apiKey}`;
  
  const response = await fetch(searchUrl);
  const data = await response.json();
  return data.items || [];
}

// Get transcript for a video
async function getVideoTranscript(videoId) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript.map(item => ({
      text: item.text,
      start: Math.floor(item.offset),
      duration: item.duration
    }));
  } catch (error) {
    return null;
  }
}

// Parse transcript into cooking steps with OpenAI
async function parseTranscriptToSteps(transcript, recipeName) {
  const transcriptText = transcript.map(t => `[${t.start}s] ${t.text}`).join(' ');
  
  const prompt = `
You are a professional recipe analyzer. Parse this YouTube cooking video transcript for "${recipeName}" and extract ONLY the cooking steps.

Transcript: ${transcriptText}

Return a JSON array of cooking steps. Each step should have:
- text: Clear, concise cooking instruction (imperative form: "Heat oil", "Add onions", etc.)
- heat: "low", "medium", "high", or null if no heat mentioned
- time: Time in minutes as number, or null if no time mentioned. If range given, use the optimal time
- timestamp: Start time in seconds for this step from the transcript

Example format:
[
  {
    "text": "Heat olive oil in a large pan over medium heat",
    "heat": "medium", 
    "time": null,
    "timestamp": 45
  },
  {
    "text": "Cook the onions for about 5 minutes until softened",
    "heat": null,
    "time": 5,
    "timestamp": 120
  }
]

Only include actual cooking steps, ignore intro/outro/commentary. Maximum 12 steps.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    response_format: { type: "json_object" }
  });

  try {
    const result = JSON.parse(completion.choices[0].message.content);
    return result.steps || [];
  } catch (error) {
    console.error('Error parsing steps:', error);
    return [];
  }
}

// Extract ingredients with OpenAI
async function extractIngredients(transcript, recipeName) {
  const transcriptText = transcript.map(t => t.text).join(' ');
  
  const prompt = `
Extract ingredients from this cooking video transcript for "${recipeName}".

Transcript: ${transcriptText}

Return a JSON object with an "ingredients" array. Each ingredient should have:
- name: ingredient name
- quantity: amount and unit (e.g., "2 cups", "1 tablespoon", "to taste")

Example:
{
  "ingredients": [
    {"name": "olive oil", "quantity": "2 tablespoons"},
    {"name": "onion", "quantity": "1 medium"},
    {"name": "garlic", "quantity": "3 cloves"},
    {"name": "salt", "quantity": "to taste"}
  ]
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o", 
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    response_format: { type: "json_object" }
  });

  try {
    const result = JSON.parse(completion.choices[0].message.content);
    return result.ingredients || [];
  } catch (error) {
    console.error('Error parsing ingredients:', error);
    return [];
  }
}

// Get tools and allergens with OpenAI
async function getToolsAndAllergens(recipeName, ingredients) {
  const ingredientsList = ingredients.map(i => i.name).join(', ');
  
  const prompt = `
For the recipe "${recipeName}" with ingredients: ${ingredientsList}

Return JSON with:
1. "tools" - array of uncommon cooking tools/equipment they might not have (exclude basic items like spoons, bowls, stove)
2. "allergens" - array of potential allergens in this recipe

Example:
{
  "tools": ["stand mixer", "mandoline slicer", "candy thermometer"],
  "allergens": ["gluten", "dairy", "eggs", "nuts"]
}

Be practical - only list tools that are actually uncommon and allergens that are actually present.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    response_format: { type: "json_object" }
  });

  try {
    const result = JSON.parse(completion.choices[0].message.content);
    return {
      tools: result.tools || [],
      allergens: result.allergens || []
    };
  } catch (error) {
    console.error('Error parsing tools/allergens:', error);
    return { tools: [], allergens: [] };
  }
}

// Get high-resolution food image
async function getFoodImage(recipeName) {
  const searchQuery = `${recipeName} food photography high resolution`;
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(searchQuery)}&searchType=image&imgSize=large&imgType=photo&num=1`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.items?.[0]?.link || null;
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

export async function POST(request) {
  try {
    const { recipeName } = await request.json();
    
    if (!recipeName) {
      return Response.json({ error: 'Recipe name is required' }, { status: 400 });
    }

    // Step 1: Search YouTube for recipes
    const youtubeResults = await searchYouTube(recipeName);
    
    let selectedVideo = null;
    let transcript = null;
    
    // Step 2: Try to get transcript from each video
    for (const video of youtubeResults) {
      const videoTranscript = await getVideoTranscript(video.id.videoId);
      if (videoTranscript && videoTranscript.length > 0) {
        selectedVideo = video;
        transcript = videoTranscript;
        break;
      }
    }
    
    if (!selectedVideo || !transcript) {
      return Response.json({ 
        error: 'Unable to find any recipe videos with transcripts',
        success: false 
      }, { status: 404 });
    }

    // Step 3: Process with OpenAI
    const [steps, ingredients, toolsAndAllergens, foodImage] = await Promise.all([
      parseTranscriptToSteps(transcript, recipeName),
      extractIngredients(transcript, recipeName),
      getToolsAndAllergens(recipeName, []),
      getFoodImage(recipeName)
    ]);

    // Get tools and allergens with the actual ingredients
    const finalToolsAndAllergens = await getToolsAndAllergens(recipeName, ingredients);

    const response = {
      success: true,
      data: {
        name: recipeName,
        videoId: selectedVideo.id.videoId,
        videoTitle: selectedVideo.snippet.title,
        videoLink: `https://www.youtube.com/watch?v=${selectedVideo.id.videoId}`,
        image: foodImage,
        ingredients: ingredients,
        steps: steps.map((step, index) => ({
          ...step,
          id: index + 1,
          videoLink: `https://www.youtube.com/watch?v=${selectedVideo.id.videoId}&t=${step.timestamp}s`
        })),
        tools: finalToolsAndAllergens.tools,
        allergens: finalToolsAndAllergens.allergens
      }
    };

    return Response.json(response);
    
  } catch (error) {
    console.error('Recipe API error:', error);
    return Response.json({ 
      error: 'Internal server error',
      success: false 
    }, { status: 500 });
  }
}
