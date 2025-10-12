import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Lottie from 'lottie-react';
import loadingAnimation from '../Loading.json';

function LoadingOverlay({
    primaryMessage = 'Extracting recipe...',
    secondaryMessage = 'Estimated time: 15 to 25 seconds',
    onCancel,
    showCancel = true,
    backdropBlur = 4,
    progress = 0, // Backend controlled progress (0-100)
}) {
    const [localProgress, setLocalProgress] = useState(0);
    const startTimeRef = useRef(Date.now());
    const backendOverrideRef = useRef(false);

    // Hybrid progress system: time-based with backend override
    useEffect(() => {
        // If backend sends progress, switch to backend mode
        if (progress > 0) {
            backendOverrideRef.current = true;
            setLocalProgress(Math.max(progress, localProgress)); // Never go backwards
            return;
        }

        // Time-based progress system
        if (!backendOverrideRef.current) {
            const interval = setInterval(() => {
                const elapsed = (Date.now() - startTimeRef.current) / 1000; // seconds

                setLocalProgress((prev) => {
                    // Stage 1: 0-40% instant on mount
                    if (elapsed < 0.5 && prev < 40) {
                        return 40;
                    }
                    // Stage 2: 40-75% over 5 seconds (after initial 0.5s)
                    else if (elapsed >= 0.5 && elapsed < 5.5) {
                        const target = 40 + ((elapsed - 0.5) / 5) * 35; // 40 to 75
                        return Math.min(Math.max(target, prev), 75);
                    }
                    // Stage 3: 75-90% over next 10 seconds (5.5s to 15.5s)
                    else if (elapsed >= 5.5 && elapsed < 15.5) {
                        const target = 75 + ((elapsed - 5.5) / 10) * 15; // 75 to 90
                        return Math.min(Math.max(target, prev), 90);
                    }
                    // Stage 4: Stay at 90% until backend confirms completion
                    else if (elapsed >= 15.5) {
                        return Math.min(prev, 90);
                    }
                    return prev;
                });
            }, 100); // Update every 100ms for smooth animation

            return () => clearInterval(interval);
        }
    }, [progress, localProgress]);

    // Reset on mount
    useEffect(() => {
        startTimeRef.current = Date.now();
        backendOverrideRef.current = false;
        setLocalProgress(0);
    }, []);
    const overlayStyle = {
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        background: 'rgba(0, 0, 0, 0.45)', 
        backdropFilter: `blur(${backdropBlur}px)`,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 9999
    };

    const contentStyle = {
        display: 'flex',
        width: '375px',
        paddingBottom: '16px',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '48px',
        background: 'white',
        borderRadius: '24px',
        padding: '32px'
    };

    const loadingWrapper = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
        alignSelf: 'stretch'
    };

    const progressWrapper = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        alignSelf: 'stretch'
    };

    const progressBarContainer = {
        width: '100%',
        height: '8px',
        backgroundColor: '#F3F3F3',
        borderRadius: '4px',
        overflow: 'hidden'
    };

    const progressBarFill = {
        height: '100%',
        backgroundColor: '#F04DCC',
        borderRadius: '4px',
        transition: 'width 0.3s ease',
        width: `${localProgress}%`
    };

    const messageContainer = { 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '4px',
        alignSelf: 'stretch' 
    };

    const messageStyle = { 
        margin: 0, 
        color: '#000', 
        fontSize: 16, 
        fontWeight: 500 
    };

    const secondaryMessageStyle = { 
        margin: 0, 
        color: '#737373', 
        fontSize: 14, 
        fontWeight: 500 
    };

    const cancelButtonStyle = { 
        display: 'flex',
        padding: '13px 16px',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'stretch',
        borderRadius: '200px',
        background: '#F3F3F3',
        color: '#000',
        fontSize: '16px',
        fontWeight: '500',
        border: 'none',
        cursor: 'pointer'
    };

    // lottie-react handles autoplay/loop via props

    return (
        <div style={overlayStyle}>
            <div style={contentStyle}>
                <div style={loadingWrapper}>
                    <Lottie
                        animationData={loadingAnimation}
                        loop
                        autoplay
                        style={{ height: 180, width: 180 }}
                    />
                    <div style={progressWrapper}>
                        <div style={progressBarContainer}>
                            <div style={progressBarFill}></div>
                        </div>
                        <div style={messageContainer}>
                            <p style={messageStyle}>{primaryMessage}</p>
                            {secondaryMessage && <p style={secondaryMessageStyle}>{secondaryMessage}</p>}
                        </div>
                    </div>
                </div>
                {showCancel && (
                    <button 
                        style={cancelButtonStyle} 
                        type="button" 
                        onClick={() => { if (onCancel) onCancel(); }}
                        disabled={!onCancel}
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
}

LoadingOverlay.propTypes = {
    primaryMessage: PropTypes.string,
    secondaryMessage: PropTypes.string,
    onCancel: PropTypes.func,
    showCancel: PropTypes.bool,
    backdropBlur: PropTypes.number,
    progress: PropTypes.number, // 0-100
};

export default LoadingOverlay;
