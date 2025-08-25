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

  useEffect(() => {
    if (!loading && user) navigate(routeByRole(role ?? null), { replace: true });
  }, [user, role, loading, navigate]);

  const canSubmit = useMemo(
    () => Boolean(email.trim()) && password.length >= 6 && !submitting,
    [email, password, submitting]
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onMagicLink() {
    if (!email) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
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
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex flex-col">

      {/* Brand bar w/ safe area padding for iOS */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200/60 dark:border-slate-800/60
                         pt-[env(safe-area-inset-top)]">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-2">
          <div className="text-2xl">🐾</div>
          <div className="font-bold tracking-tight text-slate-900 dark:text-slate-100 text-lg">
            EchoPath
          </div>
          <div className="ml-auto hidden md:block text-sm text-slate-500 dark:text-slate-400">
            Learning language through play &amp; friendship
          </div>
        </div>
      </header>

      {/* Main area: 2 columns on desktop, stacked on mobile */}
      <main className="flex-1 grid md:grid-cols-2 items-center mx-auto max-w-7xl w-full px-4 gap-8
                       pb-[env(safe-area-inset-bottom)]">
        {/* Left “hero” column (hidden on very small screens to keep focus) */}
        <section className="hidden md:block">
          <div className="max-w-md">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
              Welcome to <span className="text-blue-600">EchoPath</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              An immersive learning companion that helps children with autism
              build communication skills—alongside their favorite virtual pet.
            </p>

            <ul className="mt-6 grid gap-3 text-slate-700 dark:text-slate-200">
              <li className="flex items-center gap-2"><span>🎯</span> Personalized lessons</li>
              <li className="flex items-center gap-2"><span>📊</span> Progress tracking</li>
              <li className="flex items-center gap-2"><span>🎮</span> Interactive learning</li>
            </ul>
          </div>
        </section>

        {/* Right auth card */}
        <section className="w-full">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800
                          bg-white dark:bg-slate-950 p-6 shadow-sm mx-auto">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 py-2 rounded-lg border text-sm font-semibold
                  ${mode === "login"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 py-2 rounded-lg border text-sm font-semibold
                  ${mode === "signup"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"}`}
              >
                Sign up
              </button>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="grid gap-3">
              <label className="grid gap-1 text-sm text-slate-700 dark:text-slate-200">
                Email
                <input
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900
                             px-3 py-3 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className="grid gap-1 text-sm text-slate-700 dark:text-slate-200">
                Password
                <input
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900
                             px-3 py-3 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>

              {error && (
                <div
                  className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950
                             text-red-800 dark:text-red-200 px-3 py-2 text-sm"
                  role="alert"
                  aria-live="assertive"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="mt-1 inline-flex items-center justify-center rounded-lg bg-slate-900 text-white
                           px-4 py-3 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Please wait…" : mode === "login" ? "Login" : "Create account"}
              </button>

              {mode === "login" && (
                <button
                  type="button"
                  onClick={onMagicLink}
                  disabled={!email || submitting}
                  className="text-blue-600 dark:text-blue-400 text-sm justify-self-start disabled:opacity-60"
                  title="Send a one-time magic link to your email"
                >
                  Or use magic link
                </button>
              )}
            </form>
          </div>
        </section>
      </main>

      {/* Tiny footer hint */}
      <footer className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        Built for therapists, daycares, and families
      </footer>
    </div>
  );
}