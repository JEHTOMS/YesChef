import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

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
    const [loading, setLoading] = useState(true); // Start as true until first fetch completes
    const [error, setError] = useState(null);
    const [version, setVersion] = useState(0); // Version counter for auto-refresh
    const [session, setSession] = useState(null);
    const [initialAuthChecked, setInitialAuthChecked] = useState(false);

    // Listen for auth changes
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setInitialAuthChecked(true);
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

    // Save a recipe
    const saveRecipe = async (recipeData, originalQuery) => {
        if (!session?.user?.id) {
            throw new Error('Must be logged in to save recipes');
        }

        const recipe = recipeData?.recipe || recipeData;
        const videoId = recipeData?.videoId;
        const thumbnail = recipeData?.thumbnail;
        
        // Priority: social media thumbnail → YouTube thumbnail → Google image → null
        const thumbnailUrl = thumbnail || 
            (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null) || 
            recipe?.image || 
            null;

        const newRecipe = {
            user_id: session.user.id,
            recipe_title: recipe?.title || 'Untitled Recipe',
            recipe_image: thumbnailUrl,
            cook_time: recipe?.cookTime || null,
            servings: recipe?.servings || null,
            recipe_data: recipeData, // Store full recipe data for later retrieval
            video_id: videoId || null,
            original_url: originalQuery || null,
        };

        try {
            const { data, error: insertError } = await supabase
                .from('saved_recipes')
                .insert(newRecipe)
                .select()
                .single();

            if (insertError) {
                // Check for duplicate error
                if (insertError.code === '23505') {
                    throw new Error('Recipe already saved');
                }
                throw insertError;
            }

            // Increment version to trigger refresh
            setVersion(v => v + 1);
            return data;
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

        try {
            const { error: deleteError } = await supabase
                .from('saved_recipes')
                .delete()
                .eq('id', recipeId)
                .eq('user_id', session.user.id);

            if (deleteError) throw deleteError;

            // Increment version to trigger refresh
            setVersion(v => v + 1);
        } catch (err) {
            console.error('Error unsaving recipe:', err);
            throw err;
        }
    };

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
        initialAuthChecked,
        saveRecipe,
        unsaveRecipe,
        isRecipeSaved,
        getSavedRecipeId,
        refreshSavedRecipes,
    };

    return (
        <SavedRecipesContext.Provider value={value}>
            {children}
        </SavedRecipesContext.Provider>
    );
};

export default SavedRecipesContext;
