import React, { useState, useRef } from "react";
import './Home.css';
import '../index.css';
import Navbar from "../components/Navbar";
import '../pages/FoodInfo.css';
import Footer from "../components/Footer";
import Ingredients from "../components/Ingredients";
import Stores from "../components/Stores";
import Directions from "../components/Directions";
import Steps from "../components/Steps";

function FoodInformation() {
    const [activeTab, setActiveTab] = useState('ingredients');
    const [isStoresModalOpen, setIsStoresModalOpen] = useState(false);
    const [isModalClosing, setIsModalClosing] = useState(false);
    const directionsRef = useRef(null);
    const [activeDirectionIndex, setActiveDirectionIndex] = useState(0);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const openStoresModal = () => {
        setIsStoresModalOpen(true);
        setIsModalClosing(false);
    };

    const closeStoresModal = () => {
        // Prevent multiple close animations
        if (isModalClosing) return;
        
        setIsModalClosing(true);
        // Wait for animation to complete before hiding modal
        setTimeout(() => {
            setIsStoresModalOpen(false);
            setIsModalClosing(false);
        }, 150);
    };

    const handleOverlayClick = (e) => {
        // Check if clicked element is the overlay itself (not its children)
        if (e.target === e.currentTarget) {
            closeStoresModal();
        }
    };

    // shared directions data used by both Directions and Steps
    const directions = [
        {
            id: 1,
            text: "Heat 1/4 cup of vegetable oil in a large pot over ",
            heat: "medium",
            ingredients: ["Vegetable Oil", "Onion"],
            time: "05:00"
        },
        {
            id: 2,
            text: "Add minced garlic and cook until fragrant over ",
            heat: "low",
            ingredients: ["Garlic"],
            time: "00:30"
        },
        {
            id: 3,
            text: "Pour in chicken stock and bring to a boil, then reduce to ",
            heat: "low",
            ingredients: ["Chicken Stock"],
            time: "10:00"
        },
        {
            id: 4,
            text: "Simmer for 20 minutes, then serve hot.",
            heat: "low",
            ingredients: ["Vegetable Oil", "Onion", "Garlic", "Chicken Stock"],
            time: "20:00"
        }
    ];

    return (
        <div className="page food-info-page">
            <div className="header">
                <Navbar showCloseButton={true} />
                <div className="tab-bar">
                    <div className="segmented-controls" data-active={activeTab}>
                        <input 
                            id="ingredients" 
                            name="two" 
                            type="radio" 
                            checked={activeTab === 'ingredients'}
                            onChange={() => handleTabChange('ingredients')}
                        />
                        <label htmlFor="ingredients">Ingredients</label>
                        <input 
                            id="directions" 
                            name="two" 
                            type="radio" 
                            checked={activeTab === 'directions'}
                            onChange={() => handleTabChange('directions')}
                        />
                        <label htmlFor="directions">Directions</label>
                    </div>
                </div>
            </div>
            <div className="main-content with-segmented-controls">
                <div className="container layout-sm">
                    {activeTab === 'ingredients' ? (
                        <Ingredients 
                            ingredients={[
                                {
                                    id: 1,
                                    name: "Scales",
                                    quantity: "1",
                                    unit: " Medium",
                                    checked: false
                                },
                                {
                                    id: 2,
                                    name: "Garlic",
                                    quantity: "3",
                                    unit: " Cloves",
                                    checked: false
                                },
                                {
                                    id: 3,
                                    name: "Onion",
                                    quantity: "1",
                                    unit: " Large",
                                    checked: false
                                },
                                {
                                    id: 4,
                                    name: "Olive Oil",
                                    quantity: "2",
                                    unit: " Tablespoons",
                                    checked: false
                                },
                                {
                                    id: 5,
                                    name: "Red Bell Pepper",
                                    checked: false
                                },
                                {
                                    id: 6,
                                    name: "Vegetable Oil",
                                    quantity: "1/3",
                                    unit: " Cups",
                                    checked: false
                                },
                                {
                                    id: 7,
                                    name: "Chicken Stock",
                                    quantity: "1",
                                    unit: " Cups",
                                    checked: false
                                }

                            ]}
                                                />
                    ) : (
                        <Directions ref={directionsRef} steps={directions} onActiveChange={(i) => setActiveDirectionIndex(i)} />
                    )}
                </div>
            </div>
            {/* Footer: show the standard footer on Ingredients, and Steps as footer on Directions */}
            {activeTab === 'ingredients' && (
                <Footer showIcon={true} 
                primaryButtonText="Stores"
                secondaryButtonText="Copy"
                onTap={openStoresModal}
                primaryButtonIcon={<svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g clip-path="url(#clip0_618_16806)">
                                    <path d="M19.9375 9.875C19.9375 16.4375 11.5 22.0625 11.5 22.0625C11.5 22.0625 3.0625 16.4375 3.0625 9.875C3.0625 7.63724 3.95145 5.49112 5.53379 3.90879C7.11612 2.32645 9.26224 1.4375 11.5 1.4375C13.7378 1.4375 15.8839 2.32645 17.4662 3.90879C19.0486 5.49112 19.9375 7.63724 19.9375 9.875Z" stroke="white" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M11.5 12.6875C13.0533 12.6875 14.3125 11.4283 14.3125 9.875C14.3125 8.3217 13.0533 7.0625 11.5 7.0625C9.9467 7.0625 8.6875 8.3217 8.6875 9.875C8.6875 11.4283 9.9467 12.6875 11.5 12.6875Z" stroke="white" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
                                    </g>
                                    <defs>
                                    <clipPath id="clip0_618_16806">
                                    <rect width="22.5" height="22.5" fill="white" transform="translate(0.25 0.5)"/>
                                    </clipPath>
                                    </defs>
                                    </svg>} 
                secondaryButtonIcon={<svg width="24" height="23" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5.4375 14.5625H4.5C4.00272 14.5625 3.52581 14.365 3.17417 14.0133C2.82254 13.6617 2.625 13.1848 2.625 12.6875V4.25C2.625 3.75272 2.82254 3.27581 3.17417 2.92417C3.52581 2.57254 4.00272 2.375 4.5 2.375H12.9375C13.4348 2.375 13.9117 2.57254 14.2633 2.92417C14.615 3.27581 14.8125 3.75272 14.8125 4.25V5.1875M11.0625 8.9375H19.5C20.5355 8.9375 21.375 9.77697 21.375 10.8125V19.25C21.375 20.2855 20.5355 21.125 19.5 21.125H11.0625C10.027 21.125 9.1875 20.2855 9.1875 19.25V10.8125C9.1875 9.77697 10.027 8.9375 11.0625 8.9375Z" stroke="#1E1E1E" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>} />
            )}

            {activeTab === 'directions' && (
                <Steps steps={directions} activeStep={activeDirectionIndex} onStepClick={(i) => {
                    if (directionsRef.current && typeof directionsRef.current.goToStep === 'function') {
                        directionsRef.current.goToStep(i);
                    } else {
                        const target = document.getElementById(`step-${i + 1}`);
                        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }} />
            )}

            {/* Stores Modal */}
            {isStoresModalOpen && (
                <div 
                    className={`modal-overlay ${isModalClosing ? 'closing' : ''}`} 
                    onClick={handleOverlayClick}
                >
                    <Stores 
                        onClose={closeStoresModal}
                        stores={[
                            {
                                id: 1,
                                name: "Sainsbury's Local",
                                distance: "0.1 miles",
                                phone: "03331234567",
                                phoneDisplay: "0333 123 4567",
                                location: "#"
                            },
                            {
                                id: 2,
                                name: "Tesco Express",
                                distance: "0.3 miles", 
                                phone: "03451677890",
                                phoneDisplay: "0345 167 7890",
                                location: "#"
                            },
                            {
                                id: 3,
                                name: "ASDA Superstore",
                                distance: "0.5 miles",
                                phone: "08001234567",
                                phoneDisplay: "0800 123 4567", 
                                location: "#"
                            },
                            {
                                id: 4,
                                name: "Morrisons",
                                distance: "0.7 miles",
                                phone: "08701112234",
                                phoneDisplay: "0870 111 2234",
                                location: "#"
                            }
                        ]}
                    />
                </div>
            )}
        </div>
    );
}

export default FoodInformation;