"use client";

import { useEffect, useId, useRef, useState } from "react";
import { COMPANY_TYPES, ROLES } from "@/lib/constants";
import { pickSessionDemoMePhoto } from "@/lib/demo-data";
import type { CompanyType, Role, SocialsVisibility } from "@/lib/types";
import Logo from "@/components/Logo";

export const DEMO_TOUR_STORAGE_KEY = "hangbyme-demo-tour-done";
const DEMO_TOUR_STORAGE_KEY_LEGACY = "popby-demo-tour-done";
/** skipped | done — distinguishes Skip from finishing the guided flow */
export const DEMO_TOUR_STATUS_KEY = "hangbyme-demo-tour-status";
/** Post-skip map banner — dismiss without taking the tour */
export const DEMO_INTRO_BANNER_DISMISSED_KEY = "hangbyme-demo-intro-dismissed";

export type DemoTourStatus = "done" | "skipped" | null;

/** Read tour status; migrate legacy boolean keys once. */
export function readDemoTourStatus(): DemoTourStatus {
  if (typeof window === "undefined") return null;
  try {
    const status = sessionStorage.getItem(DEMO_TOUR_STATUS_KEY);
    if (status === "done" || status === "skipped") return status;

    // Legacy: hangbyme-demo-tour-done / popby-demo-tour-done → treat as completed
    if (sessionStorage.getItem(DEMO_TOUR_STORAGE_KEY) === "1") {
      sessionStorage.setItem(DEMO_TOUR_STATUS_KEY, "done");
      return "done";
    }
    if (sessionStorage.getItem(DEMO_TOUR_STORAGE_KEY_LEGACY) === "1") {
      sessionStorage.setItem(DEMO_TOUR_STORAGE_KEY, "1");
      sessionStorage.setItem(DEMO_TOUR_STATUS_KEY, "done");
      sessionStorage.removeItem(DEMO_TOUR_STORAGE_KEY_LEGACY);
      return "done";
    }
    return null;
  } catch {
    return null;
  }
}

/** @deprecated Prefer readDemoTourStatus(); kept for call sites that only need done/not. */
export function readDemoTourDone(): boolean {
  return readDemoTourStatus() === "done";
}

