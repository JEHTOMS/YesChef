import React from "react";
import '../index.css';
import '../pages/Home.css';
import '../pages/FoodInfo.css';
import './Stores.css';

function Stores(props) {
    const stores = props.stores || [];
    const loading = props.loading || false;
    const error = props.error || null;

    const handleCloseClick = () => {
        if (props.onClose) {
            props.onClose();
        }
    };

    return(
<div className="main-content">
                <div className="container layout-sm">
                  <div className="store-container">
                    <div className="store-header">
                        <h2 className="text-subtitle">Available stores</h2>
                        <button className="icon-button" id="close-stores" onClick={handleCloseClick}><svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20.75 7.25L7.25 20.75M7.25 7.25L20.75 20.75" stroke="#1E1E1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</button>
                    </div>
                    <div className="store-wrapper">
                        <ul className="store-list">
                            {loading ? (
                                <li className="store-item loading">
                                    <div className="store-info">
                                        <span className="store-name text-lg">Finding nearby stores...</span>
                                        <span className="store-numerics text-sm">Please wait while we locate stores near you</span>
                                    </div>
                                </li>
                            ) : error ? (
                                <li className="store-item error">
                                    <div className="store-info">
                                        <span className="store-name text-lg">Unable to find stores</span>
                                        <span className="store-numerics text-sm">{error}</span>
                                    </div>
                                </li>
                            ) : stores.length > 0 ? (
                                stores.map((store) => (
                                    <li className="store-item" id={`store-${store.id}`} key={store.id}>
                                        <div className="store-info">
                                            <span className="store-name text-lg">{store.name}</span>
                                            <span className="store-numerics text-sm">
                                                <span className="store-distance">{store.distance}</span> <span> • </span>
                                                <a href={`tel:${store.phone}`} className="store-number">{store.phoneDisplay}</a>
                                            </span>
                                        </div>
                                        <a href={store.location} target="_blank" rel="noopener noreferrer" className="store-location">
                                            <div className="icon-button">
                                               <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <g clipPath="url(#clip0_618_16835)">
                                                <path d="M21 10.5C21 17.5 12 23.5 12 23.5C12 23.5 3 17.5 3 10.5C3 8.11305 3.94821 5.82387 5.63604 4.13604C7.32387 2.44821 9.61305 1.5 12 1.5C14.3869 1.5 16.6761 2.44821 18.364 4.13604C20.0518 5.82387 21 8.11305 21 10.5Z" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M12 13.5C13.6569 13.5 15 12.1569 15 10.5C15 8.84315 13.6569 7.5 12 7.5C10.3431 7.5 9 8.84315 9 10.5C9 12.1569 10.3431 13.5 12 13.5Z" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </g>
                                                <defs>
                                                <clipPath id="clip0_618_16835">
                                                <rect width="24" height="24" fill="white" transform="translate(0 0.5)"/>
                                                </clipPath>
                                                </defs>
                                                </svg>
                                            </div>
                                        </a>
                                    </li>
                                ))
                            ) : (
                                <li className="store-item no-stores">
                                    <div className="store-info">
                                        <span className="store-name text-lg">No stores found</span>
                                        <span className="store-numerics text-sm">Try adjusting your location or check back later</span>
                                    </div>
                                </li>
                            )}
                        </ul>
                    </div>
                    </div>  
                </div>
                </div>
    )
}

export default Stores;