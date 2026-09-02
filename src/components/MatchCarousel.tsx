"use client";

import Link from "next/link";
import {
  companyTypeLabel,
  distanceMetres,
  formatDistance,
  hangoutSummary,
  roleLabel,
} from "@/lib/constants";
import { matchWhy, type DemoPerson } from "@/lib/demo-data";

type ConnectionStatus = "none" | "pending" | "accepted";

interface MatchCarouselProps {
  matches: DemoPerson[];
  me: DemoPerson;
  origin: { lat: number; lng: number };
  preferVibe: boolean;
  getConnectionStatus: (userId: string) => ConnectionStatus;
  onOpen: (person: DemoPerson) => void;
  onConnect: (userId: string) => void;
  onBackToMap: () => void;
  onEdit: () => void;
  onStop: () => void;
}

export default function MatchCarousel({
  matches,
  me,
  origin,
  preferVibe,
  getConnectionStatus,
  onOpen,
  onConnect,
  onBackToMap,
  onEdit,
  onStop,
}: MatchCarouselProps) {
  const count = matches.length;
  const title = preferVibe
    ? `${count} people on your vibe`
    : `${count} people near you`;

  return (
    <div
      className="match-fullscreen fixed inset-0 z-[1000] flex flex-col bg-paper overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <header
        className="flex-shrink-0 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-1.5"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <button
            type="button"
            onClick={onBackToMap}
            className="text-sm sm:text-base font-semibold text-navy bg-white border-2 border-navy/20 rounded-xl px-3 sm:px-4 min-h-[38px] sm:min-h-[44px] shadow-sm hover:border-navy/40 self-start"
          >
            ← Back to map
          </button>
          <div className="flex items-center gap-2 sm:gap-3 bg-navy text-white rounded-xl px-2.5 sm:px-3.5 py-1 min-h-[38px] sm:min-h-[44px] shadow-sm w-full sm:w-auto justify-between sm:justify-start">
            <span className="live-dot shrink-0" />
            <span className="text-base sm:text-lg font-semibold shrink-0">
              You&apos;re live
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
              <button
                type="button"
                onClick={onEdit}
                className="text-sm sm:text-base font-semibold underline underline-offset-2 px-2 sm:px-2.5 min-h-[36px] sm:min-h-[42px] inline-flex items-center"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={onStop}
                className="text-sm sm:text-base font-semibold bg-white/20 rounded-lg px-2.5 sm:px-3.5 min-h-[36px] sm:min-h-[42px] inline-flex items-center"
              >
                Stop
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 px-0.5">
          <p
            className="text-xl sm:text-2xl font-bold tracking-tight text-navy leading-tight"
            style={{ fontFamily: "var(--font-syne), system-ui, sans-serif" }}
          >
            {title}
          </p>
          <p className="text-base sm:text-lg text-navy/70 mt-1.5 leading-snug">
            Connect. If they connect back, you&apos;re a pair. Swipe sideways.
            Tap a card for more.
          </p>
        </div>
      </header>

      <div
        className="flex-1 min-h-0 flex items-stretch py-2 touch-pan-x"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div
          className="flex gap-3 overflow-x-auto overflow-y-hidden h-full px-4 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="list"
          aria-label="Top matches"
        >
          {matches.map((p, i) => {
            const metres = distanceMetres(origin, {
              lat: p.availability.lat,
              lng: p.availability.lng,
            });
            const why = matchWhy(me, p, origin);
            const status = getConnectionStatus(p.profile.id);
            const company = companyTypeLabel(p.profile.company_type);

            return (
              <article
                key={p.profile.id}
                role="listitem"
                className="snap-center flex-shrink-0 w-[min(86vw,22rem)] h-full max-h-full rounded-2xl border-2 border-navy/15 bg-white overflow-hidden flex flex-col shadow-lg"
              >
                <button
                  type="button"
                  onClick={() => onOpen(p)}
                  className="text-left flex flex-col flex-1 min-h-0"
                >
                  <div className="relative flex-[2.2] min-h-[52%] bg-paper-2 overflow-hidden">
                    {p.profile.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.profile.photo_url}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
                        draggable={false}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.visibility =
                            "hidden";
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-5xl font-bold text-accent bg-paper">
                        {p.profile.first_name[0]}
                      </div>
                    )}
                    <span className="absolute top-2.5 left-2.5 bg-navy/90 text-white text-sm font-bold px-2 py-1 rounded-lg tabular-nums">
                      {i + 1}/{count}
                    </span>
                    {status === "accepted" && (
                      <span className="absolute top-2.5 right-2.5 bg-mint text-navy text-sm font-bold px-2 py-1 rounded-lg">
                        Pair
                      </span>
                    )}
                  </div>

                  <div className="px-3.5 pt-2.5 pb-1.5 flex-shrink-0">
                    <p
                      className="text-xl font-bold text-navy truncate tracking-tight"
                      style={{
                        fontFamily: "var(--font-syne), system-ui, sans-serif",
                      }}
                    >
                      {p.profile.first_name}
                    </p>
                    <p className="text-base text-navy/70 mt-0.5 truncate">
                      {roleLabel(p.profile.role)}
                      {company ? ` · ${company}` : ""}
                    </p>
                    <p className="text-base text-navy font-medium mt-1.5 truncate">
                      {hangoutSummary(
                        p.availability.hangout_format,
                        p.availability.hangout_intent
                      )}
                    </p>
                    <p className="text-base text-accent font-semibold mt-1 truncate">
                      {preferVibe ? `${why} · ${formatDistance(metres)}` : why}
                    </p>
                  </div>
                </button>

                <div className="px-3.5 pb-3 pt-2 flex-shrink-0 flex flex-col gap-2.5">
                  {status === "none" ? (
                    <button
                      type="button"
                      onClick={() => onConnect(p.profile.id)}
                      className="w-full text-base sm:text-lg font-semibold bg-accent text-white rounded-xl px-3 py-2.5 min-h-[42px] sm:min-h-[48px] hover:bg-accent-dark shadow-sm"
                    >
                      Connect
                    </button>
                  ) : status === "pending" ? (
                    <div className="w-full text-center text-base sm:text-lg text-navy/70 font-medium py-2.5 min-h-[42px] sm:min-h-[48px] rounded-xl bg-paper-2 border border-paper-3 inline-flex items-center justify-center">
                      Waiting on them…
                    </div>
                  ) : (
                    <Link
                      href="/waitlist"
                      className="w-full text-center text-base sm:text-lg font-semibold bg-navy text-white rounded-xl px-3 py-2.5 min-h-[42px] sm:min-h-[48px] hover:bg-navy-soft shadow-sm"
                    >
                      Join waitlist to message
                    </Link>
                  )}
                  <Link
                    href={`/demo/person/${p.profile.id}`}
                    className="w-full text-center text-base sm:text-lg font-semibold text-navy py-2.5 min-h-[42px] sm:min-h-[48px] rounded-xl border-2 border-navy/15 bg-white hover:border-navy/40 inline-flex items-center justify-center"
                  >
                    View profile
                  </Link>
                </div>
              </article>
            );
          })}
          {/* end spacer so last card can snap center-ish */}
          <div className="flex-shrink-0 w-2" aria-hidden />
        </div>
      </div>

      <div className="flex-shrink-0 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-0.5 text-center">
        <p className="text-sm sm:text-base text-navy/70">
          {count} matches · swipe for the rest
        </p>
      </div>
    </div>
  );
}
