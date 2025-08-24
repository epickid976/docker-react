import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

import { supabase } from "../supabaseClient"

type AuthContextType = {
    user: any | null;
    role: "SYSTEM_ADMIN" | "INSTITUTION_ADMIN" | "TEACHER" | "PARENT" | null;
    tenantId: string | null;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    tenantId: null,
    loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [role, setRole] = useState<AuthContextType["role"]>(null);
    const [tenantId, setTenantId] = useState<string | null>(null);
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
        const loadMembership = async () => {
            if (!user) {
                setRole(null);
                setTenantId(null);
                setLoading(false);
                return;
            }

            // Fetch membership for this user
            const { data: memberships} = await supabase
                .from("membership")
                .select("role, tenant_id")
                .eq("user_id", user.id)

            if (memberships && memberships.length > 0) {
                setRole(memberships[0].role);
                setTenantId(memberships[0].tenant_id);
            } else {
                // maybe a system_admin?
                const { data: sys } = await supabase
                    .from("system_admin")
                    .select("user_id")
                    .eq("user_id", user.id)

                if (sys && sys.length > 0 ) {
                    setRole("SYSTEM_ADMIN");
                }
            }
            setLoading(false);
        };

        loadMembership();
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, role, tenantId, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);