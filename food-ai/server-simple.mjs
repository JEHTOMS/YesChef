import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 5001;

console.log('Environment check:');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set (starts with ' + process.env.OPENAI_API_KEY.substring(0, 10) + '...)' : 'Not set');

app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Mock function for YouTube search (temporary workaround)
async function mockYouTubeSearch(query) {
  console.log(`🎥 Mock YouTube search for: ${query}`);
  return [{
    id: { videoId: 'dQw4w9WgXcQ' },
    snippet: {
      title: `How to Make Perfect ${query} - Easy Recipe`,
      description: `Learn how to make delicious ${query} with this simple recipe.`
    }
  }];
}

// Mock function for transcript (temporary)
async function mockTranscript(videoId) {
  console.log(`📝 Mock transcript for video: ${videoId}`);
  return [
    { text: "Heat olive oil in a large pan over medium heat", start: 30, duration: 5 },
    { text: "Add minced garlic and cook for 1 minute until fragrant", start: 45, duration: 4 },
    { text: "Add the pasta and toss to combine", start: 120, duration: 3 },
    { text: "Season with salt and pepper to taste", start: 180, duration: 3 },
    { text: "Serve immediately while hot", start: 240, duration: 2 }
  ];
}

// Mock function for Google Images
async function mockFoodImage(recipeName) {
  console.log(`🖼️ Mock image search for: ${recipeName}`);
  return `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop&auto=format`;
}

app.post('/api/recipe', async (req, res) => {
  try {
    console.log('📨 Recipe request received');
    const { recipeName } = req.body || {};
    if (!recipeName) {
      return res.status(400).json({ success: false, error: 'Recipe name is required' });
    }

    console.log(`🔍 Searching for recipe: ${recipeName}`);

    // Use mock functions for now
    const youtubeResults = await mockYouTubeSearch(recipeName);
    const selectedVideo = youtubeResults[0];
    const transcript = await mockTranscript(selectedVideo.id.videoId);
    const image = await mockFoodImage(recipeName);

    // Generate content with OpenAI
    console.log('🤖 Generating recipe data with OpenAI...');
    
    const ingredientsPrompt = `Generate ingredients for a ${recipeName} recipe. Return JSON with an "ingredients" array containing objects with "name" and "quantity" fields.`;
    const stepsPrompt = `Generate cooking steps for a ${recipeName} recipe. Return JSON with a "steps" array containing objects with "text", "heat" (low/medium/high or null), "time" (minutes as number or null), and "timestamp" (seconds) fields.`;
    
    const [ingredientsRes, stepsRes] = await Promise.all([
      openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: ingredientsPrompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      }),
      openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: stepsPrompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    ]);

    const ingredients = JSON.parse(ingredientsRes.choices[0].message.content).ingredients || [];
    const steps = JSON.parse(stepsRes.choices[0].message.content).steps || [];

    // Mock tools and allergens
    const mockTools = recipeName.toLowerCase().includes('pasta') ? ['Large pot', 'Colander'] : ['Mixing bowl', 'Whisk'];
    const mockAllergens = recipeName.toLowerCase().includes('pasta') ? ['Gluten', 'Eggs'] : ['Dairy'];

    const data = {
      name: recipeName,
      videoId: selectedVideo.id.videoId,
      videoTitle: selectedVideo.snippet.title,
      videoLink: `https://www.youtube.com/watch?v=${selectedVideo.id.videoId}`,
      image,
      ingredients,
      steps: steps.map((step, i) => ({
        id: i + 1,
        text: step.text,
        heat: step.heat || null,
        time: step.time ?? null,
        timestamp: step.timestamp || 30 + i * 60,
        videoLink: `https://www.youtube.com/watch?v=${selectedVideo.id.videoId}&t=${step.timestamp || 30 + i * 60}s`
      })),
      tools: mockTools,
      allergens: mockAllergens
    };

    console.log('✅ Recipe data generated successfully');
    res.json({ success: true, data });
  } catch (err) {
    console.error('❌ Recipe API error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API server listening on http://localhost:${PORT}`);
});
