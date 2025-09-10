import { useState } from 'react';
import '../pages/Home.css';
import '../index.css';

function Input({ onRecipeSubmit, isLoading }) {
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

    return (
        <div className="input-container">
            <textarea 
                value={videoUrl}
                onChange={handleInputChange}
                className="input-field title" 
                id="food-query" 
                placeholder={`What are you making for ${mealTime}?`}
                disabled={isLoading}
                rows={2}
            />
        </div>
    );
}

export default Input;
