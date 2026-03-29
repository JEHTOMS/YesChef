import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import '../pages/Home.css';
import '../index.css';
import '../components/SavedRecipes.css';
import NewNavbar from "./NewNavbar.jsx";
import { useSavedRecipes } from '../context/SavedRecipesContext';
import { useModal } from '../context/ModalContext';
import { useRecipe } from '../context/RecipeContext';
import { EmptyStateNoRecipes } from './EmptyStates';

function SavedRecipesPage() {
    const navigate = useNavigate();
    const { savedRecipes, session, unsaveRecipe, loading } = useSavedRecipes();
    const { openUnsaveConfirmModal } = useModal();
    const { setRecipeFromSaved } = useRecipe();

    const [searchValue, setSearchValue] = useState('');
    const [failedImages, setFailedImages] = useState(new Set());

    const handleImageError = (recipeId) => {
        setFailedImages(prev => new Set(prev).add(recipeId));
    };

    const handleClear = () => {
        setSearchValue('');
    };

    const handleUnsave = (recipe, e) => {
        e.stopPropagation();
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
        if (recipe.recipe_data) {
            setRecipeFromSaved(recipe.recipe_data, recipe.original_url);
            navigate('/recipe');
        }
    };

    const getRecipeImage = (recipe) => {
        if (recipe.recipe_image) return recipe.recipe_image;
        return '/recipe-fallback.svg';
    };

    const formatCookTime = (cookTime) => {
        if (!cookTime) return '';
        const numbers = cookTime.match(/\d+/g);
        if (!numbers || numbers.length === 0) return cookTime;
        const minutes = parseInt(numbers[0], 10);
        return `${minutes} min. cook time`;
    };

    const filteredRecipes = savedRecipes.filter(recipe =>
        recipe.recipe_title.toLowerCase().includes(searchValue.toLowerCase())
    );

    // Not logged in
    if (!session) {
        navigate('/');
        return null;
    }

    return (
        <div className="page">
            <NewNavbar
                showBackButton
                onBackClick={() => navigate(-1)}
                onLogoClick={() => navigate('/')}
            />
            <div className="main-content">
                <div className="container layout-sm">
                    <div className="page-title text-title">Saved Recipes</div>

                    {/* Search */}
                    <div className="search-input-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" className="search-icon">
                            <path d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <input
                            className="search-input text-lg"
                            type="text"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Search saved recipes"
                            aria-label="Search your saved recipes"
                        />
                        {searchValue && (
                            <button className="clear-button" onClick={handleClear} aria-label="Clear search">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="20" height="20" rx="10" fill="#3A3A3A" fillOpacity="0.06"/>
                                    <path d="M13.636 6.36328L6.36328 13.636M6.36328 6.36328L13.636 13.636" stroke="#1E1E1E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Loading */}
                    {loading && savedRecipes.length === 0 && (
                        <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center', width: '100%' }}>
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
                    )}

                    {/* Empty state */}
                    {!loading && savedRecipes.length === 0 && (
                        <EmptyStateNoRecipes />
                    )}

                    {/* Recipe list */}
                    {savedRecipes.length > 0 && (
                        <div className="sv-recipes-list">
                            {filteredRecipes.length === 0 ? (
                                <p className="text-sm" style={{ color: '#666666', padding: '16px 0' }}>
                                    No recipe with that name
                                </p>
                            ) : (
                                <ul className="recipe-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '80px' }}>
                                    {filteredRecipes.map((recipe) => (
                                        <li
                                            key={recipe.id}
                                            className="sv-recipe-item clickable"
                                            onClick={() => handleRecipeClick(recipe)}
                                        >
                                            <img
                                                src={failedImages.has(recipe.id) ? '/recipe-fallback.svg' : getRecipeImage(recipe)}
                                                alt={recipe.recipe_title}
                                                className="sv-recipe-image"
                                                loading="eager"
                                                onError={() => handleImageError(recipe.id)}
                                            />
                                            <div className="sv-recipe-info">
                                                <h3 className="text-lg sv-recipe-name">{recipe.recipe_title}</h3>
                                                <p className="text-sm sv-recipe-details">{formatCookTime(recipe.cook_time)}</p>
                                            </div>
                                            <button
                                                className="saved-icon"
                                                onClick={(e) => handleUnsave(recipe, e)}
                                                aria-label={`Unsave ${recipe.recipe_title}`}
                                            >
                                                <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M4.16541 18.5142C3.79004 18.7525 3.3136 18.4191 3.40904 17.9848L4.7142 12.0455C4.75255 11.871 4.69487 11.6893 4.5629 11.5688L0.163451 7.55389C-0.157548 7.26094 0.022227 6.72618 0.455 6.68664L6.22162 6.15972C6.40856 6.14263 6.57018 6.02229 6.64012 5.84809L8.86218 0.313834C9.03011 -0.104434 9.62223 -0.104435 9.79017 0.313833L12.0122 5.84809C12.0822 6.02229 12.2438 6.14263 12.4307 6.15972L18.1973 6.68664C18.6301 6.72618 18.8099 7.26094 18.4889 7.55389L14.0894 11.5688C13.9575 11.6893 13.8998 11.871 13.9381 12.0455L15.2433 17.9848C15.3387 18.4191 14.8623 18.7525 14.4869 18.5142L9.5942 15.4073C9.43061 15.3035 9.22173 15.3035 9.05815 15.4073L4.16541 18.5142Z" fill="#F04DCC"/>
                                                </svg>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SavedRecipesPage;
