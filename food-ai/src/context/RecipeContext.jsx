import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { API_ENDPOINTS } from '../config.js';

const RecipeContext = createContext();

export const useRecipe = () => {
    const context = useContext(RecipeContext);
    if (!context) {
        throw new Error('useRecipe must be used within a RecipeProvider');
    }
    return context;
};

// LocalStorage keys for persistence
const STORAGE_KEYS = {
    RECIPE_DATA: 'yeschef_recipe_data',
    SUBTITLE_DATA: 'yeschef_subtitle_data', 
    ORIGINAL_QUERY: 'yeschef_original_query',
    CURRENT_SERVINGS: 'yeschef_current_servings'
};

// Helper functions for localStorage
const saveToStorage = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.warn('Failed to save to localStorage:', error);
    }
};

const loadFromStorage = (key) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.warn('Failed to load from localStorage:', error);
        return null;
    }
};

const removeFromStorage = (key) => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
    }
};

export const RecipeProvider = ({ children }) => {
    // Initialize state from localStorage if available
    const [recipeData, setRecipeData] = useState(() => loadFromStorage(STORAGE_KEYS.RECIPE_DATA));
    const [subtitleData, setSubtitleData] = useState(() => loadFromStorage(STORAGE_KEYS.SUBTITLE_DATA));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [originalQuery, setOriginalQuery] = useState(() => loadFromStorage(STORAGE_KEYS.ORIGINAL_QUERY) || '');
    const abortRef = useRef(null); // Holds current AbortController for cancellation
    
    // Serving size state management - restore from localStorage
    const [currentServings, setCurrentServings] = useState(() => loadFromStorage(STORAGE_KEYS.CURRENT_SERVINGS) || 1);

    // Persist recipe data to localStorage whenever it changes
    useEffect(() => {
        if (recipeData) {
            saveToStorage(STORAGE_KEYS.RECIPE_DATA, recipeData);
        } else {
            removeFromStorage(STORAGE_KEYS.RECIPE_DATA);
        }
    }, [recipeData]);

    // Persist subtitle data to localStorage whenever it changes
    useEffect(() => {
        if (subtitleData) {
            saveToStorage(STORAGE_KEYS.SUBTITLE_DATA, subtitleData);
        } else {
            removeFromStorage(STORAGE_KEYS.SUBTITLE_DATA);
        }
    }, [subtitleData]);

    // Persist original query to localStorage whenever it changes
    useEffect(() => {
        if (originalQuery) {
            saveToStorage(STORAGE_KEYS.ORIGINAL_QUERY, originalQuery);
        } else {
            removeFromStorage(STORAGE_KEYS.ORIGINAL_QUERY);
        }
    }, [originalQuery]);

    // Persist current servings to localStorage whenever it changes
    useEffect(() => {
        saveToStorage(STORAGE_KEYS.CURRENT_SERVINGS, currentServings);
    }, [currentServings]);
    
    // Calculate serving multiplier
    const getServingMultiplier = () => {
        const originalServings = recipeData?.recipe?.servings || 1;
        return currentServings / originalServings;
    };
    
    // Update current servings when recipe data changes
    const updateServingsForNewRecipe = (newRecipeData) => {
        if (newRecipeData?.recipe?.servings) {
            setCurrentServings(newRecipeData.recipe.servings);
        } else {
            setCurrentServings(1);
        }
    };

    // Validate if input is food-related using OpenAI
    const validateFoodInput = async (query, signal) => {
        // Skip validation for YouTube URLs as they're likely recipe videos
        if (isLikelyYoutube(query)) {
            return { isFood: true, confidence: 1.0 };
        }

        try {
            const response = await fetch(API_ENDPOINTS.RECIPE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    validateOnly: true, // Special flag for validation
                    recipeName: query,
                    lang: 'en'
                }),
                signal,
            });

            const result = await response.json();
            return result.validation || { isFood: false, confidence: 0 };
        } catch (err) {
            // If validation fails, assume it might be food to avoid blocking valid requests
            console.warn('Food validation failed:', err);
            return { isFood: true, confidence: 0.5 };
        }
    };

    const searchRecipe = async (query) => {
        // Abort any in-flight request before starting a new one
        if (abortRef.current) {
            try { abortRef.current.abort(); } catch (_) { /* noop */ }
        }
        const controller = new AbortController();
        abortRef.current = controller;
        setLoading(true);
        setError(null);
        setOriginalQuery(query);

        try {
            // First validate if input is food-related (skip for YouTube URLs)
            if (!isLikelyYoutube(query)) {
                const validation = await validateFoodInput(query, controller.signal);
                
                // High confidence threshold to avoid false positives
                if (!validation.isFood && validation.confidence > 0.8) {
                    throw new Error(`"${query}" doesn't appear to be food-related. Please try searching for a recipe, dish name, or cooking video.`);
                }
            }

            const response = await fetch(API_ENDPOINTS.RECIPE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...(isLikelyYoutube(query) ? { videoInput: query } : { recipeName: query }),
                    lang: 'en'
                }),
                signal: controller.signal,
            });

            const result = await response.json();

            if (result.success) {
                setRecipeData(result.data);
                updateServingsForNewRecipe(result.data);
                
                // Fetch subtitle data if videoId is available
                if (result.data?.videoId) {
                    try {
                        const subtitleResponse = await fetch(API_ENDPOINTS.CAPTIONS, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                videoInput: result.data.videoId,
                                lang: 'en'
                            }),
                            signal: controller.signal,
                        });
                        
                        const subtitleResult = await subtitleResponse.json();
                        if (subtitleResult.success) {
                            setSubtitleData(subtitleResult.data);
                        }
                    } catch (subtitleErr) {
                        // Don't fail the whole request if subtitles fail
                        console.warn('Failed to fetch subtitle data:', subtitleErr);
                    }
                }
                
                return result.data;
            }
            throw new Error(result.error || 'Failed to extract recipe from video');
        } catch (err) {
            if (err.name === 'AbortError') {
                // Silently handle cancellations
                return null;
            }
            console.error('Recipe extraction error:', err);
            setError(err.message);
            throw err;
        } finally {
            // Only clear loading if this controller is still the active one (avoid race)
            if (abortRef.current === controller) {
                abortRef.current = null;
                setLoading(false);
            }
        }
    };

    const cancelRecipeExtraction = () => {
        if (abortRef.current) {
            try { abortRef.current.abort(); } catch (_) { /* noop */ }
            abortRef.current = null;
        }
        setLoading(false);
        // Do not set an error; user intentionally cancelled
    };

    const isLikelyYoutube = (val) => {
        if (!val) return false;
        const trimmed = String(val).trim();
        const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/ |\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const id11 = /^[a-zA-Z0-9_-]{11}$/;
        return ytRegex.test(trimmed) || id11.test(trimmed);
    };

    const clearRecipe = () => {
        setRecipeData(null);
        setSubtitleData(null);
        setError(null);
        setOriginalQuery('');
        setCurrentServings(1); // Reset servings when clearing recipe
        
        // Clear localStorage when clearing recipe
        removeFromStorage(STORAGE_KEYS.RECIPE_DATA);
        removeFromStorage(STORAGE_KEYS.SUBTITLE_DATA);
        removeFromStorage(STORAGE_KEYS.ORIGINAL_QUERY);
        removeFromStorage(STORAGE_KEYS.CURRENT_SERVINGS);
    };

    // Calculate dynamic video duration from subtitle data
    const getVideoDuration = () => {
        if (!subtitleData?.subtitles || subtitleData.subtitles.length === 0) {
            return 1200; // Fallback to 20 minutes if no subtitle data
        }
        
        const lastSubtitle = subtitleData.subtitles[subtitleData.subtitles.length - 1];
        const startTime = parseFloat(lastSubtitle.start || 0);
        const duration = parseFloat(lastSubtitle.dur || 0);
        
        return Math.ceil(startTime + duration); // Round up to nearest second
    };    const clearError = () => {
        setError(null);
    };

    // Helper function to get the best display name for the recipe
    const getDisplayName = () => {
        if (!recipeData) return '';
        
        const isYouTubeInput = isLikelyYoutube(originalQuery);
        
        if (isYouTubeInput) {
            // For YouTube links, prioritize the recipe name extracted from the video content
            return recipeData.recipe?.title || 'Unknown Recipe';
        } else {
            // For text input, use the original query if it's more descriptive, fallback to recipe title
            const userInput = originalQuery.trim();
            const extractedTitle = recipeData.recipe?.title;
            
            // If user input is specific and reasonable length, prefer it
            if (userInput && userInput.length > 2 && userInput.length < 100) {
                return userInput;
            }
            
            return extractedTitle || userInput || 'Unknown Recipe';
        }
    };

    const value = {
        recipeData,
        subtitleData,
        loading,
        error,
        originalQuery,
        searchRecipe,
        cancelRecipeExtraction,
        clearRecipe,
        clearError,
        getDisplayName, // Export the smart name function
        getVideoDuration, // Export video duration calculation
        // Serving size management
        currentServings,
        setCurrentServings,
        getServingMultiplier,
    };

    return (
        <RecipeContext.Provider value={value}>
            {children}
        </RecipeContext.Provider>
    );
};

export default RecipeContext;
