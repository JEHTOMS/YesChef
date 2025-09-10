import React from "react";
import '../index.css';
import '../pages/Home.css';
import '../pages/FoodO.css';

function ToNote({ tools = [], allergens = [] }) {
    // Don't render if no data
    if (!tools.length && !allergens.length) {
        return null;
    }

    return (
        <div className="to-note">
            <h2 className="to-note-title text-subtitle">Things to note</h2>
            <div className="food-details">
                <div className="tools">
                    <h3 className="tools-title text-sm">Tools</h3>
                    <ul className="tools-list">
                        {tools.map((tool, index) => (
                            <li key={index} className="tools-item text-sm">{tool}</li>
                        ))}
                    </ul>
                </div>
                <div className="allergens">
                    <div className="allergen-title">
                        <h3 className="tools-title text-sm">Potential Allergens</h3>
                        <div className="tooltip">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clipPath="url(#clip0_618_16710)">
                                    <path d="M6.99984 9.33335V7.00002M6.99984 4.66669H7.00567M12.8332 7.00002C12.8332 10.2217 10.2215 12.8334 6.99984 12.8334C3.77818 12.8334 1.1665 10.2217 1.1665 7.00002C1.1665 3.77836 3.77818 1.16669 6.99984 1.16669C10.2215 1.16669 12.8332 3.77836 12.8332 7.00002Z" stroke="#1E1E1E" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                                </g>
                                <defs>
                                    <clipPath id="clip0_618_16710">
                                        <rect width="14" height="14" fill="white"/>
                                    </clipPath>
                                </defs>
                            </svg>
                            <span className="tooltiptext text-sm">Based on the ingredients in this recipe</span>
                        </div>
                    </div>
                    <ul className="allergen-list">
                        {allergens.map((allergen, index) => (
                            <li key={index} className="allergen-item text-sm">{allergen}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default ToNote;
