import { act, renderHook, waitFor } from '@testing-library/react';
import { SavedRecipesProvider, useSavedRecipes } from './SavedRecipesContext';

let mockRows = [];
jest.mock('../lib/supabase', () => ({ supabase: {
    auth: {
        getSession: () => Promise.resolve({ data: { session: { user: { id: 'user-1' } } } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
    from: () => ({ select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: mockRows }) }) }) }),
} }));

const recipe = { recipe: { title: 'Pasta' } };
const row = { id: 'saved-1', recipe_title: 'Pasta', recipe_data: recipe };
beforeEach(() => {
    mockRows = [];
    global.fetch = jest.fn();
});

test('rapid repeated saves make one request and show Saved only after success', async () => {
    let resolve;
    global.fetch.mockReturnValue(new Promise(done => { resolve = done; }));
    const { result } = renderHook(useSavedRecipes, { wrapper: SavedRecipesProvider });
    await waitFor(() => expect(result.current.ready).toBe(true));
    let first, second;
    act(() => {
        first = result.current.saveRecipe(recipe, 'pasta', 'Pasta');
        second = result.current.saveRecipe(recipe, 'pasta', 'Pasta');
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.current.saving).toBe(true);
    expect(result.current.isRecipeSaved(recipe)).toBe(false);
    mockRows = [row];
    await act(async () => {
        resolve({ ok: true, json: async () => ({ recipe: row }) });
        await Promise.all([first, second]);
    });
    expect(result.current.saving).toBe(false);
    expect(result.current.isRecipeSaved(recipe)).toBe(true);
    expect(result.current.snackbar.message).toBe('Added to saved recipes');
});

test('failed save remains unsaved and can be retried', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(useSavedRecipes, { wrapper: SavedRecipesProvider });
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(async () => {
        await expect(result.current.saveRecipe(recipe, 'pasta', 'Pasta')).rejects.toThrow('offline');
    });
    expect(result.current.saving).toBe(false);
    expect(result.current.isRecipeSaved(recipe)).toBe(false);
    expect(result.current.snackbar).toBeNull();
    mockRows = [row];
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ recipe: row }) });
    await act(() => result.current.saveRecipe(recipe, 'pasta', 'Pasta'));
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.current.isRecipeSaved(recipe)).toBe(true);
    log.mockRestore();
});

test('server duplicate response refreshes saved state without showing an error', async () => {
    const { result } = renderHook(useSavedRecipes, { wrapper: SavedRecipesProvider });
    await waitFor(() => expect(result.current.ready).toBe(true));
    mockRows = [row];
    global.fetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'Recipe already saved' }) });
    await act(() => result.current.saveRecipe(recipe, 'pasta', 'Pasta'));
    await waitFor(() => expect(result.current.isRecipeSaved(recipe)).toBe(true));
    expect(result.current.snackbar.message).toBe('Recipe already saved');
});
