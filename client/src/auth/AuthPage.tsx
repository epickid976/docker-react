// src/auth/AuthPage.tsx
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "./AuthContext";
import { routeByRole } from "./routeByRole";
import { useNavigate } from "react-router-dom";

type Mode = "login" | "signup";

export default function AuthPage() {
    const [mode, setMode] = useState<Mode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { user, role, loading } = useAuth();
    const navigate = useNavigate();

    // If already authed, bounce to the right place
    useEffect(() => {
        if (!loading && user) navigate(routeByRole(role ?? null), { replace: true });
    }, [user, role, loading, navigate]);

    const canSubmit = useMemo(
        () => email.trim() && password.length >= 6 && !submitting,
        [email, password, submitting]
    );

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        setError(null);

        try {
            if (mode === "login") {
                const { error } = await supabase.auth.signInWithPassword({ email, password});
                if (error) throw error;
                // AuthContext onAuthStateChange will take over and redirect
            } else {
                // SIGNUP
                // If you enabled email confirmations in Supabase Auth > SMTP,
                // user must confirm via email before session exists.
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                // Optional: let them know to check inbox if confirm-on-signup is enabled
            }
        } catch (err: any) {
            setError(err?.message ?? "Something went wrong.");
        } finally {
            setSubmitting(false);
        }
    }

    // Optional: Magic link login
    async function onMagicLink() {
        setSubmitting(true);
        setError(null);
        try {
            const {error} = await supabase.auth.signInWithOtp({
                email,
                options: { emailRedirectTo: window.location.origin },
            });
            if (error) throw error;
            alert("Magic link sent! Check your inbox.");
        } catch (err: any) {
            setError(err?.message ?? "Could not send magic link.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="auth-wrap">
            <div className="auth-card">
                <div className="tabs">
                    <button
                        className={mode === "login" ? "active" : ""}
                        onClick={() => setMode("login")}
                    >
                        Login
                    </button>
                    <button
                        className={mode === "signup" ? "active" : ""}
                        onClick={() => setMode("signup")}
                    >
                        Sign up
                    </button>
                </div>

                <form onSubmit={onSubmit} className="auth-form">
                    <label>
                        Email
                        <input
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@example.com"
                        />
                    </label>

                    <label>
                        Password
                        <input
                            type="password"
                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            minLength={6}
                        />
                    </label>

                    {error && <div className="error">{error}</div>}

                    <button type="submit" disabled={!canSubmit}>
                        {submitting ? "Please wait…" : mode === "login" ? "Login" : "Create account"}
                    </button>

                    {mode === "login" && (
                        <button
                            type="button"
                            className="linklike"
                            onClick={onMagicLink}
                            disabled={!email || submitting}
                            title="Send a one-time magic link to your email"
                        >
                            Or use magic link
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}