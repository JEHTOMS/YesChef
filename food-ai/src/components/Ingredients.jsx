import React, { useState } from "react";
import '../index.css';
import '../pages/Home.css';
import '../pages/FoodInfo.css';

function Ingredients({ ingredients: initialIngredients }) {
    const [ingredients, setIngredients] = useState(initialIngredients || []);

    const handleCheckboxChange = (id) => {
        setIngredients((prevIngredients) =>
            prevIngredients.map((ingredient) =>
                ingredient.id === id
                    ? { ...ingredient, checked: !ingredient.checked }
                    : ingredient
            )
        );
    };

    return (
        <div className="ingredients-list">
            <ul className="list">
                {ingredients.map((ingredient) => (
                    <li className="ingredient" key={ingredient.id}>
                        <input
                            type="checkbox"
                            id={`ingredient-${ingredient.id}`}
                            name={`ingredient-${ingredient.id}`}
                            checked={ingredient.checked}
                            onChange={() => handleCheckboxChange(ingredient.id)}
                        />
                        <label htmlFor={`ingredient-${ingredient.id}`}>
                            <div className="ingredient-details">
                                <span className="ingredient-name text-lg">{ingredient.name}</span>
                                <span className="ingredient-quantity text-sm">
                                    <span className="amount">{ingredient.quantity}</span><span className="unit">{ingredient.unit}</span>
                                </span>
                            </div>
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Ingredients;