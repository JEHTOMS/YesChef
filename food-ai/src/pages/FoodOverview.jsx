import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useRecipe } from '../context/RecipeContext';
import { useSavedRecipes } from '../context/SavedRecipesContext';
import { useModal } from '../context/ModalContext';
import { useUser } from '../context/UserContext';
import { useVoice } from '../context/VoiceContext';
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
    const { getProfileInitial, refreshProfile, isPro, loading: userLoading } = useUser();
    const { stopVoiceMode } = useVoice();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('signup');
    const [authLoading, setAuthLoading] = useState(false);
    const [authMessage, setAuthMessage] = useState(null);

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
            await saveRecipe(recipeData, originalQuery, getDisplayName());
            refreshProfile(); // Update credit balance
        } catch (err) {
            if (err.message === 'INSUFFICIENT_CREDITS') {
                navigate('/plans', { state: { from: '/food-overview' } });
                return;
            }
            console.error('Error saving recipe:', err);
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

        const emailRedirectTo = `${window.location.origin}${window.location.pathname}${window.location.search}`;
        
        const { error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                emailRedirectTo,
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

    const handleGoogleAuth = async () => {
        localStorage.setItem('yeschef_auth_return', '/food-overview');
        const redirectTo = `${window.location.origin}`;
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo }
        });
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
                                <div className="auth-divider"><span className="text-sm content-sec-color">or</span></div>
                                <button type="button" className="sec-button text-lg" onClick={handleGoogleAuth} style={{width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer"}}>
                                    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                                    Continue with Google
                                </button>
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
                                <div className="auth-divider"><span className="text-sm content-sec-color">or</span></div>
                                <button type="button" className="sec-button text-lg" onClick={handleGoogleAuth} style={{width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer"}}>
                                    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                                    Continue with Google
                                </button>
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
                credits={Math.max(1, Array.isArray(recipe?.steps) ? recipe.steps.length : 1)}
                isPro={isPro}
                showProfileButton={!userLoading && !!session}
                profileInitial={getProfileInitial()}
                showAuthButtons={!userLoading && !session}
                isRecipeSaved={recipeSaved}
                onSaveRecipe={handleSaveRecipe}
                onUnsaveRecipe={handleUnsaveRecipe}
                onCloseClick={() => {
                    // Stop voice mode if active, clear recipe data, then navigate home
                    stopVoiceMode();
                    clearRecipe();
                    navigate('/');
                }}
                onProfileClick={() => navigate('/menu', { state: { from: '/food-overview' } })}
                onSignIn={openSignInModal}
                onSignUp={openSignUpModal}
            />
            <div className="main-content pd-240">
                <div className="container layout-sm">
                    <FoodHero 
                        image={recipeData.thumbnail || (recipeData.videoId ? `https://img.youtube.com/vi/${recipeData.videoId}/hqdefault.jpg` : null) || recipe.image}
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
