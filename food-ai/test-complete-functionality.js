#!/usr/bin/env node

// Complete functionality test for the Recipe AI system
// Tests both food name input and YouTube URL input

async function testAPI(payload, description) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`📤 Payload: ${JSON.stringify(payload)}`);
  
  try {
    const response = await fetch('http://localhost:5001/api/recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ SUCCESS: ${data.data.recipe.title}`);
      console.log(`📊 Steps: ${data.data.recipe.steps.length}`);
      console.log(`🥘 Ingredients: ${data.data.recipe.ingredients.length}`);
      console.log(`⏱️  Cook Time: ${data.data.recipe.cookTime}`);
      console.log(`🎯 Difficulty: ${data.data.recipe.difficulty}`);
      
      // Validate no demo content
      if (data.data.recipe.title.includes('Quick Recipe') || 
          data.data.recipe.title.includes('Simple Recipe')) {
        console.log(`⚠️  WARNING: Possible demo content detected`);
      }
    } else {
      console.log(`❌ FAILED: ${data.error}`);
    }
    
    return data.success;
  } catch (error) {
    console.log(`💥 ERROR: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Complete Functionality Tests');
  console.log('=' .repeat(50));

  const tests = [
    // Test 1: Food name input
    {
      payload: { recipeName: "pad thai" },
      description: "Food name input - Pad Thai"
    },
    
    // Test 2: YouTube URL input  
    {
      payload: { videoInput: "https://www.youtube.com/watch?v=bJUiWdM__Qw" },
      description: "YouTube URL input - Pasta Aglio e Olio"
    },
    
    // Test 3: Complex recipe
    {
      payload: { recipeName: "coq au vin" },
      description: "Complex French recipe"
    },
    
    // Test 4: Simple recipe
    {
      payload: { recipeName: "scrambled eggs" },
      description: "Simple breakfast recipe"
    }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    const result = await testAPI(test.payload, test.description);
    if (result) passed++;
    
    // Wait between tests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n' + '=' .repeat(50));
  console.log(`📈 RESULTS: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED - System is production ready!');
  } else {
    console.log('🔧 Some tests failed - Check logs above');
  }
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
}

runTests().catch(console.error);
