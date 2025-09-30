import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

import { supabase } from "../supabaseClient"

type AuthContextType = {
    user: any | null;
    profile: any | null;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('AuthContext: Initializing auth...');
        
        // 1. Load current session
        const session = supabase.auth.getSession();
        session.then(({ data, error }) => {
            console.log('AuthContext: Session loaded:', { data, error });
            setUser(data.session?.user ?? null);
        });

        // 2. Listen for login/logout
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('AuthContext: Auth state changed:', { event, session });
            setUser(session?.user ?? null);
        });

        return () => listener.subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const loadUserProfile = async () => {
            console.log('AuthContext: Loading profile for user:', user);
            
            if (!user) {
                console.log('AuthContext: No user, setting loading to false');
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

                console.log('AuthContext: Profile loaded:', { profileData, error });

                if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                    console.error('Error loading profile:', error);
                }

                setProfile(profileData);
            } catch (err) {
                console.error('AuthContext: Error in loadUserProfile:', err);
            } finally {
                setLoading(false);
            }
        };

        loadUserProfile();
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, profile, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);