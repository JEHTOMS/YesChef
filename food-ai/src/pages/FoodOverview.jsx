import React from "react";
import { useNavigate } from 'react-router-dom';
import '../index.css';
import './FoodO.css';
import Navbar from "../components/Navbar";
import FoodHero from "../components/FoodHero";
import FoodDetails from "../components/FoodDetails";
import ToNote from "../components/ToNote";
import Footer from "../components/Footer";
function FoodOverview() {
    const navigate = useNavigate();

    const startCooking = () => {
        navigate("/food-information");
    };

    return (
        <div className="page">
            <Navbar showCloseButton={true}/>
            <div className="main-content">
                 <div className="container layout-sm">
                     <FoodHero 
                     image="https://eatwellabi.com/wp-content/uploads/2022/11/Jollof-rice-16.jpg" 
                     name="Jollof Rice" 
                     videolink="https://www.youtube.com/watch?v=EfZEArZcfAY" />
                     <FoodDetails 
                     description="A classic West African dish made with rice, tomatoes, and a medley of spices. Jollof rice is versatile and perfect for gatherings or everyday meals."
                     cookingTime={60}
                     servings={4}
                     calories={2000} />

                     <ToNote items={{
                         tools: ["Blender", "Chicken stock"],
                         allergens: ["Crayfish", "Celery"]
                     }} />
                 </div>
            </div>
            <Footer buttonType="primary" primaryButtonText="Start Cooking" onTap={startCooking} />
        </div>
    );
}

export default FoodOverview;
