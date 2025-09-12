import React, { useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useRecipe } from '../context/RecipeContext';
import '../index.css';
import './FoodO.css';
import Navbar from "../components/Navbar";
import FoodHero from "../components/FoodHero";
import FoodDetails from "../components/FoodDetails";
import ToNote from "../components/ToNote";
import Footer from "../components/Footer";

function FoodOverview() {
    const navigate = useNavigate();
    const { recipeData, getDisplayName } = useRecipe();

    // Redirect to home if no recipe data is available
    useEffect(() => {
        if (!recipeData) {
            navigate("/");
        }
    }, [recipeData, navigate]);

    const startCooking = () => {
        navigate("/food-information");
    };

    // Extract recipe data from context
    const recipe = recipeData?.recipe || null;

    // Don't render anything if no recipe data (will redirect)
    if (!recipeData) {
        return null;
    }

    return (
        <div>
            <Navbar showCloseButton={true}/>
            <div className="page">
                <div className="main-content pd-240">
                    <div className="container layout-sm">
                        <FoodHero 
                            image={recipe.image} 
                            name={getDisplayName()}
                            videolink={recipeData.videoId ? `https://www.youtube.com/watch?v=${recipeData.videoId}` : null} 
                        />
                        <FoodDetails 
                            description={recipe.description}
                            cookingTime={recipe.cookTime}
                            servings={recipe.servings}
                            difficulty={recipe.difficulty}
                            calories={recipe.calories}
                        />
                        <ToNote 
                            tools={recipe.tools || []} 
                            allergens={recipe.allergens || []} 
                        />
                    </div>
                </div>
                <Footer buttonType="primary" primaryButtonText="Start Cooking" onTap={startCooking} />
            </div>
        </div>
    );
}

export default FoodOverview;
