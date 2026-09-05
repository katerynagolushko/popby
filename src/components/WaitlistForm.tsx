"use client";

import { useState } from "react";
import Link from "next/link";
import { COMPANY_TYPES, ROLES } from "@/lib/constants";
import type { CompanyType, Role } from "@/lib/types";
import {
  WAITLIST_CITIES,
  WAITLIST_CITY_OTHER,
  parseCityCountry,
} from "@/lib/waitlist-cities";
import {
  isValidSocialLink,
  SOCIAL_LINK_ERROR,
} from "@/lib/waitlist-social";

type Status = "idle" | "loading" | "ok" | "error" | "duplicate";

export type WaitlistFormMode = "london" | "city";

type WaitlistFormProps = {
  className?: string;
  /** London early access vs “launch in my city” demand list */
  mode?: WaitlistFormMode;
};

const labelClass = "block text-lg font-medium text-navy mb-2.5";

export default function WaitlistForm({
  className = "",
  mode = "london",
}: WaitlistFormProps) {
  const isCity = mode === "city";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [companyType, setCompanyType] = useState<CompanyType | null>(null);
  const [citySelect, setCitySelect] = useState("");
  const [cityOther, setCityOther] = useState("");
  const [social, setSocial] = useState("");
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  function clearError() {
    if (status === "error") setStatus("idle");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedSocial = social.trim().slice(0, 200);
    const trimmedFeedback = feedback.trim().slice(0, 2000);

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
    if (!trimmedSocial || !isValidSocialLink(trimmedSocial)) {
      setStatus("error");
      setMessage(SOCIAL_LINK_ERROR);
      return;
    }

    let city: string | null = null;
    let country: string | null = null;

    if (isCity) {
      if (!citySelect) {
        setStatus("error");
        setMessage("Pick a city.");
        return;
      }
      if (citySelect === WAITLIST_CITY_OTHER) {
        const other = cityOther.trim().slice(0, 120);
        if (!other) {
          setStatus("error");
          setMessage("Type your city.");
          return;
        }
        const parsed = parseCityCountry(other);
        city = parsed.city;
        country = parsed.country;
      } else {
        const parsed = parseCityCountry(citySelect);
        city = parsed.city;
        country = parsed.country;
      }
    } else {
      city = "London";
      country = "United Kingdom";
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
          city,
          country,
          social: trimmedSocial,
          feedback: trimmedFeedback || null,
          source: isCity ? "city_waitlist" : "landing",
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
              : isCity
                ? "You're on the list. We'll email if we launch near you."
                : "You're on the list. We'll email when early access opens in London."
        );
        setName("");
        setEmail("");
        setRole(null);
        setCompanyType(null);
        setCitySelect("");
        setCityOther("");
        setSocial("");
        setFeedback("");
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
        <label htmlFor="waitlist-name" className={labelClass}>
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
            clearError();
          }}
          placeholder="Your first name"
          className="popby-input w-full text-lg min-h-[54px]"
          disabled={status === "loading"}
          maxLength={80}
        />
      </div>

      <div>
        <label htmlFor="waitlist-email" className={labelClass}>
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
            clearError();
          }}
          placeholder="you@company.com"
          className="popby-input w-full text-lg min-h-[54px]"
          disabled={status === "loading"}
        />
      </div>

      {isCity && (
        <div>
          <label htmlFor="waitlist-city" className={labelClass}>
            What city are you in?
          </label>
          <select
            id="waitlist-city"
            name="city"
            required
            value={citySelect}
            onChange={(e) => {
              setCitySelect(e.target.value);
              clearError();
            }}
            className="popby-input w-full text-lg min-h-[54px]"
            disabled={status === "loading"}
          >
            <option value="" disabled>
              Select city
            </option>
            {WAITLIST_CITIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {citySelect === WAITLIST_CITY_OTHER && (
            <input
              id="waitlist-city-other"
              type="text"
              name="city_other"
              value={cityOther}
              onChange={(e) => {
                setCityOther(e.target.value);
                clearError();
              }}
              placeholder="City, Country"
              className="popby-input w-full text-lg min-h-[54px] mt-3"
              disabled={status === "loading"}
              maxLength={120}
              required
            />
          )}
        </div>
      )}

      <div>
        <p className={labelClass}>I am a…</p>
        <div className="flex flex-wrap gap-2.5">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              disabled={status === "loading"}
              onClick={() => {
                setRole(r.value);
                clearError();
              }}
              className={`popby-chip ${
                role === r.value ? "popby-chip-selected" : ""
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={labelClass}>Kind of company</p>
        <div className="flex flex-wrap gap-2.5">
          {COMPANY_TYPES.map((c) => (
            <button
              key={c.value}
              type="button"
              disabled={status === "loading"}
              onClick={() => {
                setCompanyType(c.value);
                clearError();
              }}
              className={`popby-chip ${
                companyType === c.value ? "popby-chip-selected" : ""
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="waitlist-social" className={labelClass}>
          Social media
        </label>
        <input
          id="waitlist-social"
          type="text"
          name="social"
          required
          value={social}
          onChange={(e) => {
            setSocial(e.target.value);
            clearError();
          }}
          placeholder="LinkedIn / X or Instagram link"
          className="popby-input w-full text-lg min-h-[54px]"
          disabled={status === "loading"}
          maxLength={200}
        />
      </div>

      <div>
        <label htmlFor="waitlist-feedback" className={labelClass}>
          Feedback{" "}
          <span className="font-normal text-navy/55">(optional)</span>
        </label>
        <textarea
          id="waitlist-feedback"
          name="feedback"
          value={feedback}
          onChange={(e) => {
            setFeedback(e.target.value);
            clearError();
          }}
          placeholder="Anything you want us to know"
          className="popby-input w-full text-lg min-h-[120px] py-3 resize-y"
          disabled={status === "loading"}
          maxLength={2000}
          rows={4}
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="popby-btn popby-btn-accent w-full sm:w-auto text-xl px-8 min-h-[56px] disabled:opacity-50"
      >
        {status === "loading" ? "Joining…" : "Join waitlist"}
      </button>

      {message && status === "error" && (
        <p className="text-lg text-red-600">{message}</p>
      )}
      <p className="text-lg text-navy/70 leading-relaxed">
        {isCity ? (
          "Tell us where you are. V1 is London. This list helps us pick the next city."
        ) : (
          <>
            V1 for London, for the worldwide list{" "}
            <Link
              href="/waitlist/city"
              className="text-navy font-medium underline underline-offset-2 hover:text-accent"
            >
              click here
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
