"use client";

import { useState } from "react";
import { COMPANY_TYPES, ROLES } from "@/lib/constants";
import type { CompanyType, Role } from "@/lib/types";

type Status = "idle" | "loading" | "ok" | "error" | "duplicate";

export default function WaitlistForm({ className = "" }: { className?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [companyType, setCompanyType] = useState<CompanyType | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setStatus("error");
      setMessage("Need a name.");
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setStatus("error");
      setMessage("Need a real email.");
      return;
    }
    if (!role) {
      setStatus("error");
      setMessage("Pick a role.");
      return;
    }
    if (!companyType) {
      setStatus("error");
      setMessage("Pick a company type.");
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          role,
          company_type: companyType,
          source: "landing",
        }),
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
        setName("");
        setEmail("");
        setRole(null);
        setCompanyType(null);
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
      <div className={className} id="waitlist">
        <p className="text-lg text-navy font-medium leading-relaxed">{message}</p>
      </div>
    );
  }

  return (
    <form
      id="waitlist"
      onSubmit={handleSubmit}
      className={`space-y-6 ${className}`}
    >
      <div>
        <label
          htmlFor="waitlist-name"
          className="block text-base font-medium text-navy mb-2"
        >
          Name
        </label>
        <input
          id="waitlist-name"
          type="text"
          name="name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="Your first name"
          className="popby-input w-full text-base"
          disabled={status === "loading"}
          maxLength={80}
        />
      </div>

      <div>
        <label
          htmlFor="waitlist-email"
          className="block text-base font-medium text-navy mb-2"
        >
          Email
        </label>
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
          className="popby-input w-full text-base"
          disabled={status === "loading"}
        />
      </div>

      <div>
        <p className="text-base font-medium text-navy mb-2.5">I am a…</p>
        <div className="flex flex-wrap gap-2.5">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              disabled={status === "loading"}
              onClick={() => {
                setRole(r.value);
                if (status === "error") setStatus("idle");
              }}
              className={`popby-chip text-sm sm:text-base py-2.5 px-3.5 ${
                role === r.value ? "popby-chip-selected" : ""
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-base font-medium text-navy mb-2.5">Kind of company</p>
        <div className="flex flex-wrap gap-2.5">
          {COMPANY_TYPES.map((c) => (
            <button
              key={c.value}
              type="button"
              disabled={status === "loading"}
              onClick={() => {
                setCompanyType(c.value);
                if (status === "error") setStatus("idle");
              }}
              className={`popby-chip text-sm sm:text-base py-2.5 px-3.5 ${
                companyType === c.value ? "popby-chip-selected" : ""
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="popby-btn popby-btn-accent w-full sm:w-auto text-base px-6 py-3.5 disabled:opacity-50"
      >
        {status === "loading" ? "Joining…" : "Join waitlist"}
      </button>

      {message && status === "error" && (
        <p className="text-base text-red-600">{message}</p>
      )}
      <p className="text-base text-muted leading-relaxed">
        London only for now. No city-wide live map yet.
      </p>
    </form>
  );
}
