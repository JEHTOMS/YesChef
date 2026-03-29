import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
    const [credits, setCredits] = useState(null);
    const [subscriptionStatus, setSubscriptionStatus] = useState('free');
    const [subscriptionTier, setSubscriptionTier] = useState(null);
    const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
    const [currentPeriodEnd, setCurrentPeriodEnd] = useState(null);
    const [loading, setLoading] = useState(true);

    const isPro = subscriptionStatus === 'active';

    // Fetch profile data (display name, credits, subscription) from Supabase
    const fetchProfile = useCallback(async (userId) => {
        // Try to get display name from localStorage first for instant display
        const cachedName = localStorage.getItem('user_display_name');
        if (cachedName) {
            setDisplayName(cachedName);
        }

        // Fetch full profile from Supabase (retry once for new signups where row may not exist yet)
        let { data: profile } = await supabase
            .from('profiles')
            .select('display_name, credits, subscription_status, subscription_tier, cancel_at_period_end, subscription_current_period_end')
            .eq('id', userId)
            .single();

        if (!profile) {
            // Profile row doesn't exist yet (new signup) — create it with default 20 credits
            const { data: newProfile } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    credits: 20,
                    subscription_status: 'free',
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'id' })
                .select('display_name, credits, subscription_status, subscription_tier, cancel_at_period_end, subscription_current_period_end')
                .single();
            profile = newProfile;
        }

        if (profile) {
            // Display name
            if (profile.display_name) {
                if (profile.display_name !== cachedName) {
                    setDisplayName(profile.display_name);
                    localStorage.setItem('user_display_name', profile.display_name);
                }
            } else if (cachedName) {
                localStorage.removeItem('user_display_name');
                setDisplayName('');
            }

            // Credits & subscription
            if (profile.credits != null) setCredits(profile.credits);
            if (profile.subscription_status) setSubscriptionStatus(profile.subscription_status);
            setSubscriptionTier(profile.subscription_tier || null);
            setCancelAtPeriodEnd(profile.cancel_at_period_end || false);
            setCurrentPeriodEnd(profile.subscription_current_period_end || null);
        }

        // Apply pending email_updates preference from signup
        const pendingUpdates = localStorage.getItem('pending_email_updates');
        if (pendingUpdates === 'true') {
            const applyUpdate = async () => {
                const { error } = await supabase
                    .from('profiles')
                    .update({ email_updates: true })
                    .eq('id', userId);
                if (!error) {
                    localStorage.removeItem('pending_email_updates');
                }
                return !error;
            };

            if (profile) {
                await applyUpdate();
            } else {
                // Profile may not exist yet (new signup) — retry after delay
                setTimeout(async () => {
                    const success = await applyUpdate();
                    if (!success) {
                        // One more retry
                        setTimeout(applyUpdate, 3000);
                    }
                }, 2000);
            }
        }
    }, []);

    // Refresh profile data (call after purchases, saves, etc.)
    const refreshProfile = useCallback(async () => {
        if (!session?.user?.id) return;
        const { data: profile } = await supabase
            .from('profiles')
            .select('credits, subscription_status, subscription_tier, cancel_at_period_end, subscription_current_period_end')
            .eq('id', session.user.id)
            .single();

        if (profile) {
            if (profile.credits != null) setCredits(profile.credits);
            if (profile.subscription_status) setSubscriptionStatus(profile.subscription_status);
            setSubscriptionTier(profile.subscription_tier || null);
            setCancelAtPeriodEnd(profile.cancel_at_period_end || false);
            setCurrentPeriodEnd(profile.subscription_current_period_end || null);
        }
    }, [session?.user?.id]);

    // Listen for auth state changes
    useEffect(() => {
        setLoading(true);

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setDisplayName('');
                setCredits(null);
                setSubscriptionStatus('free');
                setSubscriptionTier(null);
                setCancelAtPeriodEnd(false);
                setCurrentPeriodEnd(null);
                localStorage.removeItem('user_display_name');
            }
            setLoading(false);

            // Clean up auth params from URL after processing
            if (window.location.search.includes('code=') || window.location.hash.includes('access_token')) {
                window.history.replaceState({}, '', window.location.pathname);
            }
        });

        return () => subscription.unsubscribe();
    }, [fetchProfile]);

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
        return (displayName?.[0] || session?.user?.email?.[0])?.toUpperCase() || '';
    };

    return (
        <UserContext.Provider value={{
            session,
            displayName,
            credits,
            subscriptionStatus,
            subscriptionTier,
            cancelAtPeriodEnd,
            currentPeriodEnd,
            isPro,
            loading,
            updateDisplayName,
            getProfileInitial,
            refreshProfile,
        }}>
            {children}
        </UserContext.Provider>
    );
};
