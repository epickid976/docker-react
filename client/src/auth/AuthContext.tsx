import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

import { supabase } from "../supabaseClient"
import { HeightUnit, WeightUnit } from "../utils/unitConversions";

export interface UserProfile {
    user_id: string;
    display_name?: string | null;
    height_cm?: number | null;
    weight_kg?: number | null;
    unit_preference: 'ml' | 'oz' | 'cup' | 'bottle';
    height_unit: HeightUnit;
    weight_unit: WeightUnit;
    timezone: string;
    created_at: string;
    updated_at: string;
}

type AuthContextType = {
    user: any | null;
    profile: UserProfile | null;
    loading: boolean;
    isProfileComplete: boolean;
    needsProfileSetup: boolean;
    setProfile: (profile: UserProfile | null) => void;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    isProfileComplete: false,
    needsProfileSetup: false,
    setProfile: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Check if profile is complete - temporarily more lenient for testing
    const isProfileComplete = profile ? !!(
        profile.display_name && 
        profile.height_cm && 
        profile.weight_kg
        // Temporarily removed height_unit, weight_unit, timezone checks
    ) : false;
    const needsProfileSetup = !loading && user && !isProfileComplete;


    useEffect(() => {
        
        // 1. Load current session
        const session = supabase.auth.getSession();
        session.then(({ data, error }) => {
            setUser(data.session?.user ?? null);
        });

        // 2. Listen for login/logout
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
        });

        return () => listener.subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const loadUserProfile = async () => {
            
            if (!user) {
                setProfile(null);
                setLoading(false);
                return;
            }

            try {
                

                // Load user profile from the profiles table
                const { data: profileData, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();


                if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                    console.error('Error loading profile:', error);
                    setProfile(null);
                } else {
                    setProfile(profileData);
                }
            } catch (err) {
                console.error('AuthContext: Error in loadUserProfile:', err);
            } finally {
                setLoading(false);
            }
        };

        loadUserProfile();
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, profile, loading, isProfileComplete, needsProfileSetup, setProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);