import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import '../index.css';
import '../pages/Home.css';
import '../pages/FoodInfo.css';

const Ingredients = forwardRef(({ ingredients: initialIngredients, servingMultiplier = 1, onChange }, ref) => {
    // Create scaled ingredients based on serving multiplier
    const scaledIngredients = useMemo(() => {
        if (!initialIngredients) return [];
        
        return initialIngredients.map(ingredient => {
            // Parse the quantity to handle different formats
            const parseQuantity = (quantityStr) => {
                if (!quantityStr || typeof quantityStr !== 'string') return null;
                
                // Try to extract number from the beginning of the string
                const match = quantityStr.match(/^(\d*\.?\d+)/);
                return match ? parseFloat(match[1]) : null;
            };
            
            const originalQuantity = parseQuantity(ingredient.quantity);
            
            // If we can parse a number, scale it; otherwise, keep original
            const scaledQuantity = originalQuantity !== null 
                ? (originalQuantity * servingMultiplier).toFixed(originalQuantity % 1 === 0 ? 0 : 1)
                : ingredient.quantity;
            
            // For non-numeric quantities, we might want to add a note about scaling
            const needsManualScaling = originalQuantity === null && servingMultiplier !== 1;
            
            return {
                ...ingredient,
                quantity: scaledQuantity,
                // Add a visual indicator if manual scaling might be needed
                needsManualScaling
            };
        });
    }, [initialIngredients, servingMultiplier]);

    const [ingredients, setIngredients] = useState(scaledIngredients);

    // Update (rescale) while preserving checked flags when scaledIngredients changes
    useEffect(() => {
        setIngredients(prev => {
            // Map new scaled list, keep previous checked state if id matches
            const next = scaledIngredients.map(item => {
                const old = prev.find(p => p.id === item.id);
                return old ? { ...item, checked: old.checked } : item;
            });
            return next;
        });
    }, [scaledIngredients]);

    // Expose imperative methods to parent (fetch & mutate)
    useImperativeHandle(ref, () => ({
        getCurrentIngredients: () => ingredients,
        setAllChecked: (checked = true) => {
            setIngredients(prev => {
                const updated = prev.map(ing => ({ ...ing, checked }));
                if (typeof onChange === 'function') onChange(updated);
                return updated;
            });
        }
    }));

    const handleCheckboxChange = (id) => {
        setIngredients(prevIngredients => {
            const updated = prevIngredients.map(ingredient =>
                ingredient.id === id
                    ? { ...ingredient, checked: !ingredient.checked }
                    : ingredient
            );
            if (typeof onChange === 'function') onChange(updated);
            return updated;
        });
    };

    // Notify parent of initial list (once) when mounted or scaled list changes
    useEffect(() => {
        if (typeof onChange === 'function') onChange(ingredients);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scaledIngredients]);

    return (
        <div className="ingredients-list mg-240">
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
                                <span className="ingredient-name text-lg" style={{ textTransform: 'capitalize' }}>{ingredient.name}</span>
                                <span className="ingredient-quantity text-sm">
                                    <span className="amount">{ingredient.quantity}</span>
                                    {ingredient.quantity && ingredient.unit ? <span aria-hidden="true">&nbsp;</span> : null}
                                    <span className="unit">{ingredient.unit}</span>
                                    {ingredient.needsManualScaling && (
                                        <span className="scaling-note" style={{ 
                                            color: '#666', 
                                            fontSize: '0.8em', 
                                            marginLeft: '4px',
                                            fontStyle: 'italic'
                                        }}>
                                            (adjust as needed)
                                        </span>
                                    )}
                                </span>
                            </div>
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
});

export default Ingredients;