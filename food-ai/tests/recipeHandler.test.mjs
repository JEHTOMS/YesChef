import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

process.env.OPENAI_API_KEY = 'test-only';
process.env.VIDNAVIGATOR_API_KEY = 'test-only';
delete process.env.GOOGLE_API_KEY;
delete process.env.SUPABASE_URL;
let providerCalls = 0, aiCalls = 0, providerFailure = false, shortTranscript = false, lastLanguage;
const entries = new Map();
await mock.module('../src/recipeCacheStorage.js', { namedExports: { recipeCacheStorage: {
  read: async key => entries.get(key), write: async (key, entry) => entries.set(key, entry),
} } });
await mock.module('../src/captionsHandler.js', { namedExports: { captionsHandler: async () => assert.fail('unexpected YouTube request') } });
await mock.module('openai', { namedExports: { OpenAI: class {
  chat = { completions: { create: async ({ messages }) => {
    aiCalls++;
    const value = messages[0].content.includes('Analyze if the following input')
      ? { isFood: true, confidence: 1 }
      : { title: 'Pasta', servings: 2, ingredients: [{ item: 'pasta', amount: '200g' }], steps: [{ instruction: 'Boil pasta for 10 minutes.' }] };
    return { choices: [{ message: { content: JSON.stringify(value) } }] };
  } } };
} } });
await mock.module('vidnavigator', { namedExports: {
  VidNavigatorError: class extends Error {},
  VidNavigatorClient: class {
    async transcribeVideo({ language }) {
      providerCalls++;
      lastLanguage = language;
      if (providerFailure) { const error = new Error('internal vendor details'); error.status_code = 500; throw error; }
      return { video_info: { title: 'Pasta recipe', description: '' }, transcript: shortTranscript ? [] : [{ start: 0, end: 30, text: 'Boil 200 grams of pasta in a large pot of salted water for ten minutes. Drain the cooked pasta, stir in tomato sauce and serve hot with basil leaves.' }] };
    }
  },
} });
const { recipeHandler, clearRecipeCache } = await import('../src/recipeHandler.js');
const parse = response => JSON.parse(response.body);

test('full handler caches transcript results, survives memory clear and skips both providers', async () => {
  const input = { videoInput: 'https://x.com/chef/status/111?s=46', lang: 'fr' };
  assert.equal(parse(await recipeHandler(input)).success, true);
  assert.equal(lastLanguage, 'fr');
  const before = [providerCalls, aiCalls];
  clearRecipeCache();
  const cached = parse(await recipeHandler({ ...input, videoInput: 'https://twitter.com/chef/status/111' }));
  assert.equal(cached.cacheSource, 'persistent');
  assert.equal(cached.data.recipe.title, 'Pasta');
  assert.deepEqual([providerCalls, aiCalls], before);
});

test('existing title fallback successes also persist, and validation keeps its own response', async () => {
  shortTranscript = true;
  const input = { videoInput: 'https://x.com/chef/status/222' };
  assert.equal(parse(await recipeHandler(input)).success, true);
  clearRecipeCache();
  assert.equal(parse(await recipeHandler(input)).cacheSource, 'persistent');
  await recipeHandler({ recipeName: 'pasta' });
  const result = parse(await recipeHandler({ recipeName: 'pasta', validateOnly: true }));
  assert.equal(result.validation.isFood, true);
  assert.equal(result.data, undefined);
});

test('provider 500 returns friendly 503 after one retry; a later attempt can recover', async () => {
  providerFailure = true;
  const input = { videoInput: 'https://x.com/chef/status/333' };
  const before = providerCalls;
  const result = await recipeHandler(input);
  assert.equal(result.statusCode, 503);
  assert.match(parse(result).error, /temporarily unavailable/);
  assert.doesNotMatch(parse(result).error, /internal vendor details/);
  assert.equal(providerCalls - before, 2);
  providerFailure = false;
  assert.equal(parse(await recipeHandler(input)).success, true);
});
