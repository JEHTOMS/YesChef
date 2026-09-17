import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useRecipe } from '../context/RecipeContext';
import { useSavedRecipes } from '../context/SavedRecipesContext';
import { consumePendingRecipeSave } from '../lib/pendingRecipeSave';

// Mounted above the routes so OAuth, email links and route changes share one flow.
export default function PendingRecipeSave() {
    const { session, profileReady, refreshProfile } = useUser();
    const { recipeData: currentRecipe, originalQuery: currentQuery, setRecipeFromSaved } = useRecipe();
    const { saveRecipe, isRecipeSaved, ready, showSnackbar } = useSavedRecipes();
    const navigate = useNavigate();

    useEffect(() => {
        if (!session || !profileReady || !ready) return;
        consumePendingRecipeSave(async (pending) => {
            const { recipeData, originalQuery, displayName, returnPath } = pending;
            // Preserve current servings and captions when the same recipe is still open.
            if (JSON.stringify(currentRecipe) !== JSON.stringify(recipeData) || currentQuery !== originalQuery) {
                setRecipeFromSaved(recipeData, originalQuery);
            }
            localStorage.removeItem('yeschef_auth_return');
            navigate(returnPath, { replace: true });
            try {
                if (!isRecipeSaved(recipeData)) {
                    await saveRecipe(recipeData, originalQuery, displayName);
                    await refreshProfile();
                } else {
                    showSnackbar('Recipe already saved', null, { buttonText: 'View all', action: 'viewSaved' });
                }
            } catch (error) {
                if (error.message === 'INSUFFICIENT_CREDITS') {
                    navigate('/plans', { state: { from: returnPath } });
                } else {
                    showSnackbar('Could not save recipe. Please try Save recipe again.');
                }
            }
        }).catch(() => showSnackbar('Could not resume saving. Please try Save recipe again.'));
    }, [session, profileReady, ready, saveRecipe, isRecipeSaved, refreshProfile, currentRecipe, currentQuery, setRecipeFromSaved, navigate, showSnackbar]);

    return null;
}
