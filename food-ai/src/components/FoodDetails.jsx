import React from "react";
import { useRecipe } from '../context/RecipeContext';
import '../index.css';
import '../pages/Home.css';
import '../pages/FoodO.css';

// Utility function to convert cooking time to minutes
const convertToMinutes = (timeString) => {
    if (!timeString) return 0;
    
    // Convert to string and normalize
    const timeStr = String(timeString).toLowerCase().trim();
    
    // If it's already a number, assume it's in minutes
    if (!isNaN(timeStr)) {
        return parseInt(timeStr);
    }
    
    let totalMinutes = 0;
    
    // Look for hours
    const hourMatch = timeStr.match(/(\d+(?:\.\d+)?)\s*h/);
    if (hourMatch) {
        totalMinutes += parseFloat(hourMatch[1]) * 60;
    }
    
    // Look for minutes
    const minuteMatch = timeStr.match(/(\d+(?:\.\d+)?)\s*m/);
    if (minuteMatch) {
        totalMinutes += parseFloat(minuteMatch[1]);
    }
    
    // If no matches, try to extract the first number as minutes
    if (totalMinutes === 0) {
        const numberMatch = timeStr.match(/(\d+(?:\.\d+)?)/);
        if (numberMatch) {
            totalMinutes = parseFloat(numberMatch[1]);
        }
    }
    
    return Math.round(totalMinutes) || 0;
};

function FoodDetails(props) {
    const { currentServings, setCurrentServings, recipeData } = useRecipe();
    
    // Get original servings from props or context
    const originalServings = props.servings || recipeData?.recipe?.servings || 1;
    
    // Parse numeric values from props
    const getNumericValue = (value, defaultValue = 0) => {
        if (value === undefined || value === null) return defaultValue;
        if (typeof value === 'number') return value;
        const match = String(value).match(/\d+/);
        return match ? parseInt(match[0]) : defaultValue;
    };
    
    // Convert cooking time to minutes
    const cookingTimeInMinutes = convertToMinutes(props.cookingTime);

    // Calculate calories based on current servings
    const calculateCalories = () => {
        const baseCalories = getNumericValue(props.calories, 0);
        const originalServingsNum = getNumericValue(originalServings, 1);
        
        if (baseCalories === 0) return 0;
        const caloriesPerOriginalServing = Math.round(baseCalories / originalServingsNum);
        return caloriesPerOriginalServing * currentServings;
    };

    const increaseServings = () => {
        setCurrentServings(prev => prev + 1);
    };

    const decreaseServings = () => {
        setCurrentServings(prev => prev > 1 ? prev - 1 : 1);
    };
    
    return (
        <div className="food-details">
            <p className="food-description text-sm" id="food-description">{props.description}</p>
            <div className="food-info-container">
                <div className="food-info">
                    <p className="food-info-title text-sm">Cooking time</p>
                    <h3 className="cooking-details text-sm" ><span id="cooking-time">{cookingTimeInMinutes}</span> minutes</h3>
                </div>
                <div className="food-info">
                    <p className="food-info-title text-sm">Servings</p>
                    <h3 className="cooking-details text-sm"><span id="servings">{currentServings}</span> servings</h3>
                </div>
                <div className="food-info">
                    <p className="food-info-title text-sm">Calories</p>
                    <h3 className="cooking-details text-sm"><span id="calories">{calculateCalories()}</span> kcal</h3>
                </div>
            </div>
            <div className="servings-control">
                <button className="servings-button icon-button" id="decrease-servings" onClick={decreaseServings}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 13V11H18V13H6Z" fill="#1D1B20"/>
                    </svg>
                </button>
                <p className="servings-count text-lg">Cooking for <span id="servings-count">{currentServings}</span></p>
                <button className="servings-button icon-button" id="increase-servings" onClick={increaseServings}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 13H5V11H11V5H13V11H19V13H13V19H11V13Z" fill="#1D1B20"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default FoodDetails;
