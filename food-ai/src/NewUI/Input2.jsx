import { useState } from 'react';
import '../pages/Home.css';
import '../index.css';

function Input2({ onRecipeSubmit, onSubmit, isLoading, isCarouselMode = false, onGrabberClick }) {
    const [videoUrl, setVideoUrl] = useState('');

    // Determine meal period based on local time
    const getMealTime = () => {
        const hour = new Date().getHours();
        if (hour < 11) return 'breakfast'; // ~5am-10:59am
        if (hour < 16) return 'lunch';     // 11:00am-3:59pm
        return 'dinner';                   // 4:00pm onward
    };
    const mealTime = getMealTime();

    const handleInputChange = (e) => {
        const value = e.target.value;
        setVideoUrl(value);
        if (onRecipeSubmit) {
            onRecipeSubmit(value.trim());
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent new line
            if (videoUrl.trim() && onSubmit && !isLoading) {
                onSubmit();
            }
        }
    };

    return (
        <div className="input-container" style={isCarouselMode ? {transition: 'box-shadow 0.2s ease-out'} : {boxShadow: "-4px -4px 20px 0 rgba(58, 58, 58, 0.05), 4px 4px 20px 0 rgba(58, 58, 58, 0.05)", transition: 'box-shadow 0.2s ease-out'}}>
            <div className="sheet-grabber" onClick={onGrabberClick} style={{ cursor: 'pointer', touchAction: 'none' }}></div>
            <div className='dsc-wrapper' style={{marginBottom: "-8px"}}><p className="description text-sm" style={{fontSize: "13px"}}>Create recipes from adding text or any social link.</p>
            
            </div>
            <textarea 
                value={videoUrl}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className={`input-field ${isCarouselMode ? 'title' : 'text-subtitle'}`} 
                style={{minHeight: "64px"}}
                id="food-query" 
                placeholder={`What are you making for ${mealTime}?`}
                disabled={isLoading}
                rows={2}
            />
            <div className="input-footer">
            <div className='dsc-wrapper'><a href="mailto:hello@yescheff.co" className="description text-sm" style={{fontSize: "13px", textDecoration: "underline"}}>Got feedback?</a>
            </div>
            <button 
                className="md-button text-lg"
                onClick={() => {
                    if (videoUrl.trim() && onSubmit && !isLoading) {
                        onSubmit();
                    }
                }}
                disabled={isLoading}
            >
                {isLoading ? 'Loading...' : 'Create Recipe'}
            </button>
            </div>
        </div>
    );
}

export default Input2;