import { act, renderHook } from '@testing-library/react';
import useRecipeSave from './useRecipeSave';
import { useUser } from '../context/UserContext';
import { useSavedRecipes } from '../context/SavedRecipesContext';
import { readPendingRecipeSave } from '../lib/pendingRecipeSave';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });
jest.mock('../context/UserContext', () => ({ useUser: jest.fn() }));
jest.mock('../context/SavedRecipesContext', () => ({ useSavedRecipes: jest.fn() }));
let user, saved, options;
beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    user = { session: null, refreshProfile: jest.fn() };
    saved = { saveRecipe: jest.fn().mockResolvedValue(), saving: false, showSnackbar: jest.fn() };
    options = { recipeData: { recipe: { title: 'Pasta' } }, originalQuery: 'pasta', displayName: 'Pasta', returnPath: '/food-overview', openSignIn: jest.fn() };
    useUser.mockImplementation(() => user);
    useSavedRecipes.mockImplementation(() => saved);
});

test('guest Save opens sign in and persists the recipe without a save request', async () => {
    const { result } = renderHook(() => useRecipeSave(options));
    await act(() => result.current.handleSaveRecipe());
    expect(options.openSignIn).toHaveBeenCalledTimes(1);
    expect(readPendingRecipeSave()).toMatchObject({ recipeData: options.recipeData, returnPath: '/food-overview' });
    expect(saved.saveRecipe).not.toHaveBeenCalled();
});

test('signed-in Save saves immediately and refreshes credits', async () => {
    user.session = { user: { id: 'user-1' } };
    const { result } = renderHook(() => useRecipeSave(options));
    await act(() => result.current.handleSaveRecipe());
    expect(saved.saveRecipe).toHaveBeenCalledWith(options.recipeData, 'pasta', 'Pasta');
    expect(user.refreshProfile).toHaveBeenCalledTimes(1);
    expect(options.openSignIn).not.toHaveBeenCalled();
});

test('save failure is visible and credit failure opens plans', async () => {
    user.session = { user: { id: 'user-1' } };
    saved.saveRecipe.mockRejectedValueOnce(new Error('offline')).mockRejectedValueOnce(new Error('INSUFFICIENT_CREDITS'));
    const { result } = renderHook(() => useRecipeSave(options));
    await act(() => result.current.handleSaveRecipe());
    expect(saved.showSnackbar).toHaveBeenCalledWith('Could not save recipe. Please try again.');
    await act(() => result.current.handleSaveRecipe());
    expect(mockNavigate).toHaveBeenCalledWith('/plans', { state: { from: '/food-overview' } });
});
