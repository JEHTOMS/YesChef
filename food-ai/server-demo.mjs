import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

console.log('🚀 Demo API server starting...');

app.post('/api/recipe', async (req, res) => {
  try {
    const { recipeName } = req.body || {};
    if (!recipeName) {
      return res.status(400).json({ success: false, error: 'Recipe name is required' });
    }

    console.log(`🍽️ Generating demo recipe for: ${recipeName}`);

    // Demo data tailored to the recipe name
    const isItalian = recipeName.toLowerCase().includes('pasta') || recipeName.toLowerCase().includes('carbonara') || recipeName.toLowerCase().includes('spaghetti');
    const isAsian = recipeName.toLowerCase().includes('rice') || recipeName.toLowerCase().includes('stir fry') || recipeName.toLowerCase().includes('noodle');
    
    const demoData = {
      name: recipeName,
      videoId: 'dQw4w9WgXcQ',
      videoTitle: `Perfect ${recipeName} Recipe - Easy & Delicious!`,
      videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      image: isItalian 
        ? 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop&auto=format'
        : isAsian
        ? 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop&auto=format'
        : 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop&auto=format',
      ingredients: isItalian ? [
        { name: 'Spaghetti pasta', quantity: '400g' },
        { name: 'Pancetta or bacon', quantity: '150g' },
        { name: 'Large eggs', quantity: '3' },
        { name: 'Parmesan cheese', quantity: '100g grated' },
        { name: 'Black pepper', quantity: 'freshly ground' },
        { name: 'Salt', quantity: 'to taste' }
      ] : isAsian ? [
        { name: 'Jasmine rice', quantity: '2 cups' },
        { name: 'Soy sauce', quantity: '3 tablespoons' },
        { name: 'Sesame oil', quantity: '1 tablespoon' },
        { name: 'Garlic', quantity: '3 cloves' },
        { name: 'Green onions', quantity: '2 stalks' },
        { name: 'Eggs', quantity: '2' }
      ] : [
        { name: 'Main ingredient', quantity: '500g' },
        { name: 'Onion', quantity: '1 medium' },
        { name: 'Garlic', quantity: '2 cloves' },
        { name: 'Olive oil', quantity: '2 tablespoons' },
        { name: 'Salt and pepper', quantity: 'to taste' }
      ],
      steps: isItalian ? [
        {
          id: 1,
          text: 'Bring a large pot of salted water to boil',
          heat: 'high',
          time: 5,
          timestamp: 30,
          videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s'
        },
        {
          id: 2,
          text: 'Cook spaghetti according to package instructions until al dente',
          heat: 'high',
          time: 10,
          timestamp: 90,
          videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=90s'
        },
        {
          id: 3,
          text: 'In a large pan, cook pancetta over medium heat until crispy',
          heat: 'medium',
          time: 5,
          timestamp: 150,
          videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=150s'
        },
        {
          id: 4,
          text: 'Whisk eggs with grated Parmesan and black pepper',
          heat: null,
          time: 2,
          timestamp: 210,
          videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=210s'
        },
        {
          id: 5,
          text: 'Drain pasta and immediately add to pan with pancetta',
          heat: 'low',
          time: 1,
          timestamp: 270,
          videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=270s'
        },
        {
          id: 6,
          text: 'Remove from heat and quickly stir in egg mixture',
          heat: null,
          time: 2,
          timestamp: 300,
          videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=300s'
        }
      ] : [
        {
          id: 1,
          text: 'Prepare all ingredients by washing and chopping as needed',
          heat: null,
          time: 5,
          timestamp: 30,
          videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s'
        },
        {
          id: 2,
          text: 'Heat oil in a large pan over medium-high heat',
          heat: 'medium',
          time: 2,
          timestamp: 90,
          videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=90s'
        },
        {
          id: 3,
          text: 'Add main ingredients and cook until golden',
          heat: 'medium',
          time: 8,
          timestamp: 150,
          videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=150s'
        },
        {
          id: 4,
          text: 'Season with salt and pepper to taste',
          heat: 'low',
          time: 1,
          timestamp: 210,
          videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=210s'
        },
        {
          id: 5,
          text: 'Serve immediately while hot',
          heat: null,
          time: null,
          timestamp: 240,
          videoLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=240s'
        }
      ],
      tools: isItalian ? ['Large pot', 'Colander', 'Cheese grater', 'Large pan'] : isAsian ? ['Rice cooker', 'Wok', 'Rice paddle'] : ['Sharp knife', 'Cutting board', 'Large pan'],
      allergens: isItalian ? ['Gluten', 'Eggs', 'Dairy'] : isAsian ? ['Soy', 'Sesame'] : ['None identified']
    };

    console.log('✅ Demo recipe generated successfully');
    
    // Add a small delay to simulate API processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.json({ success: true, data: demoData });
  } catch (err) {
    console.error('❌ Demo API error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Demo API server listening on http://localhost:${PORT}`);
});
