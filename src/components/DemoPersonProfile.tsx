"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import {
  companyTypeLabel,
  hangoutSummary,
  roleLabel,
  timeRemaining,
} from "@/lib/constants";
import {
  formatReviewWhen,
  type DemoPerson,
  type DemoReview,
} from "@/lib/demo-data";

type ConnStatus = "none" | "pending" | "accepted";

const STORAGE_KEY = "popby-demo-connections";

function readConnections(): Record<string, ConnStatus> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ConnStatus>;
  } catch {
    return {};
  }
}

function writeConnections(map: Record<string, ConnStatus>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

interface DemoPersonProfileProps {
  person: DemoPerson;
  reviews: DemoReview[];
}

export default function DemoPersonProfile({
  person,
  reviews,
}: DemoPersonProfileProps) {
  const { profile, availability } = person;
  const [status, setStatus] = useState<ConnStatus>("none");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setStatus(readConnections()[profile.id] ?? "none");
  }, [profile.id]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  function handleConnect() {
    const next = { ...readConnections(), [profile.id]: "pending" as const };
    writeConnections(next);
    setStatus("pending");
    showToast("Connect sent. Waiting on them…");
    window.setTimeout(() => {
      const accepted = {
        ...readConnections(),
        [profile.id]: "accepted" as const,
      };
      writeConnections(accepted);
      setStatus("accepted");
      showToast("You're a pair. They connected back.");
    }, 1500);
  }

  const showSocials =
    profile.socials_visibility === "public" || status === "accepted";

  const roleLine = [
    roleLabel(profile.role),
    companyTypeLabel(profile.company_type),
  ]
    .filter(Boolean)
    .join(" · ");

  const avg = profile.avg_score;
  const ratingCount = profile.rating_count ?? 0;
  const hasRatings = avg != null && avg > 0 && ratingCount > 0;

  return (
    <div className="min-h-[100dvh] bg-paper flex flex-col">
      <header className="sticky top-0 z-20 bg-paper/95 backdrop-blur border-b border-paper-3">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link
            href="/demo"
            className="text-sm font-semibold text-navy bg-white border-2 border-navy/15 rounded-xl px-3.5 py-2 shadow-sm hover:border-navy/40"
          >
            ← Back to map
          </Link>
          <Logo size="sm" />
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-4 items-start">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-paper-2 flex-shrink-0 border-2 border-paper-3">
            {profile.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photo_url}
                alt={profile.first_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-accent bg-paper">
                {profile.first_name[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="text-2xl text-navy tracking-tight"
                style={{ fontFamily: "var(--font-syne), system-ui, sans-serif" }}
              >
                {profile.first_name}
              </h1>
              {availability.is_active && (
                <span className="flex items-center gap-1 text-xs text-mint font-semibold">
                  <span className="live-dot" />
                  Live
                </span>
              )}
            </div>
            <p className="text-sm text-muted mt-0.5">{roleLine}</p>
            {hasRatings && (
              <p className="text-sm text-accent mt-1.5 font-semibold">
                ★ {avg} · {ratingCount}{" "}
                {ratingCount === 1 ? "review" : "reviews"}
              </p>
            )}
          </div>
        </div>

        {availability.is_active && (
          <div className="mt-5 p-3.5 bg-white rounded-xl border border-paper-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Right now
            </p>
            <p className="text-sm font-medium text-navy mt-1">
              {hangoutSummary(
                availability.hangout_format,
                availability.hangout_intent
              )}
            </p>
            {availability.hangout_note && (
              <p className="text-sm text-muted mt-1">
                {availability.hangout_note}
              </p>
            )}
            <p className="text-xs text-muted mt-2">
              {timeRemaining(availability.expires_at)}
            </p>
          </div>
        )}

        {profile.bio && (
          <p className="mt-5 text-sm text-ink leading-relaxed">{profile.bio}</p>
        )}

        {showSocials ? (
          <div className="flex flex-wrap gap-3 mt-4">
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-navy underline font-medium"
              >
                LinkedIn
              </a>
            )}
            {profile.twitter_url && (
              <a
                href={profile.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-navy underline font-medium"
              >
                X
              </a>
            )}
            {profile.luma_profile_url && (
              <a
                href={profile.luma_profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-navy underline font-medium"
              >
                Luma
              </a>
            )}
          </div>
        ) : (
          (profile.linkedin_url || profile.twitter_url) && (
            <p className="mt-4 text-xs text-muted">
              Socials show after you hang out
            </p>
          )
        )}

        <div className="mt-6 flex flex-col gap-2">
          {status === "accepted" ? (
            <>
              <div className="rounded-xl bg-mint/20 border border-mint/40 px-3 py-2.5">
                <p className="text-sm font-bold text-navy">You&apos;re a pair</p>
                <p className="text-xs text-navy/80 mt-0.5 leading-snug">
                  They connected back. Messaging needs a real account.
                </p>
              </div>
              <Link href="/demo" className="popby-btn popby-btn-accent w-full text-center">
                Back to matches
              </Link>
            </>
          ) : status === "pending" ? (
            <button
              type="button"
              disabled
              className="popby-btn popby-btn-ghost w-full opacity-60"
            >
              Waiting on them…
            </button>
          ) : (
            <>
              <p className="text-xs text-muted text-center leading-snug mb-1">
                If they connect back, you&apos;re a pair and can message.
              </p>
              <button
                type="button"
                onClick={handleConnect}
                className="popby-btn popby-btn-accent w-full"
              >
                Connect
              </button>
            </>
          )}
        </div>

        <section className="mt-8">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <h2
              className="text-lg text-navy tracking-tight"
              style={{ fontFamily: "var(--font-syne), system-ui, sans-serif" }}
            >
              Reviews
            </h2>
            {hasRatings && reviews.length < ratingCount && (
              <p className="text-xs text-muted">
                Recent {reviews.length} of {ratingCount}
              </p>
            )}
          </div>

          {!hasRatings || reviews.length === 0 ? (
            <p className="text-sm text-muted py-4">No reviews yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {reviews.map((r) => (
                <li
                  key={r.id}
                  className="bg-white border border-paper-3 rounded-xl px-4 py-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-navy">
                      {r.reviewerName}
                    </p>
                    <p className="text-xs text-muted flex-shrink-0">
                      {formatReviewWhen(r.daysAgo)}
                    </p>
                  </div>
                  <p className="text-sm text-accent font-semibold mt-1 tabular-nums">
                    {"★".repeat(r.score)}
                    <span className="text-paper-3">
                      {"★".repeat(5 - r.score)}
                    </span>
                    <span className="text-muted font-medium ml-1.5">
                      {r.score}/5
                    </span>
                  </p>
                  <p className="text-sm text-ink mt-1.5 leading-snug">
                    {r.comment}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-8 text-center text-xs text-muted">
          Demo profile · simulated reviews
        </p>
      </main>

      {toast && (
        <div className="fixed top-16 inset-x-4 z-[1200] flex justify-center pointer-events-none">
          <div className="bg-navy text-white text-sm px-4 py-2.5 rounded-xl shadow-lg max-w-xs text-center">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
