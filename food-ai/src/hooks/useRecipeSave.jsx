import { useNavigate } from 'react-router-dom';
import { useSavedRecipes } from '../context/SavedRecipesContext';
import { useUser } from '../context/UserContext';
import { queueRecipeSave } from '../lib/pendingRecipeSave';

export default function useRecipeSave({ recipeData, originalQuery, displayName, returnPath, openSignIn }) {
    const { session, refreshProfile } = useUser();
    const { saveRecipe, saving, showSnackbar } = useSavedRecipes();
    const navigate = useNavigate();

    const handleSaveRecipe = async () => {
        if (!session) {
            try {
                queueRecipeSave(recipeData, originalQuery, displayName, returnPath);
                openSignIn();
            } catch {
                showSnackbar('Could not remember this recipe. Enable browser storage and try again.');
            }
            return;
        }
        try {
            await saveRecipe(recipeData, originalQuery, displayName);
            await refreshProfile();
        } catch (error) {
            if (error.message === 'INSUFFICIENT_CREDITS') {
                navigate('/plans', { state: { from: returnPath } });
            } else {
                showSnackbar('Could not save recipe. Please try again.');
            }
        }
    };

    return { handleSaveRecipe, saving };
}
