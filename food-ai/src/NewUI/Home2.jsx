import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useRecipe } from '../context/RecipeContext';
import { useUser } from '../context/UserContext';
import '../pages/Home.css';
import '../index.css';
import Input2 from "../NewUI/Input2.jsx";
import SavedRecipes from "../components/SavedRecipes.jsx"; 
import NewNavbar from "../NewUI/NewNavbar.jsx";
import Modal from "./Modal.jsx";
import LoadingOverlay from "../components/LoadingOverlay";
import ErrorOverlay from "../components/ErrorOverlay";

function Home2() {
    const navigate = useNavigate();
    const { recipeData, searchRecipe, loading, error, clearError, cancelRecipeExtraction } = useRecipe();
    const { session, displayName, getProfileInitial, loading: userLoading } = useUser();
    const [query, setQuery] = useState('');
    const [isCarouselMode, setIsCarouselMode] = useState(true);
    const [skipTransition, setSkipTransition] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('signup'); // 'signup' or 'signin'
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 640);
    const [authLoading, setAuthLoading] = useState(false);
    const [authMessage, setAuthMessage] = useState(null);
    const wrapperRef = useRef(null);
    const dragState = useRef({ active: false, startY: 0, baseHeight: 0, hasMoved: false });
    const [dragHeight, setDragHeight] = useState(null);
    const [dragProgress, setDragProgress] = useState(null); // 0 = collapsed, 1 = expanded

    const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

    // Check if user has completed profile setup
    const checkProfileAndRedirect = async (userId) => {
        const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', userId)
            .single();
        
        // If no profile or no display_name set, redirect to profile page
        if (!profile || !profile.display_name) {
            navigate('/profile');
        }
    };

    // Listen for auth state changes
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setIsModalOpen(false); // Close modal on successful login
                // Check if new user needs to complete profile
                if (_event === 'SIGNED_IN') {
                    checkProfileAndRedirect(session.user.id);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Redirect to food-overview if recipe data exists
    useEffect(() => {
        if (recipeData && !loading && !error) {
            navigate("/food-overview");
        }
    }, [recipeData, loading, error, navigate]);

    // Reset scroll position when component mounts
    useEffect(() => {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;

        // Expose sign-in trigger globally for SavedRecipes
        window.triggerSignIn = openSignInModal;

        return () => {
            delete window.triggerSignIn;
        };
    }, []);

    // Recipe input handler
    const handleVideoSubmit = (val) => {
        setQuery(val);
    };

    // Recipe extraction handler
    const handleExtractRecipe = async () => {
        if (!query.trim()) {
            return;
        }

        try {
            const result = await searchRecipe(query);
            if (result) {
                navigate("/food-overview");
            }
        } catch (err) {
            // Error is handled by the context and ErrorOverlay will show
        }
    };

    // Track viewport size changes
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 640;
            setIsMobile(mobile);
            // Reset drag state when viewport changes
            setDragHeight(null);
            setDragProgress(null);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
                shouldCreateUser: isSignUp, // Only create new users on sign up
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

    // Sign out handler
    const handleSignOut = async () => {
        await supabase.auth.signOut();
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
                                <input className="pri-button text-lg" id="sign-in-button" type="submit" value={authLoading ? "Sending..." : "Send Login link"} disabled={authLoading} />
                            </div>
                         </form>
                    </div>
                )
            };
        }
    };

    // Handler for button clicks - skip transition
    const handleCarouselModeChange = (newMode) => {
        setSkipTransition(true);
        setIsCarouselMode(newMode);
        // Reset skipTransition after a frame so future changes animate
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setSkipTransition(false);
            });
        });
    };

    const handleTouchStart = (e) => {
        if (!isMobile) return;
        // Allow drag from grabber or input-container (but not from textarea/button to allow normal interaction)
        const isGrabber = e.target.closest('.sheet-grabber');
        const isInputContainer = e.target.closest('.input-container');
        const isInteractive = e.target.closest('textarea, button, input');
        
        if (!isGrabber && (!isInputContainer || isInteractive)) return;
        
        e.preventDefault(); // Prevent pull-to-refresh and scroll
        const touchY = e.touches[0].clientY;
        const currentHeight = wrapperRef.current?.getBoundingClientRect().height || 0;
        dragState.current = { active: true, startY: touchY, baseHeight: currentHeight, hasMoved: false };
        setDragHeight(currentHeight);
    };

    const handleTouchMove = (e) => {
        if (!dragState.current.active) return;
        e.preventDefault(); // Prevent page scroll while dragging
        dragState.current.hasMoved = true;
        const currentY = e.touches[0].clientY;
        const delta = currentY - dragState.current.startY;
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
        const minHeight = 140; // reasonable collapsed height for input
        const maxHeight = viewportHeight - 120; // leave space for navbar
        // Drag down (positive delta) = decrease height (collapse)
        // Drag up (negative delta) = increase height (expand)
        const nextHeight = clamp(dragState.current.baseHeight - delta, minHeight, maxHeight);
        setDragHeight(nextHeight);
        
        // Calculate drag progress (0 = collapsed/minHeight, 1 = expanded/maxHeight)
        const progress = clamp((nextHeight - minHeight) / (maxHeight - minHeight), 0, 1);
        setDragProgress(progress);
    };

    const handleTouchEnd = () => {
        if (!dragState.current.active) return;
        
        // If no significant movement, treat as tap to toggle
        if (!dragState.current.hasMoved) {
            setIsCarouselMode(prev => !prev);
            setDragHeight(null);
            setDragProgress(null);
            dragState.current = { active: false, startY: 0, baseHeight: 0, hasMoved: false };
            return;
        }
        
        const threshold = 60;
        const baseHeight = dragState.current.baseHeight;
        const finalHeight = dragHeight ?? baseHeight;
        
        // Determine new mode based on drag
        let newMode = isCarouselMode; // default: keep current
        if (finalHeight >= baseHeight + threshold) {
            newMode = true; // carousel mode
        } else if (finalHeight <= baseHeight - threshold) {
            newMode = false; // list mode
        }
        
        // Set the final dragProgress to match the target state BEFORE clearing
        // This prevents flicker by ensuring search input stays in correct state
        setDragProgress(newMode ? 1 : 0);
        setIsCarouselMode(newMode);
        setDragHeight(null);
        
        // Clear dragProgress after a frame so the mode change takes effect first
        requestAnimationFrame(() => {
            setDragProgress(null);
        });
        
        dragState.current = { active: false, startY: 0, baseHeight: 0, hasMoved: false };
    };

    // Handle tap/click on grabber for desktop and as fallback
    const handleGrabberClick = () => {
        if (isMobile) return; // mobile uses touch events
        setIsCarouselMode(prev => !prev);
    };

    const inputWrapperStyle = (() => {
        // Desktop: original behavior based on carousel mode
        if (!isMobile) {
            if (isCarouselMode) {
                // Carousel mode on desktop: no absolute positioning, just full height
                return { 
                    height: '100%', 
                    transition: 'height 0.2s ease-out' 
                };
            }
            // Non-carousel mode on desktop: absolute at bottom
            return { 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                right: 0, 
                height: 'auto', 
                transition: 'height 0.2s ease-out' 
            };
        }
        
        // Mobile: sheet behavior with pointer-events pass-through
        const base = { 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0,
            pointerEvents: 'none' // Allow touch through to SavedRecipes underneath
        };

        if (dragHeight !== null) {
            return {
                ...base,
                height: `${dragHeight}px`,
                transition: 'none'
            };
        }

        // When not dragging, use appropriate height based on mode
        return {
            ...base,
            height: isCarouselMode ? '100%' : 'auto',
            transition: skipTransition ? 'none' : 'height 0.2s ease-out'
        };
    })();

    return (
        <div className="page home-page" style={{ paddingBottom: '0px' }}>
             <NewNavbar 
            showLogo
            showAuthButtons={!userLoading && !session?.user}
            showProfileButton={!userLoading && !!session?.user}
            profileInitial={getProfileInitial()}
            onLogoClick={() => navigate('/home2')}
            onSignUp={openSignUpModal}
            onSignIn={openSignInModal}
            onProfileClick={() => navigate('/menu')}
            />
            <div className="main-content" style={{ height: '100%', overflow: 'hidden' }}>
                 <div className="container layout-sm" style={{ height: '100%', maxHeight: '100svh', position: 'relative' }}>
                     <SavedRecipes onCarouselModeChange={handleCarouselModeChange} isCarouselMode={isCarouselMode} dragProgress={dragProgress} skipTransition={skipTransition} />
                    <div
                        ref={wrapperRef}
                        className="input-wrapper"
                        style={inputWrapperStyle}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <Input2 
                            onRecipeSubmit={handleVideoSubmit} 
                            onSubmit={handleExtractRecipe}
                            isLoading={loading}
                            isCarouselMode={isCarouselMode}
                            onGrabberClick={handleGrabberClick}
                        />

                        <Modal 
                        title={getModalConfig().title} 
                        subtitle={getModalConfig().subtitle}
                        isOpen={isModalOpen}
                        onClose={closeModal}
                        content={getModalConfig().content}
                        />
                    </div>
                </div>
            </div>
            
            {loading && (
                <LoadingOverlay 
                    primaryMessage="Extracting recipe..." 
                    secondaryMessage={error ? "Processing failed - rate limit possible" : "Estimated time: 15 to 25 seconds"}
                    onCancel={cancelRecipeExtraction}
                />
            )}
            {error && (
                <ErrorOverlay 
                    primaryMessage={error}
                    secondaryMessage={
                        error.includes("doesn't appear to be food-related") 
                            ? 'Try a dish, ingredient, cuisine, or paste a cooking video link.' 
                            : error.includes("Too many requests") || error.includes("try again later")
                                ? 'Please wait a few minutes before trying again.'
                                : 'Please try again or contact support if the issue persists.'
                    }
                    onClose={clearError}
                />
            )}
        </div>
    );
}

export default Home2;