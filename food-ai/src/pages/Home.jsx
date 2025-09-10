import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useRecipe } from '../context/RecipeContext';
import './Home.css';
import '../index.css';
import Navbar from "../components/Navbar";
import Input from "../components/Input";
import Button from "../components/Button";
import LoadingOverlay from "../components/LoadingOverlay";
import ErrorOverlay from "../components/ErrorOverlay";

function Home() {
    const navigate = useNavigate();
    const { searchRecipe, loading, error, clearError, cancelRecipeExtraction } = useRecipe();
    const [query, setQuery] = useState('');

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
                        <Input onRecipeSubmit={handleVideoSubmit} />
                        <p className="description text-sm">Create recipe from a link or text.</p>
                    </div>
                    <Button 
                        buttonText="Create Recipe"
                        onClick={handleExtractRecipe}
                        disabled={!query.trim() || loading}
                    />
                 </div>
            </div>
            
            {loading && (
                <LoadingOverlay 
                    primaryMessage="Extracting recipe..." 
                    secondaryMessage="Estimated time: 15 to 25 seconds"
                    onCancel={cancelRecipeExtraction}
                />
            )}
            {error && (
                <ErrorOverlay 
                    message={error}
                    onClose={clearError}
                />
            )}
        </div>
    );
}

export default Home;