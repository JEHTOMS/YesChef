import React from 'react';
import { render, act } from '@testing-library/react';
import { RecipeProvider, useRecipe } from './RecipeContext';

jest.mock('../config.js', () => ({ API_ENDPOINTS: { RECIPE: '/api/recipe' } }));
let recipe;
function Consumer() { recipe = useRecipe(); return null; }
beforeEach(() => { localStorage.clear(); global.fetch = jest.fn(); jest.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { jest.restoreAllMocks(); delete global.fetch; });

test.each([
  'https://www.instagram.com/reel/C86ZvEaqRmo/',
  'https://www.instagram.com/reel/DXuzoaTkdds/?dlrf=ZGJuNTR6cHMxYnN5',
  'https://vm.tiktok.com/ZMexample/',
  'https://www.facebook.com/watch/?v=123456789',
  'https://fb.watch/example/',
  'https://x.com/chef/status/123456789',
  'https://www.snapchat.com/spotlight/example',
  'https://www.pinterest.com/pin/123456789/',
  'https://vimeo.com/123456789',
  'https://www.dailymotion.com/video/example',
  'https://youtu.be/abcdefghijk',
])('video link bypasses food validation and reaches the recipe endpoint: %s', async (url) => {
  const data = { recipe: { title: 'Pasta', servings: 2 } };
  // A URL classifier would reject this input; importing its content must still succeed.
  fetch.mockImplementation(async (_endpoint, options) => {
    const input = JSON.parse(options.body);
    return { ok: true, json: async () => input.validateOnly
      ? { success: true, validation: { isFood: false, confidence: 0.98 } }
      : { success: true, data } };
  });
  render(<RecipeProvider><Consumer /></RecipeProvider>);
  await act(async () => { await expect(recipe.searchRecipe(url)).resolves.toEqual(data); });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ videoInput: url, lang: 'en' });
  expect(recipe.error).toBeNull();
});

test('unrelated text is still rejected by food validation', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, validation: { isFood: false, confidence: 0.98 } }) });
  render(<RecipeProvider><Consumer /></RecipeProvider>);
  await act(async () => { await expect(recipe.searchRecipe('football results')).rejects.toThrow("doesn't appear to be food-related"); });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetch.mock.calls[0][1].body).validateOnly).toBe(true);
});

test('billing failure during validation stops before a second recipe request', async () => {
  const message = 'Recipe AI is unavailable because its usage allowance has been reached. Please contact support.';
  fetch.mockResolvedValue({ ok: false, json: async () => ({ success: false, error: message, code: 'ai_quota_exceeded' }) });
  render(<RecipeProvider><Consumer /></RecipeProvider>);
  await act(async () => { await expect(recipe.searchRecipe('Amala')).rejects.toThrow(message); });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(recipe.error).toBe(message);
  expect(recipe.loading).toBe(false);
});

test('ordinary server errors are no longer presented as too many requests', async () => {
  fetch.mockResolvedValue({ ok: false, json: async () => ({ success: false, error: 'Internal server error' }) });
  render(<RecipeProvider><Consumer /></RecipeProvider>);
  await act(async () => { await expect(recipe.searchRecipe('Amala')).rejects.toThrow('Could not create this recipe'); });
  expect(recipe.error).not.toMatch(/Too many requests/);
});
