import React, { useState, useRef, useMemo, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useRecipe } from '../context/RecipeContext';
import { LocationService } from '../services/locationService';
import './Home.css';
import '../index.css';
import Navbar from "../components/Navbar";
import '../pages/FoodInfo.css';
import Footer from "../components/Footer";
import Ingredients from "../components/Ingredients";
import Stores from "../components/Stores";
import Directions from "../components/Directions";
import Steps from "../components/Steps";

function FoodInformation() {
    const navigate = useNavigate();
    const { recipeData, getServingMultiplier, getDisplayName, getVideoDuration } = useRecipe();
    const [activeTab, setActiveTab] = useState('ingredients');
    const [isStoresModalOpen, setIsStoresModalOpen] = useState(false);
    const [isModalClosing, setIsModalClosing] = useState(false);
    const [stores, setStores] = useState([]);
    const [storesLoading, setStoresLoading] = useState(false);
    const [storesError, setStoresError] = useState(null);
    const directionsRef = useRef(null);
    const ingredientsRef = useRef(null);
    const [activeDirectionIndex, setActiveDirectionIndex] = useState(0);
    const [allSelected, setAllSelected] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const toastTimerRef = useRef(null);

    // Redirect to home if no recipe data is available
    useEffect(() => {
        if (!recipeData) {
            navigate("/");
        }
    }, [recipeData, navigate]);
    
    // Get serving multiplier from context
    const servingMultiplier = getServingMultiplier();

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const openStoresModal = async () => {
        setIsStoresModalOpen(true);
        setIsModalClosing(false);
        setStoresLoading(true);
        setStoresError(null);
        
        try {
            // Get current ingredients state from the Ingredients component
            let currentIngredients = [];
            if (ingredientsRef.current && ingredientsRef.current.getCurrentIngredients) {
                currentIngredients = ingredientsRef.current.getCurrentIngredients();
            } else {
                // Fallback to transforming from recipe data
                currentIngredients = transformIngredients(recipeData?.ingredients || []);
            }
            
            const selectedIngredients = currentIngredients
                .filter(ingredient => ingredient.checked)
                .map(ingredient => ingredient.name);
            
            // If no ingredients selected, use all ingredients
            const ingredientsToSearch = selectedIngredients.length > 0 
                ? selectedIngredients 
                : currentIngredients.map(ingredient => ingredient.name);
            
            console.log('🛍️ Searching for stores with ingredients:', ingredientsToSearch);
            
            // Find nearby stores
            const nearbyStores = await LocationService.findStores(ingredientsToSearch);
            setStores(nearbyStores);
            
        } catch (error) {
            console.error('Failed to find stores:', error);
            setStoresError(error.message);
            setStores([]);
        } finally {
            setStoresLoading(false);
        }
    };

    const closeStoresModal = () => {
        // Prevent multiple close animations
        if (isModalClosing) return;
        
        setIsModalClosing(true);
        // Wait for animation to complete before hiding modal
        setTimeout(() => {
            setIsStoresModalOpen(false);
            setIsModalClosing(false);
        }, 150);
    };

    const handleOverlayClick = (e) => {
        // Check if clicked element is the overlay itself (not its children)
        if (e.target === e.currentTarget) {
            closeStoresModal();
        }
    };

    // Transform API ingredients data to match component expectations
    const transformIngredients = (apiIngredients) => {
        if (!Array.isArray(apiIngredients)) return [];
        
        return apiIngredients.map((ingredient, index) => {
            const amount = ingredient.amount || ingredient.quantity || "";
            
            // Parse quantity and unit from amount string
            const parseAmountString = (amountStr) => {
                if (!amountStr || typeof amountStr !== 'string') {
                    return { quantity: "", unit: "" };
                }
                
                // Try to extract number and unit (e.g., "2 cloves", "1 small can", "sufficient for 2 servings")
                const match = amountStr.match(/^(\d*\.?\d+)\s*(.*)$/) || 
                             amountStr.match(/^(.*?)\s+(.*)$/);
                
                if (match && match[1] && /^\d*\.?\d+$/.test(match[1].trim())) {
                    // First part is a number
                    return {
                        quantity: match[1].trim(),
                        unit: match[2].trim()
                    };
                } else {
                    // No clear numeric quantity, treat whole string as quantity
                    return {
                        quantity: amountStr,
                        unit: ""
                    };
                }
            };
            
            const { quantity, unit } = parseAmountString(amount);
            
            return {
                id: index + 1,
                name: ingredient.item || ingredient.name || ingredient,
                quantity: quantity,
                unit: unit,
                checked: false
            };
        });
    };

    // Transform API steps data to match component expectations  
    const transformDirections = (apiSteps) => {
        if (!Array.isArray(apiSteps)) return [];
        
        return apiSteps.map((step, index) => {
            // Generate video chapter link for each step
            const getStepVideoLink = (stepIndex) => {
                const videoId = recipeData?.videoId;
                if (!videoId) {
                    return null; // No video available
                }

                // Create YouTube link with estimated timestamp
                // Fix alignment: step content appears one position later in video
                const baseOffset = 30; // Skip intro
                const stepInterval = 90; // 1.5 minutes per step
                const maxVideoTime = getVideoDuration(); // Dynamic video duration
                
                // Add 1 to stepIndex to align with video content timing
                let adjustedIndex = stepIndex + 1;
                let estimatedSeconds = baseOffset + (adjustedIndex * stepInterval);
                estimatedSeconds = Math.min(estimatedSeconds, maxVideoTime);
                
                return `https://www.youtube.com/watch?v=${videoId}&t=${estimatedSeconds}s`;
            };

            return {
                id: index + 1,
                text: step.instruction || step.text || step,
                heat: step.temperature || step.heatLevel || "medium",
                time: step.time || step.estimatedTime || "05:00",
                ingredients: step.ingredients || [],
                videoLink: step.videoLink || getStepVideoLink(index)
            };
        });
    };

    // Use API data only - no fallback demo data
    const ingredients = useMemo(() => (
        recipeData ? transformIngredients(recipeData.recipe?.ingredients || []) : []
    ), [recipeData]);
    const directions = recipeData ? transformDirections(recipeData.recipe?.steps || []) : [];

    // Don't render anything if no recipe data (will redirect)
    if (!recipeData) {
        return null;
    }

    return (
        <div className="page food-info-page">
            <div className="header">
                <Navbar 
                    showBackButton={true} 
                    foodName={getDisplayName()} 
                />
                <div className="tab-bar">
                    <div className="segmented-controls" data-active={activeTab}>
                        <input 
                            id="ingredients" 
                            name="two" 
                            type="radio" 
                            checked={activeTab === 'ingredients'}
                            onChange={() => handleTabChange('ingredients')}
                        />
                        <label htmlFor="ingredients">Ingredients</label>
                        <input 
                            id="directions" 
                            name="two" 
                            type="radio" 
                            checked={activeTab === 'directions'}
                            onChange={() => handleTabChange('directions')}
                        />
                        <label htmlFor="directions">Directions</label>
                    </div>
                </div>
            </div>
            <div className="main-content with-segmented-controls">
                <div className="container layout-sm">
                    {activeTab === 'ingredients' ? (
                        <div className="ingredient-container">
                            <div className="ingredient-title">
                                <div className="ingredient-text"><h4 className="ingredient-heading">Get Ingredients</h4><p className="ingredient-subheading">Select the ingredients you don’t have to see nearby store options or copy them to your list.</p></div>
                                <button 
                                    className="ingredient-select-button" 
                                    id="select-all"
                                    onClick={() => {
                                        if (ingredientsRef.current && ingredientsRef.current.setAllChecked) {
                                            const next = !allSelected;
                                            ingredientsRef.current.setAllChecked(next);
                                            setAllSelected(next);
                                        }
                                    }}
                                >{allSelected ? 'Unselect all' : 'Select all'}</button>
                                </div>
                        <Ingredients 
                            ref={ingredientsRef}
                            ingredients={ingredients}
                            servingMultiplier={servingMultiplier}
                            onChange={(list) => {
                                // Update allSelected state when any change occurs
                                const everyChecked = list.length > 0 && list.every(i => i.checked);
                                setAllSelected(everyChecked);
                            }}
                        /></div>
                    ) : (
                        <Directions ref={directionsRef} steps={directions} onActiveChange={(i) => setActiveDirectionIndex(i)} />
                    )}
                </div>
            </div>
            {/* Footer: show the standard footer on Ingredients, and Steps as footer on Directions */}
            {activeTab === 'ingredients' && (
                <Footer showIcon={true} 
                primaryButtonText="Stores"
                secondaryButtonText="Copy"
                onTap={openStoresModal}
                onCancel={() => {
                    // Build copy text from current ingredients (checked or all if none checked)
                    let currentIngredients = [];
                    if (ingredientsRef.current && ingredientsRef.current.getCurrentIngredients) {
                        currentIngredients = ingredientsRef.current.getCurrentIngredients();
                    } else {
                        currentIngredients = ingredients; // fallback local variable
                    }
                    const selected = currentIngredients.filter(i => i.checked);
                    const source = selected.length ? selected : currentIngredients;
                    const lines = source.map(i => {
                        const qty = [i.quantity, i.unit].filter(Boolean).join(' ');
                        return qty ? `${i.name} - ${qty}` : i.name;
                    });
                    const text = lines.join('\n');
                    const performCopy = () => {
                        if (navigator?.clipboard?.writeText) {
                            return navigator.clipboard.writeText(text).catch(() => fallback());
                        } else {
                            return fallback();
                        }
                    };
                    const fallback = () => {
                        const ta = document.createElement('textarea');
                        ta.value = text; document.body.appendChild(ta); ta.select();
                        try { document.execCommand('copy'); } catch (e) {}
                        document.body.removeChild(ta);
                    };
                    performCopy().finally(() => {
                        // Show toast confirmation
                        setShowToast(true);
                        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                        toastTimerRef.current = setTimeout(() => setShowToast(false), 2500);
                    });
                }}
                primaryButtonIcon={<svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clip-path="url(#clip0_618_16806)">
                                    <path d="M19.9375 9.875C19.9375 16.4375 11.5 22.0625 11.5 22.0625C11.5 22.0625 3.0625 16.4375 3.0625 9.875C3.0625 7.63724 3.95145 5.49112 5.53379 3.90879C7.11612 2.32645 9.26224 1.4375 11.5 1.4375C13.7378 1.4375 15.8839 2.32645 17.4662 3.90879C19.0486 5.49112 19.9375 7.63724 19.9375 9.875Z" stroke="white" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M11.5 12.6875C13.0533 12.6875 14.3125 11.4283 14.3125 9.875C14.3125 8.3217 13.0533 7.0625 11.5 7.0625C9.9467 7.0625 8.6875 8.3217 8.6875 9.875C8.6875 11.4283 9.9467 12.6875 11.5 12.6875Z" stroke="white" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
                                    </g>
                                    <defs>
                                    <clipPath id="clip0_618_16806">
                                    <rect width="22.5" height="22.5" fill="white" transform="translate(0.25 0.5)"/>
                                    </clipPath>
                                    </defs>
                                    </svg>} 
                secondaryButtonIcon={<svg width="24" height="23" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5.4375 14.5625H4.5C4.00272 14.5625 3.52581 14.365 3.17417 14.0133C2.82254 13.6617 2.625 13.1848 2.625 12.6875V4.25C2.625 3.75272 2.82254 3.27581 3.17417 2.92417C3.52581 2.57254 4.00272 2.375 4.5 2.375H12.9375C13.4348 2.375 13.9117 2.57254 14.2633 2.92417C14.615 3.27581 14.8125 3.75272 14.8125 4.25V5.1875M11.0625 8.9375H19.5C20.5355 8.9375 21.375 9.77697 21.375 10.8125V19.25C21.375 20.2855 20.5355 21.125 19.5 21.125H11.0625C10.027 21.125 9.1875 20.2855 9.1875 19.25V10.8125C9.1875 9.77697 10.027 8.9375 11.0625 8.9375Z" stroke="#1E1E1E" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>} />
            )}

            {activeTab === 'directions' && (
                <Steps steps={directions} activeStep={activeDirectionIndex} onStepClick={(i) => {
                    if (directionsRef.current && typeof directionsRef.current.goToStep === 'function') {
                        directionsRef.current.goToStep(i);
                    } else {
                        const target = document.getElementById(`step-${i + 1}`);
                        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }} />
            )}

            {/* Stores Modal */}
            {isStoresModalOpen && (
                <div 
                    className={`modal-overlay ${isModalClosing ? 'closing' : ''}`} 
                    onClick={handleOverlayClick}
                >
                    <Stores 
                        onClose={closeStoresModal}
                        stores={stores}
                        loading={storesLoading}
                        error={storesError}
                    />
                </div>
            )}
            {showToast && (
                <div className="bottom-toast" role="status" aria-live="polite">
                    Ingredients copied
                </div>
            )}
        </div>
    );
}

export default FoodInformation;