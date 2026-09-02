"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "ok" | "error" | "duplicate";

export default function WaitlistForm({ className = "" }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setStatus("error");
      setMessage("Need a real email.");
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "landing" }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        duplicate?: boolean;
        emailSent?: boolean;
      };

      if (res.ok && data.ok) {
        setStatus(data.duplicate ? "duplicate" : "ok");
        setMessage(
          data.duplicate
            ? "You're already on the list."
            : data.emailSent
              ? "You're on the list. Check your inbox for a quick confirmation."
              : "You're on the list. We'll email when early access opens in London."
        );
        setEmail("");
        return;
      }

      setStatus("error");
      setMessage(data.error ?? "Something broke. Try again in a minute.");
    } catch {
      setStatus("error");
      setMessage("Couldn't reach the server. Check your connection.");
    }
  }

  if (status === "ok" || status === "duplicate") {
    return (
      <div className={className}>
        <p className="text-base text-navy font-medium leading-relaxed">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
      <label htmlFor="waitlist-email" className="block text-sm font-medium text-navy">
        Early access waitlist
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id="waitlist-email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="you@company.com"
          className="popby-input flex-1"
          disabled={status === "loading"}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="popby-btn popby-btn-accent sm:w-auto disabled:opacity-50"
        >
          {status === "loading" ? "Joining…" : "Join waitlist"}
        </button>
      </div>
      {message && status === "error" && (
        <p className="text-sm text-red-600">{message}</p>
      )}
      <p className="text-xs text-muted leading-relaxed">
        London only for now. No city-wide live map yet. Leave an email and try the
        full demo below.
      </p>
    </form>
  );
}
