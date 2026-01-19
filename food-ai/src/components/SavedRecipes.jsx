import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import '../index.css';
import '../pages/Home.css';
import './SavedRecipes.css';
import { useSavedRecipes } from '../context/SavedRecipesContext';
import { useModal } from '../context/ModalContext';
import { useRecipe } from '../context/RecipeContext';
import { EmptyStateSignIn, EmptyStateNoRecipes } from '../NewUI/EmptyStates';

function SavedRecipes({ onCarouselModeChange, isCarouselMode: isCarouselModeProp, dragProgress, skipTransition }) {
    const navigate = useNavigate();
    const { savedRecipes, session, unsaveRecipe, loading, initialAuthChecked } = useSavedRecipes();
    const { openUnsaveConfirmModal } = useModal();
    const { setRecipeFromSaved } = useRecipe();
    
    const [searchValue, setSearchValue] = useState('');
    const [isCarouselMode, setIsCarouselMode] = useState(isCarouselModeProp || false);
    const [swiperInstance, setSwiperInstance] = useState(null);
    const [isBeginning, setIsBeginning] = useState(true);
    const [isEnd, setIsEnd] = useState(false);

    // Calculate blur and opacity based on drag progress or final state
    const getTransitionStyles = (forCarousel) => {
        // If dragging, use incremental values based on progress
        if (dragProgress !== null) {
            const blur = forCarousel 
                ? (1 - dragProgress) * 4  // Carousel: blur decreases as we expand (progress increases)
                : dragProgress * 4;        // List: blur increases as we expand
            const opacity = forCarousel
                ? dragProgress             // Carousel: opacity increases as we expand
                : 1 - dragProgress;        // List: opacity decreases as we expand
            return {
                filter: `blur(${blur}px)`,
                opacity: opacity,
                transition: 'none' // No transition during drag for instant response
            };
        }
        // Not dragging - use final state with transitions
        const isActive = forCarousel ? isCarouselMode : !isCarouselMode;
        return {
            filter: isActive ? 'blur(0px)' : 'blur(4px)',
            opacity: isActive ? 1 : 0,
            transition: skipTransition ? 'none' : 'filter 0.15s ease-out, opacity 0.15s ease-out, visibility 0.15s ease-out'
        };
    };

    // Calculate search input styles with incremental height/opacity/blur during drag
    const getSearchInputStyles = () => {
        const fullHeight = 48; // Fixed height of search input (with padding)
        const fullPaddingV = 14;
        const fullPaddingH = 16;
        const fullMargin = 16;
        
        if (dragProgress !== null) {
            // Clamp progress to 0-1 range to prevent flicker when dragging past snap point
            const clampedProgress = Math.min(Math.max(dragProgress, 0), 1);
            // Speed up search input transition - complete at 70% of drag progress
            // Scale progress so 0->0.8 maps to 0->1, and anything above 0.7 stays at 1
            const acceleratedProgress = Math.min(clampedProgress / 1, 1);
            // During drag: incremental reduction as we expand (progress increases toward carousel)
            const scale = 1 - acceleratedProgress;
            return {
                height: `${fullHeight * scale}px`,
                opacity: scale,
                overflow: 'hidden',
                marginBottom: `${fullMargin * scale}px`,
                padding: `${fullPaddingV * scale}px ${fullPaddingH * scale}px`,
                transition: 'none'
            };
        }
        
        // Not dragging - use final state
        if (isCarouselMode) {
            return {
                height: '0px',
                opacity: 0,
                overflow: 'hidden',
                marginBottom: '0px',
                padding: '0px',
                transition: skipTransition ? 'none' : 'height 0.15s ease-out, opacity 0.15s ease-out, margin-bottom 0.15s ease-out, padding 0.15s ease-out'
            };
        }
        return {
            height: `${fullHeight}px`,
            opacity: 1,
            overflow: 'visible',
            marginBottom: `${fullMargin}px`,
            padding: `${fullPaddingV}px ${fullPaddingH}px`,
            transition: skipTransition ? 'none' : 'height 0.15s ease-out, opacity 0.15s ease-out, margin-bottom 0.15s ease-out, padding 0.15s ease-out'
        };
    };

    useEffect(() => {
        setIsCarouselMode(!!isCarouselModeProp);
        // Clear search when switching to carousel mode (via drag or any parent change)
        if (isCarouselModeProp) {
            setSearchValue('');
        }
    }, [isCarouselModeProp]);

    const handleClear = () => {
        setSearchValue('');
    };
    
    const handleUnsave = (recipe, e) => {
        e.stopPropagation(); // Prevent navigation when clicking unsave
        openUnsaveConfirmModal(
            recipe.recipe_title, 
            recipe.id, 
            async (data) => {
                try {
                    await unsaveRecipe(data.recipeId);
                } catch (err) {
                    console.error('Failed to unsave recipe:', err);
                }
            }
        );
    };

    const handleRecipeClick = (recipe) => {
        // Load the saved recipe into context and navigate to recipe view
        if (recipe.recipe_data) {
            setRecipeFromSaved(recipe.recipe_data, recipe.original_url);
            navigate('/recipe');
        }
    };
    
    const toggleCarouselMode = () => {
        const newMode = !isCarouselMode;
        setIsCarouselMode(newMode);
        if (onCarouselModeChange) {
            onCarouselModeChange(newMode);
        }
        // Clear search when switching to carousel mode
        if (newMode) {
            setSearchValue('');
        }
    };
    
    // Filter recipes based on search value (only applies to expanded mode)
    const filteredRecipes = savedRecipes.filter(recipe => 
        recipe.recipe_title.toLowerCase().includes(searchValue.toLowerCase())
    );
    
    // Carousel always shows 3 most recent, expanded shows filtered results
    const displayedRecipes = isCarouselMode ? savedRecipes.slice(0, 3) : filteredRecipes;

    // Default placeholder image for recipes without thumbnails
    const getRecipeImage = (recipe) => {
        if (recipe.recipe_image) return recipe.recipe_image;
        // Return a default placeholder
        return '/default-recipe.jpg';
    };

    const formatCookTime = (cookTime) => {
        if (!cookTime) return '';
        
        // Extract numbers from the cook time string
        const numbers = cookTime.match(/\d+/g);
        if (!numbers || numbers.length === 0) return cookTime;
        
        // Take the first number found
        const minutes = parseInt(numbers[0], 10);
        
        // Return in the format "60 min. cook time"
        return `${minutes} min. cook time`;
    };

    // Show loading state while auth is being checked or recipes are loading
    if (!initialAuthChecked || (session && loading && savedRecipes.length === 0)) {
        return (
            <div className="sv-wrapper" style={{ height: 'auto', gap: "16px", display: 'flex', flexDirection: 'column' }}>
                <div className="sv-header-wrapper" style={{ flexShrink: 0 }}>
                    <div className="sv-header">
                        <h2 className="text-subtitle">Saved Recipes</h2>
                    </div>
                </div>
                <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="shimmer-container" style={{ width: '100%' }}>
                        <div className="shimmer-card" style={{ 
                            height: '200px', 
                            borderRadius: '12px', 
                            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.5s infinite'
                        }} />
                    </div>
                </div>
            </div>
        );
    }

    // Check if user is not logged in - show sign in empty state
    if (!session) {
        return (
            <div className="sv-wrapper" style={{ height: 'auto', gap: "0px", display: 'flex', flexDirection: 'column' }}>
                <EmptyStateSignIn onSignInClick={() => {
                    // Trigger sign-in from Home2 if available
                    if (window.triggerSignIn) {
                        window.triggerSignIn();
                    }
                }} />
            </div>
        );
    }

    // Check if user is logged in but has no saved recipes (after loading)
    if (session && savedRecipes.length === 0 && !loading) {
        return (
            <div className="sv-wrapper" style={{ height: 'auto', gap: "16px", display: 'flex', flexDirection: 'column' }}>
                <div className="sv-header-wrapper" style={{ flexShrink: 0 }}>
                    <div className="sv-header">
                        <h2 className="text-subtitle">Saved Recipes</h2>
                    </div>
                </div>
                <EmptyStateNoRecipes />
            </div>
        );
    }

    return (
        <div className="sv-wrapper" style={{ height: isCarouselMode ? 'auto' : '100%', gap: isCarouselMode ? 0 : '16px', display: 'flex', flexDirection: 'column', transition: 'height 0.2s ease-out, gap 0.2s ease-out' }}>
            <div className="sv-header-wrapper" style={{ flexShrink: 0 }}>
                <div className="sv-header">
                    <h2 className="text-subtitle">Saved Recipes</h2>
                    <button id="see-all" className="sm-button text-sm" onClick={toggleCarouselMode}>
                        {isCarouselMode ? 'See all' : 'See less'}
                    </button>
                </div>
                <div className="search-input-wrapper" style={getSearchInputStyles()}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" className="search-icon">
                        <path d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <input
                        className="search-input text-lg"
                        type="text"
                        id="recipes-search"
                        name="q"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder= "Search saved recipes"
                        aria-label="Search your saved recipes" />
                    {searchValue && (
                        <button 
                            className="clear-button" 
                            onClick={handleClear}
                            aria-label="Clear search">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="20" height="20" rx="10" fill="#3A3A3A" fillOpacity="0.06"/>
                                <path d="M13.636 6.36328L6.36328 13.636M6.36328 6.36328L13.636 13.636" stroke="#1E1E1E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    )}
                </div>
            </div>
                <div className="sv-recipes-list" style={{ flex: 1, overflowY: isCarouselMode ? 'visible' : 'auto', minHeight: 0, paddingBottom: isCarouselMode ? 0 : '320px', transition: 'padding-bottom 0.2s ease-out' }}>
                    {filteredRecipes.length === 0 ? (
                        <p className="text-md" style={{ color: '#666666' }}>
                            {searchValue ? `No recipe with that name` : 'No saved recipes to display.'}
                        </p>
                    ) : (
                        <>
                            {/* Carousel mode - Swiper */}
                            <div className="carousel-wrapper" style={{ 
                                ...getTransitionStyles(true),
                                visibility: (dragProgress !== null || isCarouselMode) ? 'visible' : 'hidden',
                                position: (dragProgress !== null || isCarouselMode) ? 'relative' : 'absolute',
                            }}>
                                <Swiper
                                    modules={[Navigation]}
                                    slidesPerView="auto"
                                    spaceBetween={16}
                                    onSwiper={(swiper) => {
                                        setSwiperInstance(swiper);
                                        setIsBeginning(swiper.isBeginning);
                                        setIsEnd(swiper.isEnd);
                                    }}
                                    onSlideChange={(swiper) => {
                                        setIsBeginning(swiper.isBeginning);
                                        setIsEnd(swiper.isEnd);
                                    }}
                                    className="recipes-swiper"
                                >
                                    {savedRecipes.slice(0, 3).map((recipe) => (
                                        <SwiperSlide key={`swiper-${recipe.id}`} className="swiper-recipe-slide">
                                            <div 
                                                className="sv-recipe-item clickable"
                                                onClick={() => handleRecipeClick(recipe)}
                                            >
                                                <img 
                                                    src={getRecipeImage(recipe)} 
                                                    alt={recipe.recipe_title} 
                                                    className="sv-recipe-image" 
                                                    loading="eager"
                                                    onError={(e) => { e.target.src = '/default-recipe.jpg'; }}
                                                />
                                                <div className="sv-recipe-info">
                                                    <h3 className="text-lg sv-recipe-name">{recipe.recipe_title}</h3>
                                                    <p className="text-sm sv-recipe-details">{formatCookTime(recipe.cook_time)}</p>
                                                </div>
                                                <button 
                                                    id={`saved-${recipe.id}`} 
                                                    className="saved-icon"
                                                    onClick={(e) => handleUnsave(recipe, e)}
                                                    aria-label={`Unsave ${recipe.recipe_title}`}>
                                                    <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M4.16541 18.5142C3.79004 18.7525 3.3136 18.4191 3.40904 17.9848L4.7142 12.0455C4.75255 11.871 4.69487 11.6893 4.5629 11.5688L0.163451 7.55389C-0.157548 7.26094 0.022227 6.72618 0.455 6.68664L6.22162 6.15972C6.40856 6.14263 6.57018 6.02229 6.64012 5.84809L8.86218 0.313834C9.03011 -0.104434 9.62223 -0.104435 9.79017 0.313833L12.0122 5.84809C12.0822 6.02229 12.2438 6.14263 12.4307 6.15972L18.1973 6.68664C18.6301 6.72618 18.8099 7.26094 18.4889 7.55389L14.0894 11.5688C13.9575 11.6893 13.8998 11.871 13.9381 12.0455L15.2433 17.9848C15.3387 18.4191 14.8623 18.7525 14.4869 18.5142L9.5942 15.4073C9.43061 15.3035 9.22173 15.3035 9.05815 15.4073L4.16541 18.5142Z" fill="#F04DCC"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                                <button 
                                    className={`swiper-nav-btn swiper-prev ${isBeginning ? 'swiper-button-disabled' : ''}`}
                                    onClick={() => swiperInstance?.slidePrev()}
                                    disabled={isBeginning}
                                    aria-label="Previous recipes">
                                    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(180deg)' }}>
                                        <rect width="41.5601" height="41.5601" rx="20.78" fill="#3A3A3A" fillOpacity="0.06"/>
                                        <path d="M17.7803 26.7803L23.7803 20.7803L17.7803 14.7803" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                                <button 
                                    className={`swiper-nav-btn swiper-next ${isEnd ? 'swiper-button-disabled' : ''}`}
                                    onClick={() => swiperInstance?.slideNext()}
                                    disabled={isEnd}
                                    aria-label="Next recipes">
                                    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect width="41.5601" height="41.5601" rx="20.78" fill="#3A3A3A" fillOpacity="0.06"/>
                                        <path d="M17.7803 26.7803L23.7803 20.7803L17.7803 14.7803" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                            
                            {/* List mode - regular list */}
                            <ul className="recipe-list" style={{ 
                                display: 'flex',
                                ...getTransitionStyles(false),
                                visibility: (dragProgress !== null || !isCarouselMode) ? 'visible' : 'hidden',
                                position: (dragProgress !== null || !isCarouselMode) ? 'relative' : 'absolute',
                            }}>
                                {displayedRecipes.map((recipe) => (
                                    <li 
                                        key={`list-${recipe.id}`} 
                                        className="sv-recipe-item clickable"
                                        onClick={() => handleRecipeClick(recipe)}
                                    >
                                        <img 
                                            src={getRecipeImage(recipe)} 
                                            alt={recipe.recipe_title} 
                                            className="sv-recipe-image" 
                                            loading="eager"
                                            onError={(e) => { e.target.src = '/default-recipe.jpg'; }}
                                        />
                                        <div className="sv-recipe-info">
                                            <h3 className="text-lg sv-recipe-name">{recipe.recipe_title}</h3>
                                            <p className="text-sm sv-recipe-details">{formatCookTime(recipe.cook_time)}</p>
                                        </div>
                                        <button 
                                            id={`saved-${recipe.id}`} 
                                            className="saved-icon"
                                            onClick={(e) => handleUnsave(recipe, e)}
                                            aria-label={`Unsave ${recipe.recipe_title}`}>
                                            <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M4.16541 18.5142C3.79004 18.7525 3.3136 18.4191 3.40904 17.9848L4.7142 12.0455C4.75255 11.871 4.69487 11.6893 4.5629 11.5688L0.163451 7.55389C-0.157548 7.26094 0.022227 6.72618 0.455 6.68664L6.22162 6.15972C6.40856 6.14263 6.57018 6.02229 6.64012 5.84809L8.86218 0.313834C9.03011 -0.104434 9.62223 -0.104435 9.79017 0.313833L12.0122 5.84809C12.0822 6.02229 12.2438 6.14263 12.4307 6.15972L18.1973 6.68664C18.6301 6.72618 18.8099 7.26094 18.4889 7.55389L14.0894 11.5688C13.9575 11.6893 13.8998 11.871 13.9381 12.0455L15.2433 17.9848C15.3387 18.4191 14.8623 18.7525 14.4869 18.5142L9.5942 15.4073C9.43061 15.3035 9.22173 15.3035 9.05815 15.4073L4.16541 18.5142Z" fill="#F04DCC"/>
                                            </svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            </div>
    );
}

export default SavedRecipes;