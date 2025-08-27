import React, { useState } from "react";
import '../index.css';
import '../pages/Home.css';
import '../pages/FoodO.css';

function FoodDetails(props) {
    const [servings, setServings] = useState(props.servings || 1);

    const increaseServings = () => {
        setServings(prev => prev + 1);
    };

    const decreaseServings = () => {
        setServings(prev => prev > 1 ? prev - 1 : 1);
    };
    return (
        <div className="food-details">
                        <p className="food-description text-sm" id="food-description">{props.description}</p>
                        <div className="food-info-container">
                            <div className="food-info">
                                <p className="food-info-title text-sm">Cooking time</p>
                                <h3 className="cooking-details text-sm" ><span id="cooking-time">{props.cookingTime}</span> minutes</h3>
                            </div>
                            <div className="food-info">
                                <p className="food-info-title text-sm">Servings</p>
                                <h3 className="cooking-details text-sm"><span id="servings">{servings}</span> servings</h3>
                            </div>
                            <div className="food-info">
                                <p className="food-info-title text-sm">Calories</p>
                                <h3 className="cooking-details text-sm"><span id="calories">{props.calories}</span> kcal</h3>
                            </div>
                        </div>
                        <div className="servings-control">
                            <button className="servings-button icon-button" id="decrease-servings" onClick={decreaseServings}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6 13V11H18V13H6Z" fill="#1D1B20"/>
</svg>
</button>
                            <p className="servings-count text-lg">Cooking for <span id="servings-count">{servings}</span></p>
                            <button className="servings-button icon-button" id="increase-servings" onClick={increaseServings}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11 13H5V11H11V5H13V11H19V13H13V19H11V13Z" fill="#1D1B20"/>
</svg>
</button>
                        </div>
                     </div>
    );
}

export default FoodDetails;