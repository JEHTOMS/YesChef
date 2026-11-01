import React from 'react';
import { render, act } from '@testing-library/react';
import { RecipeProvider, useRecipe } from './RecipeContext';

jest.mock('../config.js', () => ({ API_ENDPOINTS: { RECIPE: '/api/recipe' } }));
let recipe;
function Consumer() { recipe = useRecipe(); return null; }
beforeEach(() => { localStorage.clear(); global.fetch = jest.fn(); jest.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { jest.restoreAllMocks(); delete global.fetch; });

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
