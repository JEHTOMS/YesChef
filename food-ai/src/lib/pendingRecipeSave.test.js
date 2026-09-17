import { queueRecipeSave, readPendingRecipeSave, clearPendingRecipeSave, consumePendingRecipeSave } from './pendingRecipeSave';

const recipeData = { recipe: { title: 'Pasta', steps: ['Cook'] } };
beforeEach(() => localStorage.clear());

test('persists the exact recipe and return page across a reload', () => {
    queueRecipeSave(recipeData, 'pasta query', 'My pasta', '/food-information');
    localStorage.setItem('yeschef_recipe_data', JSON.stringify({ title: 'Other recipe' }));
    expect(readPendingRecipeSave()).toMatchObject({ recipeData, originalQuery: 'pasta query', displayName: 'My pasta', returnPath: '/food-information' });
});

test('closing auth cancels the pending save', async () => {
    queueRecipeSave(recipeData, '', 'Pasta', '/food-overview');
    clearPendingRecipeSave();
    const save = jest.fn();
    await consumePendingRecipeSave(save);
    expect(save).not.toHaveBeenCalled();
});

test('repeated auth callbacks consume the save only once', async () => {
    queueRecipeSave(recipeData, '', 'Pasta', '/food-overview');
    const save = jest.fn().mockResolvedValue();
    await Promise.all([consumePendingRecipeSave(save), consumePendingRecipeSave(save)]);
    expect(save).toHaveBeenCalledTimes(1);
    expect(readPendingRecipeSave()).toBeNull();
});

test('expired or malformed pending saves are ignored', () => {
    localStorage.setItem('yeschef_pending_recipe_save', '{');
    expect(readPendingRecipeSave()).toBeNull();
    queueRecipeSave(recipeData, '', 'Pasta', '/food-overview');
    const now = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now + 86400001);
    expect(readPendingRecipeSave()).toBeNull();
    clock.mockRestore();
});

test('failed requests are not retried by later auth refreshes', async () => {
    queueRecipeSave(recipeData, '', 'Pasta', '/food-overview');
    const save = jest.fn().mockRejectedValue(new Error('offline'));
    await expect(consumePendingRecipeSave(save)).rejects.toThrow('offline');
    await consumePendingRecipeSave(save);
    expect(save).toHaveBeenCalledTimes(1);
});
