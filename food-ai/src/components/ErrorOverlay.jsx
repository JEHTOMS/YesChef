import React from 'react';
import PropTypes from 'prop-types';

function ErrorOverlay({
    primaryMessage = 'Recipe Not Found',
    secondaryMessage = 'Unable to find any recipe',
    onClose,
    showClose = true,
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
        borderRadius: '16px',
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

    const closeButtonStyle = { 
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

    return (
        <div style={overlayStyle}>
            <div style={contentStyle}>
                <svg width="201" height="200" viewBox="0 0 201 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: 280, width: 280 }}>
                    <rect x="0.5" width="200" height="200" rx="100" fill="#EDEDED"/>
                    <path d="M118.448 97.3379C122.539 96.3784 128.59 99.9066 133.907 99.7767C143.546 99.5468 150.311 92.0805 156.392 84.8542C158.352 82.5153 159.98 79.8866 160.895 76.9881C163.689 68.0725 161.086 58.0176 153.97 52.2505C136.48 38.0775 109.15 53.3299 108.336 76.9981C108.135 82.8252 115.01 96.9381 101.893 96.9981C88.0724 97.0581 95.5707 80.7262 95.4099 74.3894C95.1084 61.7557 79.398 51.2709 70.1004 41.7957C68.7636 40.4364 66.8538 39.6967 64.9943 40.1265C61.5266 40.9261 59.7877 44.6543 61.2853 47.5828C65.6476 56.1085 83.1673 65.6038 84.8961 76.1685C85.268 78.4274 82.5843 79.9966 80.7851 78.5873C71.2362 71.081 59.3856 53.2 51.1736 51.7307C48.6205 51.2709 46.6504 53.23 47.0927 55.7687C48.4999 63.7547 65.7884 75.2689 73.5481 84.5143C75.2166 86.5033 73.4676 89.4219 70.8945 89.0321C57.516 87.0231 50.5403 69.062 37.8554 64.9541C33.3022 63.4748 31.1411 69.5218 35.0008 73.5498C49.4447 88.6323 63.7077 102.565 84.8358 98.6373C86.2531 98.3774 87.7206 98.7672 88.7358 99.7767C92.1734 103.195 92.0829 108.752 88.5247 112.041C75.4578 124.125 51.7465 146.703 49.8669 148.772C47.545 151.331 46.7108 152.38 46.5399 154.369C46.2685 157.438 49.9674 161.126 54.0885 159.667C55.5359 159.157 56.8828 157.218 58.491 155.409C69.618 142.845 82.2124 130.411 95.1486 118.068C98.556 114.819 103.934 114.869 107.271 118.177L146.33 156.988C148.069 158.717 150.864 159.137 152.874 157.728C155.427 155.919 155.678 152.41 153.628 150.251C144.853 141.016 119.815 119.057 115.151 112.99C110.487 106.933 109.643 99.3969 118.468 97.3379H118.448Z" fill="#BDBDBD"/>
                </svg>
                <div style={messageContainer}>
                    <p style={messageStyle}>{primaryMessage}</p>
                    {secondaryMessage && <p style={secondaryMessageStyle}>{secondaryMessage}</p>}
                </div>
                {showClose && (
                    <button 
                        style={closeButtonStyle} 
                        type="button" 
                        onClick={() => { if (onClose) onClose(); }}
                        disabled={!onClose}
                    >
                        Try Again
                    </button>
                )}
            </div>
        </div>
    );
}

ErrorOverlay.propTypes = {
    primaryMessage: PropTypes.string,
    secondaryMessage: PropTypes.string,
    onClose: PropTypes.func,
    showClose: PropTypes.bool,
    backdropBlur: PropTypes.number,
};

export default ErrorOverlay;