export function markDemoTourDone() {
  try {
    sessionStorage.setItem(DEMO_TOUR_STATUS_KEY, "done");
    sessionStorage.setItem(DEMO_TOUR_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function markDemoTourSkipped() {
  try {
    sessionStorage.setItem(DEMO_TOUR_STATUS_KEY, "skipped");
    // Clear legacy "done" so Skip is not treated as finished
    sessionStorage.removeItem(DEMO_TOUR_STORAGE_KEY);
    sessionStorage.removeItem(DEMO_TOUR_STORAGE_KEY_LEGACY);
  } catch {
    /* ignore */
  }
}

/** Auto-open only when they've never finished or skipped (first visit this session). */
export function shouldAutoOpenDemoTour(): boolean {
  return readDemoTourStatus() === null;
}

export function clearDemoTourDone() {
  try {
    sessionStorage.removeItem(DEMO_TOUR_STORAGE_KEY);
    sessionStorage.removeItem(DEMO_TOUR_STORAGE_KEY_LEGACY);
    sessionStorage.removeItem(DEMO_TOUR_STATUS_KEY);
    sessionStorage.removeItem(DEMO_INTRO_BANNER_DISMISSED_KEY);
  } catch {
    /* ignore */
  }
}

export function readDemoIntroBannerDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(DEMO_INTRO_BANNER_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markDemoIntroBannerDismissed() {
  try {
    sessionStorage.setItem(DEMO_INTRO_BANNER_DISMISSED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export type DemoProfileDraft = {
  first_name: string;
  role: Role;
  company_type: CompanyType;
  photo_url: string | null;
  linkedin_url: string;
  twitter_url: string;
  socials_visibility: SocialsVisibility;
};

export const DEFAULT_DEMO_DRAFT: DemoProfileDraft = {
  first_name: "You",
  role: "founder",
  company_type: "early_stage",
  photo_url: null,
  linkedin_url: "",
  twitter_url: "",
  socials_visibility: "public",
};

type ProfileStep =
  | "welcome"
  | "name"
  | "role"
  | "company"
  | "photo"
  | "socials"
  | "reviews";

const PROFILE_STEPS: ProfileStep[] = [
  "welcome",
  "name",
  "role",
  "company",
  "photo",
  "socials",
  "reviews",
];

const TOTAL_STEPS = PROFILE_STEPS.length;

type DemoOnboardingTourProps = {
  draft: DemoProfileDraft;
  onDraftChange: (next: DemoProfileDraft) => void;
  /** Profile steps overlay (welcome → reviews) */
  profileOpen: boolean;
  onSkipAll: () => void;
  onProfileDone: () => void;
};

function stepIndex(step: ProfileStep): number {
  return PROFILE_STEPS.indexOf(step) + 1;
}

export default function DemoOnboardingTour({
  draft,
  onDraftChange,
  profileOpen,
  onSkipAll,
  onProfileDone,
}: DemoOnboardingTourProps) {
  const titleId = useId();
  const [step, setStep] = useState<ProfileStep>("welcome");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset to welcome when replaying
  useEffect(() => {
    if (profileOpen) {
      setStep("welcome");
    }
  }, [profileOpen]);

  useEffect(() => {
    if (profileOpen && step === "name") {
      const t = window.setTimeout(() => nameInputRef.current?.focus(), 80);
      return () => window.clearTimeout(t);
    }
  }, [profileOpen, step]);

  // Assign a 50/50 portrait the first time we hit the photo step
  useEffect(() => {
    if (!profileOpen || step !== "photo") return;
    if (draft.photo_url) return;
    onDraftChange({ ...draft, photo_url: pickSessionDemoMePhoto() });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only seed once when entering photo
  }, [profileOpen, step]);

  function patch(partial: Partial<DemoProfileDraft>) {
    onDraftChange({ ...draft, ...partial });
  }

  function goNext() {
    const i = PROFILE_STEPS.indexOf(step);
    if (i < PROFILE_STEPS.length - 1) {
      setStep(PROFILE_STEPS[i + 1]!);
      return;
    }
    onProfileDone();
  }

  function goBack() {
    const i = PROFILE_STEPS.indexOf(step);
    if (i <= 0) return;
    setStep(PROFILE_STEPS[i - 1]!);
  }

  const canAdvance =
    step !== "name" || draft.first_name.trim().length > 0;

  if (!profileOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex flex-col bg-navy/55 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="flex-1 flex flex-col justify-end sm:justify-center p-3 sm:p-6 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-xl sm:max-w-2xl mx-auto bg-paper rounded-2xl border-2 border-navy shadow-2xl overflow-hidden flex flex-col max-h-[min(94dvh,860px)] demo-tour-sheet">
          <div className="bg-navy text-white px-5 sm:px-7 py-4 sm:py-5 flex items-center justify-between gap-3 shrink-0">
            <Logo size="md" tone="onDark" />
            <div className="flex items-center gap-4">
              <span className="text-xl font-semibold tracking-wide text-white/85 tabular-nums">
                {stepIndex(step)} / {TOTAL_STEPS}
              </span>
              <button
                type="button"
                onClick={onSkipAll}
                className="text-xl font-medium text-white/90 hover:text-white underline underline-offset-4 min-h-[44px] inline-flex items-center"
              >
                Skip
              </button>
            </div>
          </div>

          <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 overflow-y-auto">
            {step === "welcome" && (
              <div className="space-y-4 pb-1">
                <h2
                  id={titleId}
                  className="text-4xl sm:text-5xl text-navy font-bold tracking-tight leading-tight"
                  style={{
                    fontFamily: "var(--font-syne), system-ui, sans-serif",
                  }}
                >
                  Simulated London crowd
                </h2>
                <p className="text-xl sm:text-[1.35rem] text-ink/80 leading-relaxed">
                  Create your profile and go live. Connect, hang, then become
                  friends. Friends only shows people you&apos;ve hung out with.
                </p>
                <p className="text-xl text-navy font-semibold leading-snug">
                  Connect → hang → friends.
                </p>
                <p className="text-xl text-muted leading-relaxed">
                  * Not saving your data
                </p>
              </div>
            )}

            {step === "name" && (
              <div className="space-y-4 pb-1">
                <h2
                  id={titleId}
                  className="text-2xl sm:text-3xl text-navy font-bold tracking-tight"
                  style={{
                    fontFamily: "var(--font-syne), system-ui, sans-serif",
                  }}
                >
                  First name
                </h2>
                <p className="text-xl text-muted leading-snug">
                  First name only. People see this on the map.
                </p>
                <input
                  ref={nameInputRef}
                  value={draft.first_name}
                  onChange={(e) => patch({ first_name: e.target.value })}
                  className="popby-input text-xl"
                  placeholder="Alex"
                  autoComplete="given-name"
                  maxLength={32}
                />
              </div>
            )}

            {step === "role" && (
              <div className="space-y-4 pb-1">
                <h2
                  id={titleId}
                  className="text-2xl sm:text-3xl text-navy font-bold tracking-tight"
                  style={{
                    fontFamily: "var(--font-syne), system-ui, sans-serif",
                  }}
                >
                  I am a…
                </h2>
                <div className="flex flex-wrap gap-2.5">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => patch({ role: r.value })}
                      className={`popby-chip text-xl ${
                        draft.role === r.value ? "popby-chip-selected" : ""
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === "company" && (
              <div className="space-y-4 pb-1">
                <h2
                  id={titleId}
                  className="text-2xl sm:text-3xl text-navy font-bold tracking-tight"
                  style={{
                    fontFamily: "var(--font-syne), system-ui, sans-serif",
                  }}
                >
                  Kind of company
                </h2>
                <div className="flex flex-wrap gap-2.5">
                  {COMPANY_TYPES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => patch({ company_type: c.value })}
                      className={`popby-chip text-xl ${
                        draft.company_type === c.value
                          ? "popby-chip-selected"
                          : ""
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === "photo" && (
              <div className="space-y-4 pb-1">
                <h2
                  id={titleId}
                  className="text-2xl sm:text-3xl text-navy font-bold tracking-tight"
                  style={{
                    fontFamily: "var(--font-syne), system-ui, sans-serif",
                  }}
                >
                  Your face here
                </h2>
                <p className="text-xl text-muted leading-snug">
                  Demo picks one at random. Real accounts upload theirs.
                </p>
                <div className="flex flex-col items-center gap-4 pt-1">
                  <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-2 border-navy bg-paper-2 shadow-md">
                    {draft.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={draft.photo_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl text-muted">
                        Loading…
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      patch({ photo_url: pickSessionDemoMePhoto() })
                    }
                    className="text-xl font-medium text-accent hover:text-accent-dark min-h-[44px]"
                  >
                    Shuffle face
                  </button>
                </div>
              </div>
            )}

            {step === "socials" && (
              <div className="space-y-4 pb-1">
                <h2
                  id={titleId}
                  className="text-2xl sm:text-3xl text-navy font-bold tracking-tight"
                  style={{
                    fontFamily: "var(--font-syne), system-ui, sans-serif",
                  }}
                >
                  Socials (optional)
                </h2>
                <p className="text-xl text-muted leading-snug">
                  LinkedIn or X. Pick who can see them.
                </p>
                <input
                  value={draft.linkedin_url}
                  onChange={(e) => patch({ linkedin_url: e.target.value })}
                  className="popby-input text-xl"
                  placeholder="LinkedIn URL"
                  inputMode="url"
                />
                <input
                  value={draft.twitter_url}
                  onChange={(e) => patch({ twitter_url: e.target.value })}
                  className="popby-input text-xl"
                  placeholder="X / Twitter URL"
                  inputMode="url"
                />
                <div>
                  <p className="text-xl font-medium mb-2.5 text-navy">
                    Who can see them?
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => patch({ socials_visibility: "public" })}
                      className={`popby-chip text-xl justify-center ${
                        draft.socials_visibility === "public"
                          ? "popby-chip-selected"
                          : ""
                      }`}
                    >
                      Public
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        patch({ socials_visibility: "after_hangout" })
                      }
                      className={`popby-chip text-xl justify-center text-center ${
                        draft.socials_visibility === "after_hangout"
                          ? "popby-chip-selected"
                          : ""
                      }`}
                    >
                      After we&apos;ve hung out
                    </button>
                  </div>
                </div>
              </div>
            )}
            {step === "reviews" && (
              <div className="space-y-5 pb-1">
                <h2
                  id={titleId}
                  className="text-2xl sm:text-3xl text-navy font-bold tracking-tight"
                  style={{
                    fontFamily: "var(--font-syne), system-ui, sans-serif",
                  }}
                >
                  After you hang
                </h2>
                <p className="text-xl text-ink/80 leading-relaxed">
                  Rate after you hang. That&apos;s when you become friends, and
                  they show up under Friends only.
                </p>
                <div
                  className="flex items-center justify-center gap-2 pt-1 pointer-events-none"
                  aria-hidden
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className="p-1.5">
                      <svg
                        width="44"
                        height="44"
                        viewBox="0 0 24 24"
                        className="text-accent fill-accent"
                      >
                        <path
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                          d="M12 2.5l2.9 5.88 6.5.95-4.7 4.58 1.11 6.47L12 17.27l-5.81 3.06 1.11-6.47-4.7-4.58 6.5-.95L12 2.5z"
                        />
                      </svg>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-5 sm:px-8 py-4 sm:py-5 border-t border-paper-3 flex items-center gap-3 shrink-0 bg-white/60">
            {step !== "welcome" ? (
              <button
                type="button"
                onClick={goBack}
                className="popby-btn popby-btn-ghost text-xl px-5 min-h-[54px]"
              >
                Back
              </button>
            ) : (
              <div className="flex-1" />
            )}
            <button
              type="button"
              onClick={goNext}
              disabled={!canAdvance}
              className="popby-btn popby-btn-accent flex-1 disabled:opacity-50 text-xl min-h-[54px]"
            >
              {step === "reviews" ? "See the map" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
