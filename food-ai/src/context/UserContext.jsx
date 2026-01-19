import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const UserContext = createContext();

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

export const UserProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Fetch display name from localStorage or Supabase
    const fetchDisplayName = async (userId) => {
        // Try to get from localStorage first for instant display
        const cachedName = localStorage.getItem('user_display_name');
        if (cachedName) {
            setDisplayName(cachedName);
        }

        // Fetch from Supabase to ensure it's up to date
        const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', userId)
            .single();
        
        if (profile?.display_name) {
            // Only update if different from cached to prevent flicker
            if (profile.display_name !== cachedName) {
                setDisplayName(profile.display_name);
                localStorage.setItem('user_display_name', profile.display_name);
            }
        } else if (!profile?.display_name && cachedName) {
            // Clear cached name if no display name in profile
            localStorage.removeItem('user_display_name');
            setDisplayName('');
        }
    };

    // Listen for auth state changes
    useEffect(() => {
        const initializeAuth = async () => {
            setLoading(true);
            
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            
            if (session?.user) {
                await fetchDisplayName(session.user.id);
            } else {
                setDisplayName('');
                localStorage.removeItem('user_display_name');
            }
            
            setLoading(false);
            setInitialLoadComplete(true);
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            if (session?.user) {
                await fetchDisplayName(session.user.id);
            } else {
                setDisplayName('');
                localStorage.removeItem('user_display_name');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const updateDisplayName = async (newName) => {
        if (!session?.user?.id) return;

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: session.user.id,
                display_name: newName,
                updated_at: new Date().toISOString(),
            });

        if (!error) {
            setDisplayName(newName);
            localStorage.setItem('user_display_name', newName);
        }
    };

    const getProfileInitial = () => {
        // Don't show email fallback during initial load to prevent flicker
        if (!initialLoadComplete || loading) {
            return displayName?.[0]?.toUpperCase() || '';
        }
        return (displayName?.[0] || session?.user?.email?.[0])?.toUpperCase() || '';
    };

    return (
        <UserContext.Provider value={{ 
            session, 
            displayName, 
            loading,
            updateDisplayName,
            getProfileInitial
        }}>
            {children}
        </UserContext.Provider>
    );
};
