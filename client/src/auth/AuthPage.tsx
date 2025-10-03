import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "./AuthContext";
// Remove routeByRole import since we're not using roles anymore
import { useNavigate, useLocation } from "react-router-dom";

type ViewMode = "login" | "signup" | "check-email" | "unconfirmed" | "confirmed" | "forgot-password" | "reset-password";

export default function AuthPage() {
  const [mode, setMode] = useState<ViewMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<"signup" | "login" | null>(null);

  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Test Supabase connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        console.log('Supabase connection test:', { data, error });
      } catch (err) {
        console.error('Supabase connection failed:', err);
      }
    };
    testConnection();
  }, []);

  // If already authed, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  // If redirected back after clicking confirmation link, show a nice banner.
  // (Configure Supabase Email Redirect URL to this page.)
  useEffect(() => {
    const search = new URLSearchParams(location.search);
    const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
    // Heuristics: Supabase often appends either search or hash params on return.
    const signups = ["type", "token_type", "access_token", "code"];
    const looksConfirmed =
      search.get("from") === "email" ||
      search.get("verified") === "true" ||
      search.get("type") === "signup" ||
      signups.some((k) => search.has(k) || hash.has(k));

    const looksPasswordReset = search.get("from") === "password-reset" ||
      search.get("type") === "recovery";

    if (looksConfirmed) {
      setMode("confirmed");
      setInfo("Your email address has been confirmed. You can log in now.");
      // Clear any stale errors
      setError(null);
      // Optional: clean URL (no params)
      window.history.replaceState({}, "", location.pathname);
    } else if (looksPasswordReset) {
      setMode("reset-password");
      setInfo("You can now set a new password for your account.");
      setError(null);
      // Optional: clean URL (no params)
      window.history.replaceState({}, "", location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = useMemo(
    () => Boolean(email.trim()) && password.length >= 6 && !submitting,
    [email, password, submitting]
  );

  const showCheckEmail = useCallback((hint?: string) => {
    setMode("check-email");
    setInfo(hint ?? "We sent a confirmation link to your email.");
    setError(null);
  }, []);

  const showUnconfirmed = useCallback((hint?: string) => {
    setMode("unconfirmed");
    setInfo(
      hint ??
        "Your email is not confirmed yet. Please confirm via the link we sent. You can resend it below."
    );
    setError(null);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setInfo(null);

    console.log('AuthPage: Submitting form, mode:', mode);

    try {
      if (mode === "login" || mode === "confirmed") {
        console.log('AuthPage: Attempting login...');
        setLastAction("login");
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        console.log('AuthPage: Login result:', { data, error });
        
        if (error) {
          // Heuristic for unconfirmed-email flow
          const msg = (error.message || "").toLowerCase();
          if (msg.includes("confirm") || msg.includes("verified") || msg.includes("validate")) {
            showUnconfirmed("Looks like your email hasn't been confirmed yet.");
          } else {
            setError(error.message ?? "Login failed.");
          }
          return;
        }
        console.log('AuthPage: Login successful, user:', data.user);
        // Success will be handled by useAuth redirect above.
      } else if (mode === "reset-password") {
        console.log('AuthPage: Updating password...');
        const { error } = await supabase.auth.updateUser({ password });
        console.log('AuthPage: Password update result:', { error });
        
        if (error) {
          setError(error.message ?? "Could not update password.");
          return;
        }
        
        setInfo("Password updated successfully! You can now log in with your new password.");
        setMode("login");
        setPassword("");
      } else {
        console.log('AuthPage: Attempting signup...');
        // SIGN UP
        setLastAction("signup");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Redirect back to THIS page
            emailRedirectTo: window.location.origin + "/auth?from=email",
          },
        });
        console.log('AuthPage: Signup result:', { data, error });
        
        if (error) {
          setError(error.message ?? "Could not create account.");
          return;
        }
        
        if (data.user && !data.session) {
          // User created but needs email confirmation
          console.log('AuthPage: User created, email confirmation required');
          showCheckEmail("Almost there! Check your inbox to confirm your email.");
        } else if (data.user && data.session) {
          // User created and immediately signed in (email confirmation disabled)
          console.log('AuthPage: User created and signed in immediately');
          // The auth state change will handle the redirect
        }
      }
    } catch (err: any) {
      console.error('AuthPage: Error in onSubmit:', err);
      setError(err?.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onMagicLink() {
    if (!email || submitting) return;
    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + "/auth?from=email" },
      });
      if (error) throw error;
      showCheckEmail("Magic link sent! Check your inbox.");
    } catch (err: any) {
      setError(err?.message ?? "Could not send magic link.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    if (!email || submitting) return;
    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      // Resend signup confirmation
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: window.location.origin + "/auth?from=email" },
      });
      if (error) throw error;
      setInfo("Confirmation email resent. Check your inbox.");
    } catch (err: any) {
      setError(err?.message ?? "Could not resend confirmation.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onForgotPassword() {
    if (!email || submitting) return;
    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      console.log('AuthPage: Sending password reset email...');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/auth?from=password-reset",
      });
      if (error) throw error;
      setInfo("Password reset email sent! Check your inbox and click the link to reset your password.");
    } catch (err: any) {
      console.error('AuthPage: Error sending password reset:', err);
      setError(err?.message ?? "Could not send password reset email.");
    } finally {
      setSubmitting(false);
    }
  }

  const brand = (
    <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200/60 dark:border-slate-800/60 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-2">
        <div className="text-2xl">💧</div>
        <div className="font-bold tracking-tight text-slate-900 dark:text-slate-100 text-lg">
          GoutDeau
        </div>
        <div className="ml-auto hidden md:block text-sm text-slate-500 dark:text-slate-400">
          Track your water, earn achievements
        </div>
      </div>
    </header>
  );

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {brand}

      <main className="flex-1 grid md:grid-cols-2 items-center mx-auto max-w-7xl w-full gap-8" style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}>
        {/* Left column */}
        <section className="hidden md:block">
          <div className="max-w-md">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
              Welcome to <span className="text-blue-600">GoutDeau</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              A water tracking app that gamifies health and hydration. Track your daily water intake,
              earn achievements, and build healthy habits with your personal water companion.
            </p>

            <ul className="mt-6 grid gap-3 text-slate-700 dark:text-slate-200">
              <li className="flex items-center gap-2">
                <span>🎯</span> Hit your hydration goals
              </li>
              <li className="flex items-center gap-2">
                <span>📊</span> Track your progress
              </li>
              <li className="flex items-center gap-2">
                <span>🎮</span> Earn achievements
              </li>
            </ul>
          </div>
        </section>

        {/* Right column: card that switches view modes */}
        <section className="w-full">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm mx-auto">
            {/* Tabs (hide in special modes) */}
            {["login", "signup", "confirmed", "forgot-password"].includes(mode) && (
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`flex-1 py-2 rounded-lg border text-sm font-semibold ${
                    mode === "login"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`flex-1 py-2 rounded-lg border text-sm font-semibold ${
                    mode === "signup"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  Sign up
                </button>
              </div>
            )}

            {/* Status banners */}
            {info && (
              <div className="mb-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 px-3 py-2 text-sm">
                {info}
              </div>
            )}
            {error && (
              <div
                className="mb-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 px-3 py-2 text-sm"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </div>
            )}

            {/* Main views */}
            {(mode === "login" || mode === "signup" || mode === "confirmed" || mode === "reset-password") && (
              <form onSubmit={onSubmit} className="grid gap-3">
                {mode !== "reset-password" && (
                  <label className="grid gap-1 text-sm text-slate-700 dark:text-slate-200">
                    Email
                    <input
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
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
                )}

                <label className="grid gap-1 text-sm text-slate-700 dark:text-slate-200">
                  {mode === "reset-password" ? "New Password" : "Password"}
                  <input
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    type="password"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder="••••••••"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={(mode !== "reset-password" && !email) || password.length < 6 || submitting}
                  className="mt-1 inline-flex items-center justify-center rounded-lg bg-slate-900 text-white px-4 py-3 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? "Please wait…"
                    : mode === "login" || mode === "confirmed"
                    ? "Login"
                    : mode === "reset-password"
                    ? "Update password"
                    : "Create account"}
                </button>

                {(mode === "login" || mode === "confirmed") && (
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={onMagicLink}
                      disabled={!email || submitting}
                      className="text-blue-600 dark:text-blue-400 text-sm disabled:opacity-60"
                      title="Send a one-time magic link to your email"
                    >
                      Or use magic link
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("forgot-password")}
                      className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </form>
            )}

            {mode === "check-email" && (
              <div className="grid gap-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Confirm your email
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  We sent a confirmation link to <span className="font-medium">{email}</span>.
                  Click the link to verify your account. Then return here to log in.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onResend}
                    disabled={!email || submitting}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm disabled:opacity-60"
                  >
                    Resend email
                  </button>
                  <a
                    href="https://mail.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm"
                  >
                    Open Gmail
                  </a>
                  <a
                    href="https://outlook.live.com/mail/0/inbox"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm"
                  >
                    Open Outlook
                  </a>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
                  <button
                    onClick={() => setMode("login")}
                    className="text-sm text-blue-600 dark:text-blue-400"
                  >
                    I’ve confirmed—go to login
                  </button>
                </div>
              </div>
            )}

            {mode === "forgot-password" && (
              <div className="grid gap-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Reset your password
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <form onSubmit={(e) => { e.preventDefault(); onForgotPassword(); }} className="grid gap-3">
                  <label className="grid gap-1 text-sm text-slate-700 dark:text-slate-200">
                    Email
                    <input
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
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
                  <button
                    type="submit"
                    disabled={!email || submitting}
                    className="mt-1 inline-flex items-center justify-center rounded-lg bg-slate-900 text-white px-4 py-3 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Sending..." : "Send reset link"}
                  </button>
                </form>
                <div className="text-center">
                  <button
                    onClick={() => setMode("login")}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Back to login
                  </button>
                </div>
              </div>
            )}


            {mode === "unconfirmed" && (
              <div className="grid gap-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Email not confirmed
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Your account exists, but the email <span className="font-medium">{email}</span>{" "}
                  hasn't been confirmed yet. Please click the confirmation link we sent. You can
                  resend it below.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onResend}
                    disabled={!email || submitting}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm disabled:opacity-60"
                  >
                    Resend confirmation
                  </button>
                  <button
                    onClick={() => setMode("login")}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm"
                  >
                    Back to login
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        Built for health-conscious individuals and families
      </footer>
    </div>
  );
}