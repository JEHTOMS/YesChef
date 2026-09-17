import { render, waitFor } from '@testing-library/react';
import PendingRecipeSave from './PendingRecipeSave';
import { useUser } from '../context/UserContext';
import { useRecipe } from '../context/RecipeContext';
import { useSavedRecipes } from '../context/SavedRecipesContext';
import { queueRecipeSave } from '../lib/pendingRecipeSave';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });
jest.mock('../context/UserContext', () => ({ useUser: jest.fn() }));
jest.mock('../context/RecipeContext', () => ({ useRecipe: jest.fn() }));
jest.mock('../context/SavedRecipesContext', () => ({ useSavedRecipes: jest.fn() }));

const recipe = { recipe: { title: 'Pasta', steps: ['Cook'] } };
let user, saved, restore;
beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    user = { session: { user: { id: 'user-1' } }, profileReady: true, refreshProfile: jest.fn().mockResolvedValue() };
    saved = { ready: true, saveRecipe: jest.fn().mockResolvedValue(), isRecipeSaved: jest.fn().mockReturnValue(false), showSnackbar: jest.fn() };
    restore = jest.fn();
    useUser.mockImplementation(() => user);
    useSavedRecipes.mockImplementation(() => saved);
    useRecipe.mockReturnValue({ setRecipeFromSaved: restore });
    queueRecipeSave(recipe, 'pasta', 'Pasta', '/food-information');
});

test('waits for authentication, the new profile and saved recipes before saving', async () => {
    user.session = null;
    const { rerender } = render(<PendingRecipeSave />);
    expect(saved.saveRecipe).not.toHaveBeenCalled();
    user.session = { user: { id: 'new-user' } };
    user.profileReady = false;
    rerender(<PendingRecipeSave />);
    expect(saved.saveRecipe).not.toHaveBeenCalled();
    user.profileReady = true;
    saved.ready = false;
    rerender(<PendingRecipeSave />);
    expect(saved.saveRecipe).not.toHaveBeenCalled();
    saved.ready = true;
    rerender(<PendingRecipeSave />);
    await waitFor(() => expect(saved.saveRecipe).toHaveBeenCalledWith(recipe, 'pasta', 'Pasta'));
    expect(restore).toHaveBeenCalledWith(recipe, 'pasta');
    expect(mockNavigate).toHaveBeenCalledWith('/food-information', { replace: true });
    await waitFor(() => expect(user.refreshProfile).toHaveBeenCalledTimes(1));
    user.session = { user: { id: 'new-user' } };
    rerender(<PendingRecipeSave />);
    expect(saved.saveRecipe).toHaveBeenCalledTimes(1);
});

test('an already saved recipe makes no save request', async () => {
    saved.isRecipeSaved.mockReturnValue(true);
    render(<PendingRecipeSave />);
    await waitFor(() => expect(saved.showSnackbar).toHaveBeenCalledWith('Recipe already saved', null, expect.any(Object)));
    expect(saved.saveRecipe).not.toHaveBeenCalled();
});

test('the current recipe retains its serving and caption state after signing in', async () => {
    useRecipe.mockReturnValue({ recipeData: recipe, originalQuery: 'pasta', setRecipeFromSaved: restore });
    render(<PendingRecipeSave />);
    await waitFor(() => expect(saved.saveRecipe).toHaveBeenCalledTimes(1));
    expect(restore).not.toHaveBeenCalled();
});

test('insufficient credits opens plans with the recipe return path', async () => {
    saved.saveRecipe.mockRejectedValue(new Error('INSUFFICIENT_CREDITS'));
    render(<PendingRecipeSave />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/plans', { state: { from: '/food-information' } }));
});

test('network failure tells the user to retry without claiming success', async () => {
    saved.saveRecipe.mockRejectedValue(new Error('offline'));
    render(<PendingRecipeSave />);
    await waitFor(() => expect(saved.showSnackbar).toHaveBeenCalledWith('Could not save recipe. Please try Save recipe again.'));
    expect(user.refreshProfile).not.toHaveBeenCalled();
});
