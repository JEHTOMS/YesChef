import React from "react";
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

    const startCooking = () => {
        navigate("/food-information");
    };

    // Extract recipe data from context
    const recipe = recipeData?.recipe || null;

    return (
        <div className="page">
            <Navbar showCloseButton={true}/>
            <div className="main-content pd-240">
                 <div className="container layout-sm">
                     {recipe ? (
                         <>
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
                         </>
                     ) : (
                         <div className="no-recipe-message">
                             <p>No recipe data available. Please go back and search for a recipe.</p>
                         </div>
                     )}
                 </div>
            </div>
            <Footer buttonType="primary" primaryButtonText="Start Cooking" onTap={startCooking} />
        </div>
    );
}

export default FoodOverview;
