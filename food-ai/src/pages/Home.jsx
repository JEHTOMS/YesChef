import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useRecipe } from '../context/RecipeContext';
import './Home.css';
import '../index.css';
import Navbar from "../components/Navbar";
import Input from "../components/Input";
import Footer from "../components/Footer";
import LoadingOverlay from "../components/LoadingOverlay";
import ErrorOverlay from "../components/ErrorOverlay";

function Home() {
    const navigate = useNavigate();
    const { recipeData, searchRecipe, loading, error, clearError, cancelRecipeExtraction } = useRecipe();
    const [query, setQuery] = useState('');

    // Redirect to food-overview if recipe data exists (from localStorage or previous session)
    useEffect(() => {
        if (recipeData && !loading && !error) {
            navigate("/food-overview");
        }
    }, [recipeData, loading, error, navigate]);

    // Reset scroll position when component mounts
    useEffect(() => {
        window.scrollTo(0, 0);
        // Also reset any scrollable containers
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    }, []);

    const handleVideoSubmit = (val) => {
        setQuery(val);
    };

    const handleExtractRecipe = async () => {
        if (!query.trim()) {
            return;
        }

        try {
            const result = await searchRecipe(query);
            // Only navigate if a recipe was actually returned (i.e., not cancelled)
            if (result) {
                navigate("/food-overview");
            }
        } catch (err) {
            // Error is handled by the context and ErrorOverlay will show
        }
    };

    return (
        <div className="page home-page">
            <Navbar></Navbar>
            <div className="main-content">
                 <div className="container layout-sm">
                    <div className="input-wrapper">
                                    <Input 
                onRecipeSubmit={handleVideoSubmit} 
                onSubmit={handleExtractRecipe}
                isLoading={loading}
            />
                        <p className="description text-sm">Create recipe from a text or YouTube link.</p>
                    </div>
                 </div>
            </div>
            
            <Footer 
                buttonType="primary"
                primaryButtonText="Create Recipe"
                onTap={handleExtractRecipe}
                disabled={!query.trim() || loading}
                showIcon={false}
            />
            
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

export default Home;