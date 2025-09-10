import React, { useState, useEffect, useRef } from "react";
import { useRecipe } from '../context/RecipeContext';
import '../index.css';
import '../pages/Home.css';
import '../pages/FoodInfo.css';
import './Steps.css';

function Steps({ steps = [], onStepClick, activeStep = 0 }) {
    const { recipeData, getVideoDuration } = useRecipe();
    const [collapsed, setCollapsed] = useState(true);
    const listRef = useRef(null);

    const handleItemClick = (e, idx) => {
        e.preventDefault();
        // If collapsed, expand first and then navigate
        if (collapsed) setCollapsed(false);
        if (typeof onStepClick === 'function') onStepClick(idx);
    };

    // Create video chapter link for each step
    const getStepVideoLink = (step, stepIndex) => {
        // Check if step already has a specific videoLink
        if (step.videoLink) {
            return step.videoLink;
        }

        // Check if we have video data from recipe context
        const videoId = recipeData?.videoId;
        if (!videoId) {
            return `#step-${stepIndex + 1}`; // Fallback to anchor link
        }

        // Create YouTube link with estimated timestamp
        // Fix alignment: step content appears one position later in video
        const baseOffset = 30; // Skip intro
        const stepInterval = 90; // 1.5 minutes per step
        const maxVideoTime = getVideoDuration(); // Dynamic video duration
        
        // Add 1 to stepIndex to align with video content timing
        let adjustedIndex = stepIndex + 1;
        let estimatedSeconds = baseOffset + (adjustedIndex * stepInterval);
        estimatedSeconds = Math.min(estimatedSeconds, maxVideoTime);
        
        return `https://www.youtube.com/watch?v=${videoId}&t=${estimatedSeconds}s`;
    };

    const toggleCollapsed = (e) => {
        // prevent toggling when clicking a specific item (handled in item handler)
        if (e && e.target && (e.target.closest && e.target.closest('.step-item'))) return;
        setCollapsed((c) => !c);
    };

    // Collapse when clicking or scrolling/touching outside the expanded list
    useEffect(() => {
        if (collapsed) return; // only active when expanded

        const onDocClick = (ev) => {
            if (!listRef.current) return;
            if (!listRef.current.contains(ev.target)) {
                setCollapsed(true);
            }
        };

        const onScrollOrWheel = (ev) => {
            if (!listRef.current) return;
            // if the event target is outside the list, collapse
            if (!listRef.current.contains(ev.target)) {
                setCollapsed(true);
            }
        };

        document.addEventListener('click', onDocClick, true);
        window.addEventListener('wheel', onScrollOrWheel, { passive: true });
        window.addEventListener('scroll', onScrollOrWheel, { passive: true });
        window.addEventListener('touchstart', onScrollOrWheel, { passive: true });

        return () => {
            document.removeEventListener('click', onDocClick, true);
            window.removeEventListener('wheel', onScrollOrWheel);
            window.removeEventListener('scroll', onScrollOrWheel);
            window.removeEventListener('touchstart', onScrollOrWheel);
        };
    }, [collapsed]);

    return (
        <div className="footer no-bg">
            <div className="container layout-sm">
                <div className={`store-container ${collapsed ? 'collapsed' : ''}`}>
                    <div className="store-header">
                        <h2 className="text-subtitle">Directions</h2>
                        <button className="icon-button" id="close-stores" ><svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20.75 7.25L7.25 20.75M7.25 7.25L20.75 20.75" stroke="#1E1E1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</button>
                    </div>
                    <div className="store-wrapper">
                        {steps && steps.length > 0 ? (
                            <ul ref={listRef} className={`step-list ${collapsed ? 'collapsed' : 'expanded'}`} onClick={toggleCollapsed}>
                                {steps.map((step, idx) => {
                                    const isActive = idx === activeStep;
                                    const isPast = idx < activeStep;
                                    const isFuture = idx > activeStep;
                                    const itemClass = `step-item text-lg ${isActive ? 'active-step' : ''} ${isPast ? 'past-step' : ''} ${isFuture ? 'future-step' : ''}`;
                                    const videoLink = getStepVideoLink(step, idx);
                                    const isExternalLink = videoLink.startsWith('http');
                                    
                                    return (
                                    <li key={step.id || idx} className={itemClass} onClick={(e) => handleItemClick(e, idx)} id={`step-${idx + 1}`}>
                                        <a 
                                            href={videoLink}
                                            className={`step-number icon-button ${isActive ? 'step-number-active' : ''} ${isExternalLink ? 'step-video-link' : ''}`} 
                                            target={isExternalLink ? "_blank" : undefined}
                                            rel={isExternalLink ? "noopener noreferrer" : undefined}
                                            title={isExternalLink ? `Watch step ${idx + 1} in video` : `Go to step ${idx + 1}`}
                                            onClick={(e) => {
                                                if (isExternalLink) {
                                                    e.stopPropagation(); // Prevent handleItemClick from firing
                                                }
                                            }}
                                        >
                                            {idx + 1}
                                        </a>
                                        <span className="step-type" id={`step-${idx + 1}-text`}>{step.text}</span>
                                    </li>
                                )})}
                            </ul>
                        ) : (
                            <div className="text-lg">No steps available.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Steps;