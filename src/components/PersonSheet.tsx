"use client";

import Link from "next/link";
import {
  companyTypeLabel,
  hangoutSummary,
  roleLabel,
  timeRemaining,
} from "@/lib/constants";
import type { Profile, Availability } from "@/lib/types";

interface PersonSheetProps {
  profile: Profile & { avg_score?: number | null; rating_count?: number };
  availability: Availability;
  isSelf: boolean;
  connectionStatus?: "none" | "pending" | "accepted" | "declined";
  /** Demo: soften messaging CTA and show pair copy. */
  demo?: boolean;
  /** When set, name/photo and "View profile" open the full profile page. */
  profileHref?: string;
  onConnect: () => void;
  onMessage: () => void;
  onRate: () => void;
  onClose: () => void;
  onStopLive?: () => void;
}

export default function PersonSheet({
  profile,
  availability,
  isSelf,
  connectionStatus = "none",
  demo = false,
  profileHref,
  onConnect,
  onMessage,
  onRate,
  onClose,
  onStopLive,
}: PersonSheetProps) {
  const showSocials =
    profile.socials_visibility === "public" ||
    connectionStatus === "accepted" ||
    isSelf;

  const roleLine = [
    roleLabel(profile.role),
    companyTypeLabel(profile.company_type),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1050] sm:inset-auto sm:bottom-6 sm:right-6 sm:left-auto sm:w-96 pb-[env(safe-area-inset-bottom)]">
      <div
        className="absolute inset-0 sm:hidden bg-ink/30 -top-[100vh]"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-paper-3 overflow-hidden">
        <div className="p-5">
          <div className="flex gap-4 items-start">
            {profileHref && !isSelf ? (
              <Link
                href={profileHref}
                className="w-20 h-20 rounded-full overflow-hidden bg-paper-2 flex-shrink-0 border-2 border-paper-3"
                aria-label={`View ${profile.first_name}'s profile`}
              >
                {profile.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.photo_url}
                    alt={profile.first_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-bold text-accent bg-paper">
                    {profile.first_name[0]}
                  </div>
                )}
              </Link>
            ) : (
              <div className="w-20 h-20 rounded-full overflow-hidden bg-paper-2 flex-shrink-0 border-2 border-paper-3">
                {profile.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.photo_url}
                    alt={profile.first_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-bold text-accent bg-paper">
                    {profile.first_name[0]}
                  </div>
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {profileHref && !isSelf ? (
                  <Link
                    href={profileHref}
                    className="text-xl text-navy truncate font-display hover:underline"
                  >
                    {profile.first_name}
                  </Link>
                ) : (
                  <h2 className="text-xl text-navy truncate font-display">
                    {profile.first_name}
                  </h2>
                )}
                {availability.is_active && (
                  <span className="flex items-center gap-1.5 text-lg text-mint font-semibold">
                    <span className="live-dot" />
                    Live
                  </span>
                )}
              </div>
              <p className="text-lg text-navy/80 mt-0.5">{roleLine}</p>
              {profile.avg_score != null && profile.avg_score > 0 && (
                <p className="text-lg text-accent mt-1 font-semibold">
                  ★ {profile.avg_score} ({profile.rating_count} reviews)
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-navy/70 hover:text-ink p-2 min-h-[52px] min-w-[52px] text-xl inline-flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 p-3.5 bg-paper rounded-xl border border-paper-3">
            <p className="text-lg font-medium text-navy">
              {hangoutSummary(
                availability.hangout_format,
                availability.hangout_intent
              )}
            </p>
            {availability.hangout_note && (
              <p className="text-lg text-navy/70 mt-1">
                {availability.hangout_note}
              </p>
            )}
            <p className="text-lg text-navy/70 mt-2">
              {timeRemaining(availability.expires_at)}
            </p>
          </div>

          {profile.bio && (
            <p className="mt-3 text-lg text-ink leading-relaxed">{profile.bio}</p>
          )}

          {showSocials && (
            <div className="flex gap-4 mt-3">
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg text-navy underline font-medium"
                >
                  LinkedIn
                </a>
              )}
              {profile.twitter_url && (
                <a
                  href={profile.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg text-navy underline font-medium"
                >
                  X
                </a>
              )}
              {profile.luma_profile_url && (
                <a
                  href={profile.luma_profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg text-navy underline font-medium"
                >
                  Luma
                </a>
              )}
            </div>
          )}

          {!showSocials &&
            (profile.linkedin_url || profile.twitter_url) && (
              <p className="mt-3 text-lg text-navy/70">
                Socials show after you hang out
              </p>
            )}

          <div className="mt-5 flex flex-col gap-2">
            {isSelf ? (
              <button
                type="button"
                onClick={onStopLive}
                className="popby-btn popby-btn-ghost w-full"
              >
                Stop showing on map
              </button>
            ) : connectionStatus === "accepted" ? (
              <>
                <div className="rounded-xl bg-mint/20 border border-mint/40 px-3.5 py-3 mb-1">
                  <p className="text-lg font-bold text-navy">You&apos;re a pair</p>
                  <p className="text-lg text-navy/80 mt-1 leading-snug">
                    {demo
                      ? "They connected back. Messaging needs a real account."
                      : "They connected back. You can message."}
                  </p>
                </div>
                {demo ? (
                  <Link
                    href="/waitlist"
                    className="popby-btn popby-btn-accent w-full text-center"
                  >
                    Join waitlist to message
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={onMessage}
                    className="popby-btn popby-btn-accent w-full"
                  >
                    Message
                  </button>
                )}
                <button
                  type="button"
                  onClick={onRate}
                  className="popby-btn popby-btn-ghost w-full"
                >
                  Leave a rating
                </button>
              </>
            ) : connectionStatus === "pending" ? (
              <button
                type="button"
                disabled
                className="popby-btn popby-btn-ghost w-full opacity-60"
              >
                Waiting on them…
              </button>
            ) : (
              <>
                <p className="text-lg text-navy/70 text-center leading-snug mb-1">
                  If they connect back, you&apos;re a pair and can message.
                </p>
                <button
                  type="button"
                  onClick={onConnect}
                  className="popby-btn popby-btn-accent w-full"
                >
                  Connect
                </button>
              </>
            )}
            {profileHref && !isSelf && (
              <Link
                href={profileHref}
                className="popby-btn popby-btn-ghost w-full text-center"
              >
                View profile
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
