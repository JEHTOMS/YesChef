import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CookieConsent.css';

function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('yeschef-cookie-consent');
        if (consent === 'essential') {
            const gaId = process.env.REACT_APP_GA_MEASUREMENT_ID;
            if (gaId) window['ga-disable-' + gaId] = true;
        }
        if (!consent) {
            // Small delay so it doesn't flash on load
            const timer = setTimeout(() => setVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAcceptAll = () => {
        localStorage.setItem('yeschef-cookie-consent', 'all');
        setVisible(false);
    };

    const handleEssentialOnly = () => {
        localStorage.setItem('yeschef-cookie-consent', 'essential');
        // Disable Google Analytics
        const gaId = process.env.REACT_APP_GA_MEASUREMENT_ID;
        if (gaId) window['ga-disable-' + gaId] = true;
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="cookie-overlay">
            <div className="cookie-banner">
                <div className="cookie-content">
                    <p className="text-subtitle" style={{ marginBottom: '4px' }}>We use cookies</p>
                    <p className="text-sm" style={{ color: '#737373', lineHeight: '160%' }}>
                        We use essential cookies for authentication and analytics cookies (Google Analytics) to understand how you use YesCheff so we can improve your experience. <Link to="/privacy-policy" className="cookie-link">Privacy Policy</Link>
                    </p>
                </div>
                <div className="cookie-actions">
                    <button className="sec-button text-lg" onClick={handleEssentialOnly} style={{ background: '#F3F3F3', color: '#171717' }}>Essential only</button>
                    <button className="md-button text-lg" onClick={handleAcceptAll}>Accept all</button>
                </div>
            </div>
        </div>
    );
}

export default CookieConsent;
