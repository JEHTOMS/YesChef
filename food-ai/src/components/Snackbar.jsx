import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSavedRecipes } from '../context/SavedRecipesContext';
import './Snackbar.css';

function Snackbar() {
    const navigate = useNavigate();
    const { snackbar, undoUnsave, dismissSnackbar } = useSavedRecipes();

    if (!snackbar) return null;

    const handleButtonClick = () => {
        if (snackbar.action === 'viewSaved') {
            dismissSnackbar();
            navigate('/saved-recipes');
        } else if (snackbar.undoData) {
            undoUnsave();
        }
    };

    const buttonText = snackbar.buttonText || 'Undo';

    return (
        <div className="snackbar">
            <div className="snackbar-content">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-lg">{snackbar.message}</span>
            </div>
            <button className="snackbar-undo text-lg" onClick={handleButtonClick}>
                {buttonText}
            </button>
        </div>
    );
}

export default Snackbar;
