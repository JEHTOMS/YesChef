import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useRecipe } from '../context/RecipeContext';
import { useSavedRecipes } from '../context/SavedRecipesContext';
import { useModal } from '../context/ModalContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import '../index.css';
import './FoodO.css';
import NewNavbar from "../NewUI/NewNavbar";
import Modal from "../NewUI/Modal";
import FoodHero from "../components/FoodHero";
import FoodDetails from "../components/FoodDetails";
import ToNote from "../components/ToNote";
import Footer from "../components/Footer";

function FoodOverview() {
    const navigate = useNavigate();
    const { recipeData, getDisplayName, clearRecipe, originalQuery } = useRecipe();
    const { saveRecipe, unsaveRecipe, isRecipeSaved, getSavedRecipeId, session } = useSavedRecipes();
    const { openUnsaveConfirmModal } = useModal();
    const { getProfileInitial, loading: userLoading } = useUser();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('signup');
    const [authLoading, setAuthLoading] = useState(false);
    const [authMessage, setAuthMessage] = useState(null);
    const [saveError, setSaveError] = useState(null);

    // Check if current recipe is saved
    const recipeSaved = isRecipeSaved(recipeData);

    // Handle save recipe
    const handleSaveRecipe = async () => {
        if (!session) {
            // User not logged in, prompt to sign in
            openSignUpModal();
            return;
        }

        try {
            setSaveError(null);
            await saveRecipe(recipeData, originalQuery);
        } catch (err) {
            console.error('Error saving recipe:', err);
            if (err.message !== 'Recipe already saved') {
                setSaveError(err.message);
            }
        }
    };

    // Handle unsave recipe (opens confirmation modal)
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
            console.log('No recipeData, redirecting to home');
            navigate("/");
        } else {
            console.log('recipeData available:', recipeData);
        }
    }, [recipeData, navigate]);

    // Reset scroll position when component mounts
    useEffect(() => {
        window.scrollTo(0, 0);
        // Also reset any scrollable containers
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    }, []);

    const startCooking = () => {
        navigate("/food-information");
    };

    // Handle both nested and flat recipe data structures
    // New format: recipeData.recipe.{fields}
    // Old/flat format: recipeData.{fields}
    const recipe = recipeData?.recipe || recipeData;
    
    // Debug: log all recipe fields to see what's available
    console.log('📋 Recipe fields:', recipe ? Object.keys(recipe) : 'none');
    console.log('📊 Full recipe data:', recipe);
    console.log('📝 Description:', recipe?.description);
    console.log('⏱️ CookTime:', recipe?.cookTime);
    console.log('👥 Servings:', recipe?.servings);
    console.log('🎥 VideoLink:', recipe?.videoLink);
    console.log('🎥 VideoId:', recipe?.videoId);
    console.log('🎥 OriginalUrl:', recipe?.originalUrl);

    // Don't render anything if no recipe data (will redirect)
    if (!recipeData) {
        return null;
    }

    return (
        <div className="page">
            <NewNavbar 
                showCloseButton={true}
                showCreditsButton={!userLoading && !!session}
                credits={0}
                showProfileButton={!userLoading && !!session}
                profileInitial={getProfileInitial()}
                showAuthButtons={!userLoading && !session}
                isRecipeSaved={recipeSaved}
                onSaveRecipe={handleSaveRecipe}
                onUnsaveRecipe={handleUnsaveRecipe}
                onCloseClick={() => {
                    // Clear recipe data from context and localStorage, then navigate home
                    clearRecipe();
                    navigate('/');
                }}
                onProfileClick={() => navigate('/menu')}
                onSignIn={openSignInModal}
                onSignUp={openSignUpModal}
            />
            <div className="main-content pd-240">
                <div className="container layout-sm">
                    <FoodHero 
                        image={recipe.image} 
                        name={getDisplayName()}
                        videolink={recipeData.videoLink || recipeData.originalUrl || (recipeData.videoId ? `https://www.youtube.com/watch?v=${recipeData.videoId}` : null)}
                        platform={recipeData.platform || 'YouTube'}
                    />
                    {/* Only show FoodDetails if we have at least description or timing data */}
                    {(recipe.description || recipe.cookTime || recipe.servings) && (
                        <FoodDetails 
                            description={recipe.description || recipe.summary || ''}
                            cookingTime={recipe.cookTime || recipe.cookingTime || recipe.totalTime || recipe.prepTime || ''}
                            servings={recipe.servings || recipe.serves || 0}
                            difficulty={recipe.difficulty || recipe.level || ''}
                            calories={recipe.calories || recipe.nutrition?.calories || ''}
                        />
                    )}
                    <ToNote 
                        tools={recipe.tools || []} 
                        allergens={recipe.allergens || []} 
                    />
                </div>
            </div>
            <Footer buttonType="primary" primaryButtonText="Start Cooking" onTap={startCooking} />
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

export default FoodOverview;
