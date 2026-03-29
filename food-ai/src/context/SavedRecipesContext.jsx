import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { API_ENDPOINTS } from '../config';

const SavedRecipesContext = createContext();

export const useSavedRecipes = () => {
    const context = useContext(SavedRecipesContext);
    if (!context) {
        throw new Error('useSavedRecipes must be used within a SavedRecipesProvider');
    }
    return context;
};

export const SavedRecipesProvider = ({ children }) => {
    const [savedRecipes, setSavedRecipes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [version, setVersion] = useState(0); // Version counter for auto-refresh
    const [session, setSession] = useState(null);

    // Snackbar state for undo after unsave
    const [snackbar, setSnackbar] = useState(null); // { message, undoData, buttonText, action }
    const snackbarTimerRef = useRef(null);

    const dismissSnackbar = useCallback(() => {
        if (snackbarTimerRef.current) {
            clearTimeout(snackbarTimerRef.current);
            snackbarTimerRef.current = null;
        }
        setSnackbar(null);
    }, []);

    const showSnackbar = useCallback((message, undoData, { buttonText, action } = {}) => {
        dismissSnackbar();
        setSnackbar({ message, undoData, buttonText, action });
        snackbarTimerRef.current = setTimeout(() => {
            setSnackbar(null);
            snackbarTimerRef.current = null;
        }, 4000);
    }, [dismissSnackbar]);

    // Listen for auth changes
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) {
                // Clear saved recipes when user logs out
                setSavedRecipes([]);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Fetch saved recipes when session changes or version increments
    const fetchSavedRecipes = useCallback(async () => {
        if (!session?.user?.id) {
            setSavedRecipes([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('saved_recipes')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setSavedRecipes(data || []);
        } catch (err) {
            console.error('Error fetching saved recipes:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id]);

    // Auto-fetch when session or version changes
    useEffect(() => {
        fetchSavedRecipes();
    }, [fetchSavedRecipes, version]);

    // Save a recipe via backend (handles credit deduction server-side)
    const saveRecipe = async (recipeData, originalQuery, displayName) => {
        if (!session?.user?.id) {
            throw new Error('Must be logged in to save recipes');
        }

        try {
            const response = await fetch(API_ENDPOINTS.RECIPE_SAVE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: session.user.id,
                    recipeData,
                    originalQuery,
                    displayName,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.needsUpgrade) {
                    const err = new Error('INSUFFICIENT_CREDITS');
                    err.creditsRequired = result.creditsRequired;
                    err.currentCredits = result.credits;
                    throw err;
                }
                if (result.error === 'Recipe already saved') {
                    throw new Error('Recipe already saved');
                }
                throw new Error(result.error || 'Failed to save recipe');
            }

            // Increment version to trigger refresh
            setVersion(v => v + 1);
            showSnackbar('Added to saved recipes', null, { buttonText: 'View all', action: 'viewSaved' });
            return result.recipe;
        } catch (err) {
            console.error('Error saving recipe:', err);
            throw err;
        }
    };

    // Unsave (delete) a recipe
    const unsaveRecipe = async (recipeId) => {
        if (!session?.user?.id) {
            throw new Error('Must be logged in to unsave recipes');
        }

        // Grab the full row before deleting so we can undo
        const deletedRecipe = savedRecipes.find(r => r.id === recipeId);

        try {
            const { error: deleteError } = await supabase
                .from('saved_recipes')
                .delete()
                .eq('id', recipeId)
                .eq('user_id', session.user.id);

            if (deleteError) throw deleteError;

            // Increment version to trigger refresh
            setVersion(v => v + 1);

            // Show snackbar with undo
            if (deletedRecipe) {
                showSnackbar('Recipe unsaved', deletedRecipe);
            }
        } catch (err) {
            console.error('Error unsaving recipe:', err);
            throw err;
        }
    };

    // Undo unsave — re-insert the deleted row
    const undoUnsave = useCallback(async () => {
        if (!snackbar?.undoData) return;
        const row = snackbar.undoData;
        dismissSnackbar();

        try {
            // Re-insert with the original columns (omit id so Supabase generates a new one)
            const { error: insertError } = await supabase
                .from('saved_recipes')
                .insert({
                    user_id: row.user_id,
                    recipe_title: row.recipe_title,
                    recipe_image: row.recipe_image,
                    cook_time: row.cook_time,
                    servings: row.servings,
                    recipe_data: row.recipe_data,
                    video_id: row.video_id,
                    original_url: row.original_url,
                });

            if (insertError) throw insertError;
            setVersion(v => v + 1);
        } catch (err) {
            console.error('Error undoing unsave:', err);
        }
    }, [snackbar, dismissSnackbar]);

    // Check if a recipe is already saved (by video_id or recipe_title)
    const isRecipeSaved = useCallback((recipeData) => {
        if (!recipeData || savedRecipes.length === 0) return false;

        const videoId = recipeData?.videoId;
        const recipe = recipeData?.recipe || recipeData;
        const title = recipe?.title;

        return savedRecipes.some(saved => {
            if (videoId && saved.video_id) {
                return saved.video_id === videoId;
            }
            return saved.recipe_title === title;
        });
    }, [savedRecipes]);

    // Get saved recipe ID for a given recipe (for unsave operations)
    const getSavedRecipeId = useCallback((recipeData) => {
        if (!recipeData || savedRecipes.length === 0) return null;

        const videoId = recipeData?.videoId;
        const recipe = recipeData?.recipe || recipeData;
        const title = recipe?.title;

        const found = savedRecipes.find(saved => {
            if (videoId && saved.video_id) {
                return saved.video_id === videoId;
            }
            return saved.recipe_title === title;
        });

        return found?.id || null;
    }, [savedRecipes]);

    // Refresh saved recipes manually
    const refreshSavedRecipes = () => {
        setVersion(v => v + 1);
    };

    const value = {
        savedRecipes,
        loading,
        error,
        session,
        saveRecipe,
        unsaveRecipe,
        isRecipeSaved,
        getSavedRecipeId,
        refreshSavedRecipes,
        snackbar,
        dismissSnackbar,
        undoUnsave,
    };

    return (
        <SavedRecipesContext.Provider value={value}>
            {children}
        </SavedRecipesContext.Provider>
    );
};

export default SavedRecipesContext;
