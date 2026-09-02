"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Logo from "@/components/Logo";
import { APP_CITY } from "@/lib/brand";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-paper">
        <div className="popby-card p-8 max-w-sm w-full">
          <h1 className="text-2xl text-navy mb-2 font-display">Check your email</h1>
          <p className="text-muted text-sm leading-relaxed">
            Magic link sent to <strong className="text-ink">{email}</strong>.
          </p>
        </div>
      </main>
    );
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
          <p className="text-sm text-muted mb-8">
            Startup people in {APP_CITY}. Real hangouts, not LinkedIn DMs.
          </p>
          <form onSubmit={handleLogin} className="popby-card p-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-navy">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@startup.com"
                className="popby-input"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="popby-btn popby-btn-accent w-full disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send magic link"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
