import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

import { supabase } from "../supabaseClient"

type AuthContextType = {
    user: any | null;
    role: "SYSTEM_ADMIN" | "INSTITUTION_ADMIN" | "TEACHER" | "PARENT" | null;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [role, setRole] = useState<AuthContextType["role"]>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Load current session
        const session = supabase.auth.getSession();
        session.then(({ data }) => {
            setUser(data.session?.user ?? null);
        });

        // 2. Listen for login/logout
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => listener.subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const loadUserRole = async () => {
            if (!user) {
                setRole(null);
                setLoading(false);
                return;
            }

            // TODO: Update this logic for GoutDeau user roles
            // For now, set a default role for authenticated users
            setRole("PARENT"); // Default role for water tracking app
            setLoading(false);
        };

        loadUserRole();
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, role, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);