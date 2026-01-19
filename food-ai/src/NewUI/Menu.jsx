import React, { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import '../pages/Home.css';
import '../index.css';
import './Menu.css';
import NewNavbar from "./NewNavbar.jsx";
import { useSavedRecipes } from '../context/SavedRecipesContext';

function Menu(){
    const navigate = useNavigate();
    const [userEmail, setUserEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const { savedRecipes } = useSavedRecipes();
    
    // Fetch user profile data
    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUserEmail(session.user.email || '');
                
                // Fetch profile from profiles table
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('display_name')
                    .eq('id', session.user.id)
                    .single();
                
                if (profile?.display_name) {
                    setFirstName(profile.display_name);
                }
            }
        };
        
        fetchUserData();
    }, []);
    
    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };
    
    return(
        <div className="page">
            <NewNavbar 
            showLogo
            showCloseButtonRight
            onLogoClick={() => navigate('/')}
            onCloseRightClick={() => navigate('/')}
            />
            <div className="main-content ">
            <div className="container layout-sm"> 
                <div className="menu-container">
                    <ul className="list">
                        <li className="menu-item">
                            <Link to="/profile" id="profile" className="menu-link text-lg">
                            <div className="menu-tag" style={{alignItems: "flex-start"}}> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 12C10.9 12 9.95833 11.6083 9.175 10.825C8.39167 10.0417 8 9.1 8 8C8 6.9 8.39167 5.95833 9.175 5.175C9.95833 4.39167 10.9 4 12 4C13.1 4 14.0417 4.39167 14.825 5.175C15.6083 5.95833 16 6.9 16 8C16 9.1 15.6083 10.0417 14.825 10.825C14.0417 11.6083 13.1 12 12 12ZM4 20V17.2C4 16.6333 4.14583 16.1125 4.4375 15.6375C4.72917 15.1625 5.11667 14.8 5.6 14.55C6.63333 14.0333 7.68333 13.6458 8.75 13.3875C9.81667 13.1292 10.9 13 12 13C13.1 13 14.1833 13.1292 15.25 13.3875C16.3167 13.6458 17.3667 14.0333 18.4 14.55C18.8833 14.8 19.2708 15.1625 19.5625 15.6375C19.8542 16.1125 20 16.6333 20 17.2V20H4ZM6 18H18V17.2C18 17.0167 17.9542 16.85 17.8625 16.7C17.7708 16.55 17.65 16.4333 17.5 16.35C16.6 15.9 15.6917 15.5625 14.775 15.3375C13.8583 15.1125 12.9333 15 12 15C11.0667 15 10.1417 15.1125 9.225 15.3375C8.30833 15.5625 7.4 15.9 6.5 16.35C6.35 16.4333 6.22917 16.55 6.1375 16.7C6.04583 16.85 6 17.0167 6 17.2V18ZM12 10C12.55 10 13.0208 9.80417 13.4125 9.4125C13.8042 9.02083 14 8.55 14 8C14 7.45 13.8042 6.97917 13.4125 6.5875C13.0208 6.19583 12.55 6 12 6C11.45 6 10.9792 6.19583 10.5875 6.5875C10.1958 6.97917 10 7.45 10 8C10 8.55 10.1958 9.02083 10.5875 9.4125C10.9792 9.80417 11.45 10 12 10Z" fill="black"/>
</svg>
<div className="profile-details">{firstName || 'Profile'} {userEmail && <p className="text-sm" style={{color: "#737373"}}>{userEmail}</p>}</div></div><svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1 11L6 6L1 1" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</Link>
                        </li>
                        <li className="menu-item">
                            <a href="/savedRecipes" id="savedRecipes" className="menu-link text-lg">
                            <div className="menu-tag"> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.85 17.825L12 15.925L15.15 17.85L14.325 14.25L17.1 11.85L13.45 11.525L12 8.125L10.55 11.5L6.9 11.825L9.675 14.25L8.85 17.825ZM5.825 22L7.45 14.975L2 10.25L9.2 9.625L12 3L14.8 9.625L22 10.25L16.55 14.975L18.175 22L12 18.275L5.825 22Z" fill="black"/>
</svg>
Saved recipes</div><div className="subtag-wrapper"><p className="recipes-amount text-lg content-sec-color" style={{padding: "0 0 3px 0px"}}>{savedRecipes?.length || 0}</p><svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1 11L6 6L1 1" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg></div>
</a>
                        </li>
                        <li className="menu-item">
                            <Link to="/plans" id="plans" className="menu-link text-lg">
                            <div className="menu-tag"> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1 9.625H21M2.81818 4H19.1818C20.186 4 21 4.83947 21 5.875V17.125C21 18.1605 20.186 19 19.1818 19H2.81818C1.81403 19 1 18.1605 1 17.125V5.875C1 4.83947 1.81403 4 2.81818 4Z" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>Plans</div><div className="subtag-wrapper"><div className="subtag text-sm"><span id="credit-left">20 </span>cr. left</div><svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1 11L6 6L1 1" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg></div>
</Link>
                        </li>
                        <li className="menu-item">
                            <a href="/speech" id="speech" className="menu-link text-lg">
                            <div className="menu-tag"> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14 20.7251V18.6751C15.5 18.2418 16.7083 17.4084 17.625 16.1751C18.5417 14.9418 19 13.5418 19 11.9751C19 10.4084 18.5417 9.00843 17.625 7.7751C16.7083 6.54176 15.5 5.70843 14 5.2751V3.2251C16.0667 3.69176 17.75 4.7376 19.05 6.3626C20.35 7.9876 21 9.85843 21 11.9751C21 14.0918 20.35 15.9626 19.05 17.5876C17.75 19.2126 16.0667 20.2584 14 20.7251ZM3 15.0001V9.0001H7L12 4.0001V20.0001L7 15.0001H3ZM14 16.0001V7.9501C14.7833 8.31676 15.3958 8.86676 15.8375 9.6001C16.2792 10.3334 16.5 11.1334 16.5 12.0001C16.5 12.8501 16.2792 13.6376 15.8375 14.3626C15.3958 15.0876 14.7833 15.6334 14 16.0001ZM10 8.8501L7.85 11.0001H5V13.0001H7.85L10 15.1501V8.8501Z" fill="#000000"/>
</svg>Speech</div><div className="subtag-wrapper"><div className="subtag text-sm">Upgrade to pro</div><svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1 11L6 6L1 1" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg></div>
</a>
                        </li>
                    </ul>
                </div>
                <div className="menu-container">
                    <ul className="list">
                        <li className="menu-item">
                            <a href="/support" id="support" className="menu-link text-lg">
                            <div className="menu-tag"> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13M12 17H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#1E1E1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
Support</div><svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1 11L6 6L1 1" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</a>
                        </li>
                        <li className="menu-item">
                            <a href="/terms-of-service" id="terms-of-service" className="menu-link text-lg">
                            <div className="menu-tag"> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8M14 2L20 8M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke="#1E1E1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
Terms of service</div><svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1 11L6 6L1 1" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</a>
                        </li>
                        <li className="menu-item">
                            <button onClick={handleSignOut} id="sign-out" className="menu-link text-lg" style={{background: "none", border: "none", width: "100%", cursor: "pointer"}}>
                            <div className="menu-tag"> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9" stroke="#1E1E1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
Sign out</div><svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1 11L6 6L1 1" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</button>
                        </li>
                    </ul>
                </div>
                <p className="app-version text-sm">Version 2.0</p>
            </div>
            </div>
        </div>
    );
}

export default Menu;