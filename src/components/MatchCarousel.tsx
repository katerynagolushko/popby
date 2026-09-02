"use client";

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
  onMessage: (userId: string) => void;
}

export default function MatchCarousel({
  matches,
  me,
  origin,
  preferVibe,
  getConnectionStatus,
  onOpen,
  onConnect,
  onMessage,
}: MatchCarouselProps) {
  const count = matches.length;
  const title = preferVibe
    ? `${count} people on your vibe`
    : `${count} people near you`;

  return (
    <div className="bg-paper border-2 border-navy rounded-2xl shadow-2xl overflow-hidden">
      <div className="bg-navy text-white px-4 pt-3.5 pb-3">
        <p
          className="text-lg font-bold tracking-tight leading-tight"
          style={{ fontFamily: "var(--font-syne), system-ui, sans-serif" }}
        >
          {title}
        </p>
        <p className="text-sm text-white/90 mt-1.5 leading-snug">
          Connect. If they connect back, you&apos;re a pair.
        </p>
        <p className="text-xs text-white/65 mt-1 leading-snug">
          Swipe sideways. Tap a card for more. Connect from any card.
        </p>
      </div>

      <div
        className="flex gap-3 overflow-x-auto px-3 py-3 bg-white snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: "touch" }}
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
              className="snap-center flex-shrink-0 w-[78%] max-w-[280px] rounded-2xl border-2 border-navy/15 bg-paper overflow-hidden flex flex-col shadow-md"
            >
              <button
                type="button"
                onClick={() => onOpen(p)}
                className="text-left flex flex-col flex-1 min-h-0"
              >
                <div className="relative aspect-[4/5] max-h-[220px] bg-paper-2 overflow-hidden">
                  {p.profile.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.profile.photo_url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.visibility =
                          "hidden";
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-accent bg-paper">
                      {p.profile.first_name[0]}
                    </div>
                  )}
                  <span className="absolute top-2.5 left-2.5 bg-navy/90 text-white text-xs font-bold px-2 py-1 rounded-lg tabular-nums">
                    {i + 1}/{count}
                  </span>
                  {status === "accepted" && (
                    <span className="absolute top-2.5 right-2.5 bg-mint text-navy text-xs font-bold px-2 py-1 rounded-lg">
                      Pair
                    </span>
                  )}
                </div>

                <div className="px-3.5 pt-3 pb-2 flex-1">
                  <p
                    className="text-xl font-bold text-navy truncate tracking-tight"
                    style={{
                      fontFamily: "var(--font-syne), system-ui, sans-serif",
                    }}
                  >
                    {p.profile.first_name}
                  </p>
                  <p className="text-sm text-muted mt-0.5 truncate">
                    {roleLabel(p.profile.role)}
                    {company ? ` · ${company}` : ""}
                  </p>
                  <p className="text-sm text-navy font-medium mt-2 truncate">
                    {hangoutSummary(
                      p.availability.hangout_format,
                      p.availability.hangout_intent
                    )}
                  </p>
                  <p className="text-xs text-accent font-semibold mt-1.5 truncate">
                    {preferVibe ? `${why} · ${formatDistance(metres)}` : why}
                  </p>
                </div>
              </button>

              <div className="px-3.5 pb-3.5 pt-0">
                {status === "none" ? (
                  <button
                    type="button"
                    onClick={() => onConnect(p.profile.id)}
                    className="w-full text-sm font-semibold bg-accent text-white rounded-xl px-3 py-2.5 hover:bg-accent-dark shadow-sm"
                  >
                    Connect
                  </button>
                ) : status === "pending" ? (
                  <div className="w-full text-center text-sm text-muted font-medium py-2.5 rounded-xl bg-paper-2 border border-paper-3">
                    Waiting on them…
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onMessage(p.profile.id)}
                    className="w-full text-sm font-semibold bg-navy text-white rounded-xl px-3 py-2.5 hover:bg-navy-soft shadow-sm"
                  >
                    You&apos;re a pair · Message
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
