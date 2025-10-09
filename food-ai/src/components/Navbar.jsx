import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipe } from '../context/RecipeContext';
import '../pages/Home.css';
import '../index.css';

function Navbar({ showCloseButton = false, showBackButton = false, foodName = '', onBack, showFeedbackButton = true }) {
    const navigate = useNavigate();
    const { clearRecipe } = useRecipe();

    const handleCloseClick = () => {
        clearRecipe(); // Clear recipe data and localStorage
        navigate('/');
    };

    const handleBackClick = () => {
        if (onBack) {
            onBack();
        } else {
            navigate('/food-overview');
        }
    };

    const handleFeedbackClick = (e) => {
        e.preventDefault();
        const email = 'ajetomobideji@gmail.com';
        const subject = 'YesChef Feedback';
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    };

    const renderLogo = !showBackButton; // hide logo when back button variant
    const renderClose = showCloseButton && !showBackButton; // hide close when back shown

    return (
        <div className="nav-bar">
            <div className={`nav-container ${showBackButton ? 'food-info-nav' : ''}`}>
                {renderLogo && (
                    <svg width="118" height="37" viewBox="0 0 118 37" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="118" height="37" rx="8" fill="#FFD5F6"/>
<path d="M7.99 29C7.93 29 7.9 28.96 7.9 28.88L7.93 20.36L3.91 8.24C3.89 8.16 3.92 8.12 4 8.12H7.33C7.43 8.12 7.49 8.16 7.51 8.24L9.73 16.31L11.98 8.24C12 8.16 12.05 8.12 12.13 8.12H15.49C15.57 8.12 15.6 8.16 15.58 8.24L11.53 20.24L11.56 28.88C11.56 28.96 11.52 29 11.44 29H7.99ZM16.461 29C16.381 29 16.341 28.95 16.341 28.85L16.371 8.24C16.371 8.16 16.411 8.12 16.491 8.12H26.121C26.201 8.12 26.241 8.17 26.241 8.27V11.63C26.241 11.71 26.201 11.75 26.121 11.75H19.971V16.43H26.121C26.201 16.43 26.241 16.47 26.241 16.55L26.271 19.94C26.271 20.02 26.231 20.06 26.151 20.06H19.971V25.31H26.151C26.231 25.31 26.271 25.36 26.271 25.46V28.88C26.271 28.96 26.231 29 26.151 29H16.461ZM32.9629 29.3C31.8829 29.3 30.8929 29.03 29.9929 28.49C29.1129 27.93 28.4029 27.2 27.8629 26.3C27.3429 25.38 27.0829 24.37 27.0829 23.27V21.89C27.0829 21.79 27.1329 21.74 27.2329 21.74H30.5929C30.6729 21.74 30.7129 21.79 30.7129 21.89V23.27C30.7129 23.93 30.9329 24.5 31.3729 24.98C31.8129 25.44 32.3429 25.67 32.9629 25.67C33.5829 25.67 34.1129 25.43 34.5529 24.95C34.9929 24.47 35.2129 23.91 35.2129 23.27C35.2129 22.53 34.7329 21.89 33.7729 21.35C33.4529 21.17 32.9529 20.89 32.2729 20.51C31.5929 20.13 30.9529 19.77 30.3529 19.43C29.2529 18.79 28.4329 17.99 27.8929 17.03C27.3729 16.05 27.1129 14.95 27.1129 13.73C27.1129 12.61 27.3829 11.61 27.9229 10.73C28.4629 9.83 29.1729 9.12 30.0529 8.6C30.9529 8.08 31.9229 7.82 32.9629 7.82C34.0229 7.82 34.9929 8.09 35.8729 8.63C36.7729 9.15 37.4829 9.86 38.0029 10.76C38.5429 11.64 38.8129 12.63 38.8129 13.73V16.19C38.8129 16.27 38.7729 16.31 38.6929 16.31H35.3329C35.2529 16.31 35.2129 16.27 35.2129 16.19L35.1829 13.73C35.1829 13.03 34.9629 12.46 34.5229 12.02C34.0829 11.58 33.5629 11.36 32.9629 11.36C32.3429 11.36 31.8129 11.6 31.3729 12.08C30.9329 12.54 30.7129 13.09 30.7129 13.73C30.7129 14.39 30.8529 14.94 31.1329 15.38C31.4129 15.82 31.9229 16.24 32.6629 16.64C32.7629 16.7 32.9529 16.81 33.2329 16.97C33.5329 17.11 33.8529 17.28 34.1929 17.48C34.5329 17.66 34.8329 17.82 35.0929 17.96C35.3729 18.1 35.5429 18.19 35.6029 18.23C36.6029 18.79 37.3929 19.48 37.9729 20.3C38.5529 21.1 38.8429 22.09 38.8429 23.27C38.8429 24.41 38.5729 25.44 38.0329 26.36C37.5129 27.26 36.8029 27.98 35.9029 28.52C35.0229 29.04 34.0429 29.3 32.9629 29.3ZM49.1024 29.3C48.0024 29.3 47.0024 29.03 46.1024 28.49C45.2224 27.93 44.5224 27.19 44.0024 26.27C43.4824 25.35 43.2224 24.32 43.2224 23.18L43.2524 13.82C43.2524 12.72 43.5024 11.72 44.0024 10.82C44.5224 9.9 45.2224 9.17 46.1024 8.63C47.0024 8.07 48.0024 7.79 49.1024 7.79C50.2024 7.79 51.1924 8.06 52.0724 8.6C52.9524 9.14 53.6524 9.87 54.1724 10.79C54.6924 11.69 54.9524 12.7 54.9524 13.82V15.2C54.9524 15.28 54.9124 15.32 54.8324 15.32H51.4724C51.3924 15.32 51.3524 15.28 51.3524 15.2V13.82C51.3524 13.16 51.1324 12.59 50.6924 12.11C50.2724 11.63 49.7424 11.39 49.1024 11.39C48.3824 11.39 47.8324 11.64 47.4524 12.14C47.0724 12.62 46.8824 13.18 46.8824 13.82V23.18C46.8824 23.92 47.0924 24.52 47.5124 24.98C47.9524 25.44 48.4824 25.67 49.1024 25.67C49.7424 25.67 50.2724 25.42 50.6924 24.92C51.1324 24.4 51.3524 23.82 51.3524 23.18V21.8C51.3524 21.72 51.3924 21.68 51.4724 21.68H54.8624C54.9424 21.68 54.9824 21.72 54.9824 21.8V23.18C54.9824 24.32 54.7124 25.35 54.1724 26.27C53.6524 27.19 52.9524 27.93 52.0724 28.49C51.1924 29.03 50.2024 29.3 49.1024 29.3ZM56.3962 29C56.3162 29 56.2762 28.95 56.2762 28.85L56.3062 8.24C56.3062 8.16 56.3562 8.12 56.4562 8.12H59.7862C59.8862 8.12 59.9362 8.16 59.9362 8.24L59.9062 16.4H64.4062V8.24C64.4062 8.16 64.4462 8.12 64.5262 8.12H67.8562C67.9562 8.12 68.0062 8.16 68.0062 8.24L68.0662 28.85C68.0662 28.95 68.0162 29 67.9162 29H64.5562C64.4562 29 64.4062 28.95 64.4062 28.85V20.03H59.9062V28.85C59.9062 28.95 59.8662 29 59.7862 29H56.3962ZM69.7345 29C69.6545 29 69.6145 28.95 69.6145 28.85L69.6445 8.24C69.6445 8.16 69.6845 8.12 69.7645 8.12H79.3945C79.4745 8.12 79.5145 8.17 79.5145 8.27V11.63C79.5145 11.71 79.4745 11.75 79.3945 11.75H73.2445V16.43H79.3945C79.4745 16.43 79.5145 16.47 79.5145 16.55L79.5445 19.94C79.5445 20.02 79.5045 20.06 79.4245 20.06H73.2445V25.31H79.4245C79.5045 25.31 79.5445 25.36 79.5445 25.46V28.88C79.5445 28.96 79.5045 29 79.4245 29H69.7345ZM81.4621 29C81.3621 29 81.3121 28.95 81.3121 28.85L81.3721 8.24C81.3721 8.16 81.4121 8.12 81.4921 8.12H91.0921C91.1921 8.12 91.2421 8.16 91.2421 8.24V11.63C91.2421 11.71 91.2021 11.75 91.1221 11.75H84.9721V16.4H91.1221C91.2021 16.4 91.2421 16.45 91.2421 16.55L91.2721 19.94C91.2721 20.02 91.2221 20.06 91.1221 20.06H84.9721V28.85C84.9721 28.95 84.9221 29 84.8221 29H81.4621ZM93.482 29C93.382 29 93.332 28.95 93.332 28.85L93.392 8.24C93.392 8.16 93.432 8.12 93.512 8.12H103.112C103.212 8.12 103.262 8.16 103.262 8.24V11.63C103.262 11.71 103.222 11.75 103.142 11.75H96.992V16.4H103.142C103.222 16.4 103.262 16.45 103.262 16.55L103.292 19.94C103.292 20.02 103.242 20.06 103.142 20.06H96.992V28.85C96.992 28.95 96.942 29 96.842 29H93.482ZM105.839 23.48C105.759 23.48 105.709 23.43 105.689 23.33L105.059 16.43V8.27C105.059 8.17 105.099 8.12 105.179 8.12H108.539C108.639 8.12 108.689 8.17 108.689 8.27L108.659 16.43L108.029 23.33C108.009 23.43 107.959 23.48 107.879 23.48H105.839ZM105.179 29C105.099 29 105.059 28.95 105.059 28.85V25.58C105.059 25.5 105.099 25.46 105.179 25.46H108.539C108.619 25.46 108.659 25.5 108.659 25.58V28.85C108.659 28.95 108.619 29 108.539 29H105.179Z" fill="#F04DCC"/>
</svg>

                )}

                {/* Home page: Only feedback button (if showFeedbackButton is true and not on FoodOverview) */}
                {renderLogo && showFeedbackButton && !showCloseButton && (
                    <button 
                        className="feedback-button" 
                        onClick={handleFeedbackClick}
                        data-email="ajetomobideji@gmail.com"
                    >
                        Got feedback?
                        <span className="feedback-tooltip">ajetomobideji@gmail.com</span>
                    </button>
                )}

                {/* FoodOverview page: Feedback button and close button in a container with gap */}
                {renderClose && (
                    <div className="nav-buttons-container">
                        <button 
                            className="feedback-button" 
                            onClick={handleFeedbackClick}
                            data-email="ajetomobideji@gmail.com"
                        >
                            Got feedback?
                            <span className="feedback-tooltip">ajetomobideji@gmail.com</span>
                        </button>
                        <button className="close-button icon-button" id="close-button" onClick={handleCloseClick}>
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20.75 7.25L7.25 20.75M7.25 7.25L20.75 20.75" stroke="#1E1E1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>

                        </button>
                    </div>
                )}

                {/* FoodInformation page: Back button, food name, and feedback button */}
                {showBackButton && (
                    <>
                        <button className="back-button icon-button" id="back-button" onClick={handleBackClick}>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16.875 9H1.125M1.125 9L9 16.875M1.125 9L9 1.125" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                        <div className='foodNameContainer'>
                            <h2 className='foodName' style={{ fontWeight: '500' }}>{foodName}</h2>
                        </div>
                        <button 
                            className="feedback-button" 
                            onClick={handleFeedbackClick}
                            data-email="ajetomobideji@gmail.com"
                        >
                            Got feedback?
                            <span className="feedback-tooltip">ajetomobideji@gmail.com</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
export default Navbar;