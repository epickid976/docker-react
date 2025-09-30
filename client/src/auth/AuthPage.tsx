import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "./AuthContext";
import { routeByRole } from "./routeByRole";
import { useNavigate, useLocation } from "react-router-dom";

type ViewMode = "login" | "signup" | "check-email" | "unconfirmed" | "confirmed";

export default function AuthPage() {
  const [mode, setMode] = useState<ViewMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<"signup" | "login" | null>(null);

  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authed, route by role
  useEffect(() => {
    if (!loading && user) {
      navigate(routeByRole(role ?? null), { replace: true });
    }
  }, [user, role, loading, navigate]);

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

    if (looksConfirmed) {
      setMode("confirmed");
      setInfo("Your email address has been confirmed. You can log in now.");
      // Clear any stale errors
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

    try {
      if (mode === "login" || mode === "confirmed") {
        setLastAction("login");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // Heuristic for unconfirmed-email flow
          const msg = (error.message || "").toLowerCase();
          if (msg.includes("confirm") || msg.includes("verified") || msg.includes("validate")) {
            showUnconfirmed("Looks like your email hasn’t been confirmed yet.");
          } else {
            setError(error.message ?? "Login failed.");
          }
          return;
        }
        // Success will be handled by useAuth redirect above.
      } else {
        // SIGN UP
        setLastAction("signup");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Redirect back to THIS page
            emailRedirectTo: window.location.origin + "/auth?from=email",
          },
        });
        if (error) {
          setError(error.message ?? "Could not create account.");
          return;
        }
        showCheckEmail("Almost there! Check your inbox to confirm your email.");
      }
    } catch (err: any) {
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
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex flex-col">
      {brand}

      <main className="flex-1 grid md:grid-cols-2 items-center mx-auto max-w-7xl w-full px-4 gap-8 pb-[env(safe-area-inset-bottom)]">
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
            {["login", "signup", "confirmed"].includes(mode) && (
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
            {(mode === "login" || mode === "signup" || mode === "confirmed") && (
              <form onSubmit={onSubmit} className="grid gap-3">
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

                <label className="grid gap-1 text-sm text-slate-700 dark:text-slate-200">
                  Password
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
                  disabled={!email || password.length < 6 || submitting}
                  className="mt-1 inline-flex items-center justify-center rounded-lg bg-slate-900 text-white px-4 py-3 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? "Please wait…"
                    : mode === "login" || mode === "confirmed"
                    ? "Login"
                    : "Create account"}
                </button>

                {(mode === "login" || mode === "confirmed") && (
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

            {mode === "unconfirmed" && (
              <div className="grid gap-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Email not confirmed
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Your account exists, but the email <span className="font-medium">{email}</span>{" "}
                  hasn’t been confirmed yet. Please click the confirmation link we sent. You can
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