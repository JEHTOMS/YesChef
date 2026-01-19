import React, { useState, useRef, useMemo, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useRecipe } from '../context/RecipeContext';
import { useSavedRecipes } from '../context/SavedRecipesContext';
import { useModal } from '../context/ModalContext';
import { useUser } from '../context/UserContext';
import { LocationService } from '../services/locationService';
import { supabase } from '../lib/supabase';
import './Home.css';
import '../index.css';
import NewNavbar from "../NewUI/NewNavbar";
import Modal from "../NewUI/Modal";
import '../pages/FoodInfo.css';
import Footer from "../components/Footer";
import Ingredients from "../components/Ingredients";
import Stores from "../components/Stores";
import Directions from "../components/Directions";
import Steps from "../components/Steps";

function FoodInformation() {
    const navigate = useNavigate();
    const { recipeData, subtitleData, getServingMultiplier, getDisplayName, getVideoDuration, originalQuery } = useRecipe();
    const { saveRecipe, unsaveRecipe, isRecipeSaved, getSavedRecipeId, session: savedRecipesSession } = useSavedRecipes();
    const { openUnsaveConfirmModal } = useModal();
    const { session, getProfileInitial, loading: userLoading } = useUser();
    const [activeTab, setActiveTab] = useState('ingredients');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('signup');
    const [authLoading, setAuthLoading] = useState(false);
    const [authMessage, setAuthMessage] = useState(null);
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

    // Check if current recipe is saved
    const recipeSaved = isRecipeSaved(recipeData);

    // Handle save recipe
    const handleSaveRecipe = async () => {
        if (!session) {
            openSignUpModal();
            return;
        }
        try {
            await saveRecipe(recipeData, originalQuery);
        } catch (err) {
            console.error('Error saving recipe:', err);
        }
    };

    // Handle unsave recipe
    const handleUnsaveRecipe = () => {
        const recipe = recipeData?.recipe || recipeData;
        const recipeId = getSavedRecipeId(recipeData);
        if (recipeId) {
            openUnsaveConfirmModal(
                recipe?.title || 'this recipe',
                recipeId,
                async (data) => {
                    try {
                        await unsaveRecipe(data.recipeId);
                    } catch (err) {
                        console.error('Error unsaving recipe:', err);
                    }
                }
            );
        }
    };

    // No need to fetch display name anymore - using UserContext

    // Modal handlers
    const openSignUpModal = () => {
        setModalType('signup');
        setAuthMessage('');
        setIsModalOpen(true);
    };

    const openSignInModal = () => {
        setModalType('signin');
        setAuthMessage(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setAuthMessage(null);
    };

    // Auth handler
    const handleAuth = async (email, isSignUp = false) => {
        setAuthLoading(true);
        setAuthMessage(null);
        
        const { error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                emailRedirectTo: `${window.location.origin}/`,
                shouldCreateUser: isSignUp,
            }
        });
        
        if (error) {
            if (error.message.includes('Signups not allowed')) {
                setAuthMessage(
                    <>No account found with this email. Please <span><button type="button" onClick={(e) => { e.preventDefault(); openSignUpModal(); }} style={{textDecoration:"underline", color: "#F04DCC", background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit"}}>sign up</button></span> first.</>
                );
            } else {
                setAuthMessage(`Error: ${error.message}`);
            }
        } else {
            setAuthMessage('Check your email for the magic link!');
        }
        setAuthLoading(false);
    };

    // Modal content based on type
    const getModalConfig = () => {
        if (modalType === 'signup') {
            return {
                title: "Create account",
                subtitle: "Sign up to save your favourite recipes",
                content: (
                    <div style={{width: "100%"}}>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const email = e.target.email.value;
                            handleAuth(email, true);
                        }} className="form">
                            <div className="form-input">
                                <label className="input-label text-lg" htmlFor="email">Email address <p className="input-subtitle text-sm">We'll send you a link to sign in</p></label>
                                <input className="text-input text-lg" type="email" name="email" id="email" required disabled={authLoading} />
                            </div>

                            <div className="standalone-checkbox">
                                <input type="checkbox" id="email-updates" name="email-updates" />
                                <label className="input-label text-lg" htmlFor="email-updates">Send me email about updates</label>
                            </div>
                            {authMessage && (
                                <div className="validation-box">
                                   <p className="text-sm pri-color" style={{textAlign:"center"}}>{authMessage}</p> 
                                </div>
                            )}
                            <div className="form-footer" style={{alignItems: "center"}}>
                                <p className="footer-text">By continuing, you agree to our <span><a href="/terms-of-service" style={{textDecoration:"underline"}}>Terms of Service</a></span> and <span><a href="/privacy-policy" style={{textDecoration:"underline"}}>Privacy Policy</a></span>.</p>
                                <input className="pri-button text-lg" id="sign-up-button" type="submit" value={authLoading ? "Sending..." : "Sign up"} disabled={authLoading} />
                                <p className="text-lg">Already have an account? <span><button type="button" onClick={(e) => { e.preventDefault(); openSignInModal(); }} style={{textDecoration:"underline", color: "#F04DCC", background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit"}}>Sign In</button></span></p>
                            </div>
                         </form>
                    </div>
                )
            };
        } else {
            return {
                title: "Welcome back!",
                subtitle: "Sign in to access your saved recipes",
                content: (
                    <div style={{width: "100%"}}>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const email = e.target['signin-email'].value;
                            handleAuth(email, false);
                        }} className="form">
                            <div className="form-input">
                                <label className="input-label text-lg" htmlFor="signin-email">Email address <p className="input-subtitle text-sm">We'll send you a link to sign in</p></label>
                                <input className="text-input text-lg" type="email" name="signin-email" id="signin-email" required disabled={authLoading} />
                            </div>
                            {authMessage && (
                                <div className="validation-box">
                                   <p className="text-sm pri-color" style={{textAlign:"center"}}>{authMessage}</p> 
                                </div>
                            )}
                            <div className="form-footer" style={{alignItems: "center"}}>
                                <input className="pri-button text-lg" id="sign-in-button" type="submit" value={authLoading ? "Sending..." : "Sign in"} disabled={authLoading} />
                                <p className="text-lg">Don't have an account? <span><button type="button" onClick={(e) => { e.preventDefault(); openSignUpModal(); }} style={{textDecoration:"underline", color: "#F04DCC", background: "none", border: "none", cursor: "pointer", padding: 0, font: "inherit"}}>Sign up</button></span></p>
                            </div>
                         </form>
                    </div>
                )
            };
        }
    };

    // Redirect to home if no recipe data is available
    useEffect(() => {
        if (!recipeData) {
            navigate("/");
        }
    }, [recipeData, navigate]);

    // Reset scroll position when component mounts
    useEffect(() => {
        window.scrollTo(0, 0);
        // Also reset any scrollable containers
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    }, []);
    
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

                const totalSteps = apiSteps.length;
                const hasTranscript = subtitleData?.subtitles && subtitleData.subtitles.length > 0;
                const maxVideoTime = getVideoDuration(); // Dynamic video duration
                
                let estimatedSeconds;
                
                if (hasTranscript) {
                    // Use transcript-based timing when available
                    const baseOffset = 30; // Skip intro
                    const stepInterval = 90; // 1.5 minutes per step
                    
                    // Add 1 to stepIndex to align with video content timing
                    let adjustedIndex = stepIndex + 1;
                    estimatedSeconds = baseOffset + (adjustedIndex * stepInterval);
                } else {
                    // Fallback: Use percentage-based video scrubbing for videos without transcripts
                    const videoStartPercentage = 0.1; // Start at 10% to skip intro
                    const videoEndPercentage = 0.9; // End at 90% to avoid outro
                    const usableVideoRange = videoEndPercentage - videoStartPercentage;
                    
                    // Calculate step percentage within the usable range
                    const stepPercentage = totalSteps > 1 
                        ? (stepIndex / (totalSteps - 1)) * usableVideoRange + videoStartPercentage
                        : videoStartPercentage + (usableVideoRange / 2);
                    
                    estimatedSeconds = Math.round(maxVideoTime * stepPercentage);
                }
                
                // Ensure we don't exceed video duration
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
    // Handle both nested (recipeData.recipe) and flat (recipeData) structures
    const recipe = recipeData?.recipe || recipeData;
    const ingredients = useMemo(() => (
        recipeData ? transformIngredients(recipe?.ingredients || []) : []
    ), [recipeData, recipe]);
    const directions = recipeData ? transformDirections(recipe?.steps || []) : [];

    // Don't render anything if no recipe data (will redirect)
    if (!recipeData) {
        return null;
    }

    return (
        <div className="page food-info-page">
            <div className="header">
                <NewNavbar 
                    showBackButton={true}
                    showFoodName={true}
                    foodName={getDisplayName()}
                    showCreditsButton={!userLoading && !!session}
                    credits={0}
                    showProfileButton={!userLoading && !!session}
                    profileInitial={getProfileInitial()}
                    showAuthButtons={!userLoading && !session}
                    isRecipeSaved={recipeSaved}
                    onSaveRecipe={handleSaveRecipe}
                    onUnsaveRecipe={handleUnsaveRecipe}
                    onBackClick={() => navigate('/food-overview')}
                    onProfileClick={() => navigate('/menu')}
                    onSignIn={openSignInModal}
                    onSignUp={openSignUpModal}
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
                                <div className="ingredient-text"><h4 className="ingredient-heading">Get Ingredients</h4><p className="ingredient-subheading">Select the ingredients you have missing to view nearby store options or add to your list.</p></div>
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
                                    <g clip-path="url(#clip0_928_339)">
                                    <path d="M19.9375 9.875C19.9375 16.4375 11.5 22.0625 11.5 22.0625C11.5 22.0625 3.0625 16.4375 3.0625 9.875C3.0625 7.63724 3.95145 5.49112 5.53379 3.90879C7.11612 2.32645 9.26224 1.4375 11.5 1.4375C13.7378 1.4375 15.8839 2.32645 17.4662 3.90879C19.0486 5.49112 19.9375 7.63724 19.9375 9.875Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M11.5 12.6875C13.0533 12.6875 14.3125 11.4283 14.3125 9.875C14.3125 8.3217 13.0533 7.0625 11.5 7.0625C9.9467 7.0625 8.6875 8.3217 8.6875 9.875C8.6875 11.4283 9.9467 12.6875 11.5 12.6875Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </g>
                                    <defs>
                                    <clipPath id="clip0_928_339">
                                    <rect width="22.5" height="22.5" fill="white" transform="translate(0.25 0.5)"/>
                                    </clipPath>
                                    </defs>
                                    </svg>
                                    } 
                secondaryButtonIcon={<svg width="24" height="23" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5.4375 14.5625H4.5C4.00272 14.5625 3.52581 14.365 3.17417 14.0133C2.82254 13.6617 2.625 13.1848 2.625 12.6875V4.25C2.625 3.75272 2.82254 3.27581 3.17417 2.92417C3.52581 2.57254 4.00272 2.375 4.5 2.375H12.9375C13.4348 2.375 13.9117 2.57254 14.2633 2.92417C14.615 3.27581 14.8125 3.75272 14.8125 4.25V5.1875M11.0625 8.9375H19.5C20.5355 8.9375 21.375 9.77697 21.375 10.8125V19.25C21.375 20.2855 20.5355 21.125 19.5 21.125H11.0625C10.027 21.125 9.1875 20.2855 9.1875 19.25V10.8125C9.1875 9.77697 10.027 8.9375 11.0625 8.9375Z" stroke="#1E1E1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        } />
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
            <Modal 
                title={getModalConfig().title}
                subtitle={getModalConfig().subtitle}
                isOpen={isModalOpen}
                onClose={closeModal}
                content={getModalConfig().content}
            />
        </div>
    );
}

export default FoodInformation;