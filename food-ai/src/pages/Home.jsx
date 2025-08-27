import React from "react";
import { useNavigate } from 'react-router-dom';
import './Home.css';
import '../index.css';
import Navbar from "../components/Navbar";
import Input from "../components/Input";
import Button from "../components/Button";
function Home() {
    const navigate = useNavigate();

    const handleCreateRecipe = () => {
        navigate("/food-overview");
    };

    return(
        <div className="page">
            <Navbar></Navbar>
            <div className="main-content">
                 <div className="container layout-sm">
                    <div className="input-wrapper">
                    <Input></Input>
                    <p className="description text-sm">Create recipe from a link or text</p>
                    </div>
                    <Button buttonText="Create Recipe"
                    onClick={handleCreateRecipe}>
                    </Button>
                 </div>
            </div>
        </div>
    );
}

export default Home;