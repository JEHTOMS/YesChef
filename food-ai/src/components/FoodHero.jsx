import React from "react";
import '../index.css';
import '../pages/Home.css';
import '../pages/FoodO.css'; 

function FoodHero({ image, name, videolink }) {
    const handleVideoClick = (e) => {
        if (videolink) {
            window.open(videolink, '_blank');
        }
    };

    return (
        <div className="food-hero">
            <img 
                src={image || '/placeholder-food.jpg'} 
                alt={name} 
                id="food-image"
                onError={(e) => {
                    e.target.src = '/placeholder-food.jpg';
                }}
            />
            <div className="food-title">
                <h1 className="food-name text-title">{name}</h1>
                {videolink && (
                    <a 
                        href={videolink} 
                        className="food-link"
                        onClick={handleVideoClick}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <div className="icon-button">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 17H7C5.67392 17 4.40215 16.4732 3.46447 15.5355C2.52678 14.5979 2 13.3261 2 12C2 10.6739 2.52678 9.40215 3.46447 8.46447C4.40215 7.52678 5.67392 7 7 7H9" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M15 7H17C18.3261 7 19.5979 7.52678 20.5355 8.46447C21.4732 9.40215 22 10.6739 22 12C22 13.3261 21.4732 14.5979 20.5355 15.5355C19.5979 16.4732 18.3261 17 17 17H15" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M8 12H16" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="video-link-tooltip">YouTube.com</span>
                        </div>
                    </a>
                )}
            </div>
        </div>
    );
}

export default FoodHero;