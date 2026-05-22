import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import logoUrl from "@/assets/halagpt-logo.png";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/chat",
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: search.redirect });
  },
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in — HalaGPT" },
      { name: "description", content: "Sign in to HalaGPT to save your chats." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: search.redirect });
    });
    return () => subscription.unsubscribe();
  }, [navigate, search.redirect]);

  const signIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: typeof window !== "undefined" ? window.location.origin + "/chat" : undefined,
      });
      if (result.error) {
        setError(result.error instanceof Error ? result.error.message : String(result.error));
        setLoading(false);
        return;
      }
      if (result.redirected) return; // browser redirects to Google
      navigate({ to: search.redirect });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh bg-black text-white overflow-hidden">
      {/* Ambient gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-[oklch(0.55_0.18_25)] opacity-20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[480px] w-[480px] rounded-full bg-[oklch(0.45_0.15_270)] opacity-20 blur-[120px]" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6">
        <img src={logoUrl} alt="HalaGPT" className="h-14 w-14 rounded-2xl shadow-lg" />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Welcome to HalaGPT</h1>
        <p className="mt-2 text-center text-sm text-white/60">
          Sign in to start chatting with Hala — a Palestinian AI with vision, OCR, and rich markdown.
        </p>

        <button
          onClick={signIn}
          disabled={loading}
          className="mt-10 inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white px-5 py-3.5 text-[15px] font-medium text-black shadow-[0_8px_30px_-12px_rgba(255,255,255,0.4)] transition active:scale-[0.99] hover:bg-white/95 disabled:opacity-60"
        >
          <GoogleMark />
          {loading ? "Opening Google…" : "Continue with Google"}
        </button>

        {error && (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </p>
        )}

        <p className="mt-8 text-center text-[11px] leading-relaxed text-white/40">
          By continuing you agree to HalaGPT's Terms and Privacy. We only use your Google profile to identify you — no posting, no contacts.
        </p>
      </main>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C40.8 35.2 44 30 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
