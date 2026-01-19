import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import '../pages/Home.css';
import '../index.css';
import NewNavbar from "../NewUI/NewNavbar.jsx";
import './Menu.css';
import './Profile.css';


function Profile() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [emailUpdates, setEmailUpdates] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    
    // Fetch user data on mount
    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setEmail(session.user.email || '');
                
                // Fetch profile from profiles table
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('display_name, email_updates')
                    .eq('id', session.user.id)
                    .single();
                
                if (profile) {
                    setFirstName(profile.display_name || '');
                    setEmailUpdates(profile.email_updates || false);
                }
            }
            setLoading(false);
        };
        
        fetchUserData();
    }, []);
    
    const handleBack = () => {
        navigate(-1);
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            setMessage('Not logged in');
            setSaving(false);
            return;
        }
        
        // Upsert profile (insert or update)
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: session.user.id,
                display_name: firstName,
                email_updates: emailUpdates,
                updated_at: new Date().toISOString(),
            });
        
        if (error) {
            setMessage(`Error: ${error.message}`);
        } else {
            setMessage('Profile saved!');
            // Navigate back after short delay
            setTimeout(() => navigate(-1), 1000);
        }
        setSaving(false);
    };
    
    if (loading) {
        return (
            <div className="page">
                <NewNavbar showBackButton onBackClick={handleBack} />
                <div className="main-content">
                    <div className="container layout-sm">
                        <p>Loading...</p>
                    </div>
                </div>
            </div>
        );
    }
    
    return(
        <div className="page">
             <NewNavbar 
            showBackButton
            onBackClick={handleBack}
            onLogoClick={() => navigate('/home2')}
            />
            <div className="main-content">   
            <div className="container layout-sm ">
                 <div className="page-title text-title">Profile</div>
                    <div className="profile-section">
                        <form onSubmit={handleSubmit} className="form">
                            <div className="form-input">
                                <label className="input-label text-lg" htmlFor="email">Email address <p className="input-subtitle text-sm">Cannot be changed</p></label>
                                <input 
                                    className="text-input text-lg" 
                                    type="email" 
                                    name="email" 
                                    id="email" 
                                    value={email}
                                    disabled
                                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                                />
                            </div>
                            <div className="form-input">
                                <label className="input-label text-lg" htmlFor="name">First name or Nickname <span className="optional-text">(optional)</span> </label>
                                <input 
                                    className="text-input text-lg" 
                                    type="text" 
                                    name="name" 
                                    id="name"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Enter your name"
                                />
                            </div>

                            <div className="standalone-checkbox">
                                <input 
                                    type="checkbox" 
                                    id="email-updates" 
                                    name="email-updates"
                                    checked={emailUpdates}
                                    onChange={(e) => setEmailUpdates(e.target.checked)}
                                />
                                <label className="input-label text-lg" htmlFor="email-updates">Send me email about updates</label>
                            </div>
                            
                            {message && (
                                <div className="validation-box">
                                    <p className="text-sm pri-color" style={{textAlign:"center"}}>{message}</p>
                                </div>
                            )}
                            
                            <div className="form-footer">
                                <input 
                                    className="md-button text-lg" 
                                    type="submit" 
                                    value={saving ? "Saving..." : "Save changes"}
                                    disabled={saving}
                                />
                            </div>
                         </form>
                    </div>
                    <div className="menu-container" style={{borderRadius: "16px"}}>
                            <ul className="list" style={{padding: " 8px"}}>
                                 <li className="menu-item">
                            <a href="/delete-account" id="delete-account" className="menu-link text-lg" style={{borderRadius: "8px", padding: " 8px"}}>
                            <div className="menu-tag"> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 9L9 15M9 9L15 15M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#F04D4F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
Delete account</div><svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1 11L6 6L1 1" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</a>
                        </li>
                        </ul>

                         </div>
            </div>
            </div>
            </div>
    );
}

export default Profile;