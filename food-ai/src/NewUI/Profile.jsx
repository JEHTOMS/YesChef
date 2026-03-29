import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { API_ENDPOINTS } from '../config.js';
import '../pages/Home.css';
import '../index.css';
import NewNavbar from "../NewUI/NewNavbar.jsx";
import './Menu.css';
import './Profile.css';
import '../components/Shimmer.css';


function Profile() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isSetup = searchParams.get('setup') === '1';
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [emailUpdates, setEmailUpdates] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [deleteExpanded, setDeleteExpanded] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

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
                    // Use DB value, but fall back to localStorage flag for fresh signups
                    const pendingUpdates = localStorage.getItem('pending_email_updates');
                    setEmailUpdates(profile.email_updates || pendingUpdates === 'true');
                }
            }
            setLoading(false);
        };
        
        fetchUserData();
    }, []);
    
    const handleBack = () => {
        navigate(-1);
    };

    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        if (deleteConfirmText !== 'DELETE') {
            setDeleteError('Please type DELETE to confirm');
            return;
        }
        setDeleting(true);
        setDeleteError('');

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            setDeleteError('Not logged in');
            setDeleting(false);
            return;
        }

        try {
            const res = await fetch(API_ENDPOINTS.DELETE_ACCOUNT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: session.user.id }),
            });
            const data = await res.json();
            if (!res.ok) {
                setDeleteError(data.error || 'Failed to delete account');
                setDeleting(false);
                return;
            }
            // Sign out and redirect to home
            await supabase.auth.signOut({ scope: 'local' });
            navigate('/');
        } catch (err) {
            setDeleteError('Something went wrong. Please try again.');
            setDeleting(false);
        }
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
            if (isSetup) {
                navigate('/');
                return;
            }
            setMessage('Profile saved!');
        }
        setSaving(false);
    };
    
    if (loading) {
        return (
            <div className="page">
                <NewNavbar showBackButton onBackClick={handleBack} />
                <div className="main-content">
                    <div className="container layout-sm">
                        <div className="shimmer-line" style={{ width: '120px', height: '32px', borderRadius: '8px', marginBottom: '16px' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div className="shimmer-line" style={{ width: '140px', height: '14px' }} />
                                <div className="shimmer-line" style={{ width: '100%', height: '48px', borderRadius: '16px', maxWidth: '100%' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div className="shimmer-line" style={{ width: '200px', height: '14px' }} />
                                <div className="shimmer-line" style={{ width: '100%', height: '48px', borderRadius: '16px', maxWidth: '100%' }} />
                            </div>
                            <div className="shimmer-line" style={{ width: '240px', height: '14px' }} />
                            <div className="shimmer-line" style={{ width: '130px', height: '42px', borderRadius: '200px', alignSelf: 'flex-end' }} />
                        </div>
                        <div className="shimmer-line" style={{ width: '100%', height: '48px', borderRadius: '16px', maxWidth: '100%', marginTop: '24px' }} />
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
            onLogoClick={() => navigate('/')}
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
                    <div className="menu-container" style={{borderRadius: deleteExpanded ? "32px" : "16px"}}>
                            <ul className="list" style={{padding: deleteExpanded ? "16px" : "8px"}}>
                                 <li className="menu-item">
                            <div id="delete-account" className={`menu-link text-lg${deleteExpanded ? ' expanded' : ''}`} style={{borderRadius: "8px", padding: "8px", marginBottom: deleteExpanded ? "8px" : "0", cursor: deleteExpanded ? "default" : "pointer", pointerEvents: deleteExpanded ? "none" : "auto"}} onClick={() => setDeleteExpanded(true)}>
                            <div className="menu-tag" style={{alignItems: "flex-start"}}> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 9L9 15M9 9L15 15M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#F04D4F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
<div className="delete-container">Delete account{deleteExpanded && <p className="text-sm" style={{color: "#737373"}}>Once you delete your account, there is no going back. Please be certain.</p>}</div>
</div>{!deleteExpanded && <svg style={{rotate:"90deg"}} width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1 11L6 6L1 1" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>}
</div>
{deleteExpanded && (
 <form className="form" onSubmit={handleDeleteAccount}>
    <div className="form-input">
                                <div className="error-validation text-sm"><p>This action cannot be undone. This will permanently delete your account and remove all your data. Please type <b>DELETE</b> to confirm</p></div>
                                {deleteError && (
                                    <p className="text-sm" style={{color: "#F04D4F"}}>{deleteError}</p>
                                )}
                                <input
                                    className="text-input text-lg"
                                    type="text"
                                    name="confirm-delete"
                                    id="confirm-delete"
                                    placeholder="Type DELETE to confirm"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                />
                                 <div className="form-footer" style={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: "8px"}}>
                                <input
                                    className="md-button text-lg"
                                    style={{background: "#E73235"}}
                                    type="submit"
                                    value={deleting ? "Deleting..." : "Confirm delete account"}
                                    disabled={deleting}
                                />
                                <button className="md-button text-lg"
                                    style={{background: "#F3F3F3", color: "#000", marginLeft: "8px"}}
                                    type="button"
                                    onClick={() => setDeleteExpanded(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                            </div>

 </form>
)}
                        </li>
                        </ul>

                         </div>
            </div>
            </div>
            </div>
    );
}

export default Profile;