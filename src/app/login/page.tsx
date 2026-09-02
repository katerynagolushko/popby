"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Logo from "@/components/Logo";
import { APP_CITY } from "@/lib/brand";

type Step = "choose" | "email" | "code";

function oauthUnavailableMessage(provider: "google" | "apple") {
  return `${provider === "google" ? "Google" : "Apple"} sign-in isn’t enabled on this project yet. Use email, or turn the provider on in Supabase Auth.`;
}

export default function LoginPage() {
  const [step, setStep] = useState<Step>("choose");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function signInWithProvider(provider: "google" | "apple") {
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });
    setLoading(false);
    if (authError) {
      const msg = authError.message.toLowerCase();
      if (
        msg.includes("provider is not enabled") ||
        msg.includes("unsupported provider")
      ) {
        setError(oauthUnavailableMessage(provider));
      } else {
        setError(authError.message);
      }
    }
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/onboarding`;
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectTo,
      },
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setInfo(
      "Enter the 6-digit code from the email. If you only got a link, open it on this device so it returns you to Popby, not localhost."
    );
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    window.location.href = "/auth/callback?next=/onboarding";
  }

  return (
    <main className="min-h-screen flex flex-col bg-paper">
      <header className="p-6">
        <Link href="/">
          <Logo size="sm" />
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="max-w-sm w-full">
          <h1 className="text-3xl text-navy mb-2 font-display">Sign in</h1>
          <p className="text-lg text-navy/70 mb-8">
            Founder access for the real app. Everyone else: join the waitlist or
            try the demo from the home page. {APP_CITY} early access only.
          </p>

          {step === "choose" && (
            <div className="popby-card p-6 space-y-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => signInWithProvider("google")}
                className="popby-btn popby-btn-navy w-full disabled:opacity-50"
              >
                Continue with Google
              </button>
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-paper-3" />
                <span className="text-lg text-navy/70">or</span>
                <div className="h-px flex-1 bg-paper-3" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setError(null);
                }}
                className="popby-btn popby-btn-ghost w-full"
              >
                Continue with email
              </button>
              {error && <p className="text-lg text-red-600">{error}</p>}
            </div>
          )}

          {step === "email" && (
            <form onSubmit={sendCode} className="popby-card p-6 space-y-4">
              <button
                type="button"
                onClick={() => {
                  setStep("choose");
                  setError(null);
                }}
                className="text-lg text-navy/70 hover:text-navy min-h-[52px]"
              >
                ← Back
              </button>
              <div>
                <label htmlFor="email" className="block text-lg font-medium mb-1.5 text-navy">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@startup.com"
                  className="popby-input"
                />
              </div>
              {error && <p className="text-lg text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="popby-btn popby-btn-accent w-full disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send code"}
              </button>
              <p className="text-lg text-navy/70 leading-relaxed">
                We email a 6-digit code. Stay on this screen; no link hopping.
              </p>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={verifyCode} className="popby-card p-6 space-y-4">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError(null);
                  setInfo(null);
                }}
                className="text-lg text-navy/70 hover:text-navy min-h-[52px]"
              >
                ← Back
              </button>
              <div>
                <p className="text-lg text-navy/70 mb-3">
                  Code sent to <strong className="text-ink">{email}</strong>
                </p>
                {info && <p className="text-lg text-navy/70 mb-3 leading-relaxed">{info}</p>}
                <label htmlFor="code" className="block text-lg font-medium mb-1.5 text-navy">
                  6-digit code
                </label>
                <input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="123456"
                  className="popby-input tracking-[0.3em] text-center text-lg font-medium"
                />
              </div>
              {error && <p className="text-lg text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="popby-btn popby-btn-accent w-full disabled:opacity-50"
              >
                {loading ? "Checking…" : "Verify & continue"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
