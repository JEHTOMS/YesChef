import React from 'react';
import PropTypes from 'prop-types';
import Lottie from 'lottie-react';
import loadingAnimation from '../Loading.json';

function LoadingOverlay({
    primaryMessage = 'Extracting recipe...',
    secondaryMessage = 'Estimated time: 15 to 25 seconds',
    onCancel,
    showCancel = true,
    backdropBlur = 4,
}) {
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
        gap: '32px',
        background: 'white',
        borderRadius: '24px',
        padding: '32px'
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
                <Lottie
                    animationData={loadingAnimation}
                    loop
                    autoplay
                    style={{ height: 280, width: 280 }}
                />
                <div style={messageContainer}>
                    <p style={messageStyle}>{primaryMessage}</p>
                    {secondaryMessage && <p style={secondaryMessageStyle}>{secondaryMessage}</p>}
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
};

export default LoadingOverlay;
