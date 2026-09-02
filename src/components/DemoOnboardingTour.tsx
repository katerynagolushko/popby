"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { COMPANY_TYPES, ROLES } from "@/lib/constants";
import { pickSessionDemoMePhoto } from "@/lib/demo-data";
import type { CompanyType, Role, SocialsVisibility } from "@/lib/types";
import Logo from "@/components/Logo";

export const DEMO_TOUR_STORAGE_KEY = "popby-demo-tour-done";

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

const TOTAL_STEPS = PROFILE_STEPS.length + 1; // + go-live coach mark

type DemoOnboardingTourProps = {
  draft: DemoProfileDraft;
  onDraftChange: (next: DemoProfileDraft) => void;
  /** Profile steps overlay (welcome → socials) */
  profileOpen: boolean;
  /** Spotlight on the go-live CTA after profile steps */
  coachOpen: boolean;
  goLiveTargetRef: RefObject<HTMLElement | null>;
  onSkipAll: () => void;
  onProfileDone: () => void;
  onCoachDone: () => void;
  /** Cutout tap: dismiss coach and open go-live */
  onPromptGoLive: () => void;
};

function stepIndex(step: ProfileStep): number {
  return PROFILE_STEPS.indexOf(step) + 1;
}

export default function DemoOnboardingTour({
  draft,
  onDraftChange,
  profileOpen,
  coachOpen,
  goLiveTargetRef,
  onSkipAll,
  onProfileDone,
  onCoachDone,
  onPromptGoLive,
}: DemoOnboardingTourProps) {
  const titleId = useId();
  const [step, setStep] = useState<ProfileStep>("welcome");
  const [hole, setHole] = useState<DOMRect | null>(null);
  const [previewRating, setPreviewRating] = useState(0);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset to welcome when replaying
  useEffect(() => {
    if (profileOpen) {
      setStep("welcome");
      setPreviewRating(0);
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

  useLayoutEffect(() => {
    if (!coachOpen) {
      setHole(null);
      return;
    }
    function measure() {
      const el = goLiveTargetRef.current;
      if (!el) {
        setHole(null);
        return;
      }
      setHole(el.getBoundingClientRect());
    }
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [coachOpen, goLiveTargetRef]);

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

  if (!profileOpen && !coachOpen) return null;

  if (coachOpen) {
    const pad = 10;
    const r = hole
      ? {
          top: Math.max(8, hole.top - pad),
          left: Math.max(8, hole.left - pad),
          width: hole.width + pad * 2,
          height: hole.height + pad * 2,
        }
      : null;

    return (
      <div
        className="fixed inset-0 z-[1100]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* Dim layer with cutout */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          {r ? (
            <div
              className="absolute rounded-2xl transition-[top,left,width,height] duration-200"
              style={{
                top: r.top,
                left: r.left,
                width: r.width,
                height: r.height,
                boxShadow: "0 0 0 9999px rgba(26, 31, 54, 0.72)",
                outline: "2px solid var(--accent)",
                outlineOffset: 2,
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-navy/70" />
          )}
        </div>

        {/* Invisible hit area so the real button stays clickable */}
        {r && (
          <button
            type="button"
            className="absolute z-[1] rounded-2xl bg-transparent"
            style={{
              top: r.top,
              left: r.left,
              width: r.width,
              height: r.height,
            }}
            aria-label="I'm free to hang out"
            onClick={onPromptGoLive}
          />
        )}

        <div
          className="absolute inset-x-3 z-[2] pointer-events-auto"
          style={{
            bottom: r
              ? `calc(100dvh - ${r.top}px + 12px)`
              : "max(6rem, env(safe-area-inset-bottom))",
          }}
        >
          <div className="max-w-sm mx-auto relative">
            <div className="bg-white border-2 border-navy rounded-2xl shadow-xl px-4 py-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-lg font-semibold text-muted tabular-nums">
                  {TOTAL_STEPS} / {TOTAL_STEPS}
                </p>
                <button
                  type="button"
                  onClick={onCoachDone}
                  className="text-lg text-muted font-medium hover:text-navy"
                >
                  Got it
                </button>
              </div>
              <h2
                id={titleId}
                className="text-lg text-navy font-bold tracking-tight leading-snug"
                style={{ fontFamily: "var(--font-syne), system-ui, sans-serif" }}
              >
                You&apos;re in
              </h2>
              <p className="text-lg text-ink/80 mt-1.5 leading-snug">
                Tap <span className="font-semibold text-navy">I&apos;m free to hang out</span>.
                Pick format, intent, and how long. We&apos;ll show your top 5.
              </p>
            </div>
            {/* Arrow pointing at the CTA */}
            <div
              className="mx-auto w-0 h-0 border-l-[10px] border-r-[10px] border-t-[12px] border-l-transparent border-r-transparent border-t-navy"
              aria-hidden
            />
          </div>
        </div>
      </div>
    );
  }

  // Profile steps
  return (
    <div
      className="fixed inset-0 z-[1100] flex flex-col bg-navy/55 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="flex-1 flex flex-col justify-end sm:justify-center p-2 sm:p-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-lg sm:max-w-xl mx-auto bg-paper rounded-2xl border-2 border-navy shadow-2xl overflow-hidden flex flex-col max-h-[min(94dvh,760px)] demo-tour-sheet">
          <div className="bg-navy text-white px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
            <Logo size="sm" />
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold tracking-wide text-white/85 tabular-nums">
                {stepIndex(step)} / {TOTAL_STEPS}
              </span>
              <button
                type="button"
                onClick={onSkipAll}
                className="text-lg font-medium text-white/90 hover:text-white underline underline-offset-2"
              >
                Skip
              </button>
            </div>
          </div>

          <div className="px-5 pt-5 pb-3 overflow-y-auto">
            {step === "welcome" && (
              <div className="space-y-3 pb-1">
                <h2
                  id={titleId}
                  className="text-3xl sm:text-4xl text-navy font-bold tracking-tight leading-tight"
                  style={{
                    fontFamily: "var(--font-syne), system-ui, sans-serif",
                  }}
                >
                  Simulated London crowd
                </h2>
                <p className="text-lg text-ink/80 leading-relaxed">
                  Create your profile and open a hangout. See who else is close
                  by and get matched with your top 5 by vibe or location.
                </p>
                <p className="text-lg text-muted leading-relaxed">
                  Nothing is saved. About a minute.
                </p>
              </div>
            )}

            {step === "name" && (
              <div className="space-y-3 pb-1">
                <h2
                  id={titleId}
                  className="text-xl text-navy font-bold tracking-tight"
                  style={{
                    fontFamily: "var(--font-syne), system-ui, sans-serif",
                  }}
                >
                  First name
                </h2>
                <p className="text-lg text-muted leading-snug">
                  First name only. People see this on the map.
                </p>
                <input
                  ref={nameInputRef}
                  value={draft.first_name}
                  onChange={(e) => patch({ first_name: e.target.value })}
                  className="popby-input"
                  placeholder="Alex"
                  autoComplete="given-name"
                  maxLength={32}
                />
              </div>
            )}

            {step === "role" && (
              <div className="space-y-3 pb-1">
                <h2
                  id={titleId}
                  className="text-xl text-navy font-bold tracking-tight"
                  style={{
                    fontFamily: "var(--font-syne), system-ui, sans-serif",
                  }}
                >
                  I am a…
                </h2>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => patch({ role: r.value })}
                      className={`popby-chip ${
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
              <div className="space-y-3 pb-1">
                <h2
                  id={titleId}
                  className="text-xl text-navy font-bold tracking-tight"
                  style={{
                    fontFamily: "var(--font-syne), system-ui, sans-serif",
                  }}
                >
                  Kind of company
                </h2>
                <div className="flex flex-wrap gap-2">
                  {COMPANY_TYPES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => patch({ company_type: c.value })}
                      className={`popby-chip ${
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
              <div className="space-y-3 pb-1">
                <h2
                  id={titleId}
                  className="text-xl text-navy font-bold tracking-tight"
                  style={{
                    fontFamily: "var(--font-syne), system-ui, sans-serif",
                  }}
                >
                  Your face here
                </h2>
                <p className="text-lg text-muted leading-snug">
                  Demo picks one at random. Real accounts upload theirs.
                </p>
                <div className="flex flex-col items-center gap-3 pt-1">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-navy bg-paper-2 shadow-md">
                    {draft.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={draft.photo_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg text-muted">
                        Loading…
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      patch({ photo_url: pickSessionDemoMePhoto() })
                    }
                    className="text-lg font-medium text-accent hover:text-accent-dark"
                  >
                    Shuffle face
                  </button>
                </div>
              </div>
            )}

            {step === "socials" && (
              <div className="space-y-3 pb-1">
                <h2
                  id={titleId}
                  className="text-xl text-navy font-bold tracking-tight"
                  style={{
                    fontFamily: "var(--font-syne), system-ui, sans-serif",
                  }}
                >
                  Socials (optional)
                </h2>
                <p className="text-lg text-muted leading-snug">
                  LinkedIn or X. Pick who can see them.
                </p>
                <input
                  value={draft.linkedin_url}
                  onChange={(e) => patch({ linkedin_url: e.target.value })}
                  className="popby-input"
                  placeholder="LinkedIn URL"
                  inputMode="url"
                />
                <input
                  value={draft.twitter_url}
                  onChange={(e) => patch({ twitter_url: e.target.value })}
                  className="popby-input"
                  placeholder="X / Twitter URL"
                  inputMode="url"
                />
                <div>
                  <p className="text-lg font-medium mb-2 text-navy">
                    Who can see them?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => patch({ socials_visibility: "public" })}
                      className={`popby-chip justify-center ${
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
                      className={`popby-chip justify-center text-center ${
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
              <div className="space-y-4 pb-1">
                <h2
                  id={titleId}
                  className="text-xl text-navy font-bold tracking-tight"
                  style={{
                    fontFamily: "var(--font-syne), system-ui, sans-serif",
                  }}
                >
                  After you hang
                </h2>
                <p className="text-lg text-ink/80 leading-snug">
                  Keeps the map for people who show up and don&apos;t get weird.
                </p>
                <div
                  className="flex items-center justify-center gap-1.5 pt-1"
                  role="group"
                  aria-label="Preview rating from 1 to 5"
                >
                  {[1, 2, 3, 4, 5].map((n) => {
                    const filled = previewRating >= n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          setPreviewRating((prev) => (prev === n ? 0 : n))
                        }
                        className="p-1 rounded-lg hover:bg-paper-2 transition-colors"
                        aria-label={`${n} star${n === 1 ? "" : "s"}`}
                        aria-pressed={filled}
                      >
                        <svg
                          width="36"
                          height="36"
                          viewBox="0 0 24 24"
                          aria-hidden
                          className={
                            filled
                              ? "text-accent fill-accent"
                              : "text-navy/25 fill-transparent"
                          }
                        >
                          <path
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                            d="M12 2.5l2.9 5.88 6.5.95-4.7 4.58 1.11 6.47L12 17.27l-5.81 3.06 1.11-6.47-4.7-4.58 6.5-.95L12 2.5z"
                          />
                        </svg>
                      </button>
                    );
                  })}
                </div>
                <p className="text-lg text-muted text-center tabular-nums">
                  {previewRating > 0
                    ? `${previewRating} / 5 · demo only, not saved`
                    : "Tap a star to try it · demo only"}
                </p>
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-paper-3 flex items-center gap-2 shrink-0 bg-white/60">
            {step !== "welcome" ? (
              <button
                type="button"
                onClick={goBack}
                className="popby-btn popby-btn-ghost text-lg px-4 py-3.5"
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
              className="popby-btn popby-btn-accent flex-1 disabled:opacity-50 text-lg py-3.5"
            >
              {step === "reviews" ? "See the map" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
