const KEY = 'yeschef_pending_recipe_save';
const MAX_AGE = 24 * 60 * 60 * 1000;
const RETURN_PATHS = ['/food-overview', '/food-information', '/recipe'];

// Store the recipe itself: another tab may change the currently viewed recipe.
export function queueRecipeSave(recipeData, originalQuery, displayName, returnPath) {
    const pending = { recipeData, originalQuery, displayName, returnPath, createdAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(pending));
}

export function clearPendingRecipeSave() {
    localStorage.removeItem(KEY);
}

export function readPendingRecipeSave() {
    try {
        const pending = JSON.parse(localStorage.getItem(KEY));
        if (!pending) return null;
        const age = Date.now() - pending.createdAt;
        if (!(pending.recipeData?.recipe || pending.recipeData)?.title ||
            !RETURN_PATHS.includes(pending.returnPath) || !Number.isFinite(age) || age < 0 || age > MAX_AGE) {
            clearPendingRecipeSave();
            return null;
        }
        return pending;
    } catch {
        return null;
    }
}

// Web Locks serializes callbacks from the original tab and an email-link tab.
// Consume before making a request so auth refreshes cannot submit it again.
export async function consumePendingRecipeSave(save) {
    const consume = async () => {
        const pending = readPendingRecipeSave();
        if (!pending) return;
        clearPendingRecipeSave();
        await save(pending);
    };
    if (navigator.locks?.request) {
        return navigator.locks.request('yeschef-pending-recipe-save', consume);
    }
    return consume();
}
