"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import PopbyMapLoader, { type MapPerson } from "@/components/PopbyMapLoader";
import GoLiveModal, { type GoLivePayload } from "@/components/GoLiveModal";
import PersonSheet from "@/components/PersonSheet";
import RatingModal from "@/components/RatingModal";
import {
  DEMO_ME_ID,
  DEMO_ME_PROFILE,
  DEMO_PERSON_COUNT,
  DEMO_TOP_MATCH_COUNT,
  INITIAL_DEMO_PEOPLE,
  matchWhy,
  subsampleForMap,
  toMapPeople,
  topDemoMatches,
  type DemoPerson,
} from "@/lib/demo-data";
import {
  LONDON_CENTER,
  distanceMetres,
  formatDistance,
  hangoutSummary,
  roleLabel,
} from "@/lib/constants";

const DEMO_MAP_CENTER: [number, number] = [
  51.512, // mid-London so west/south/east pins aren't cropped at city zoom
  -0.12,
];

type ConnectionMap = Record<string, "none" | "pending" | "accepted">;

type SelectedPerson = DemoPerson & { isSelf?: boolean };

/** Full interactive demo — real London map, fake crowd, no Supabase. */
export default function DemoPage() {
  const [people] = useState<DemoPerson[]>(INITIAL_DEMO_PEOPLE);
  const [myLive, setMyLive] = useState<DemoPerson | null>(null);
  const [selected, setSelected] = useState<SelectedPerson | null>(null);
  const [showGoLive, setShowGoLive] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [connections, setConnections] = useState<ConnectionMap>({});
  const [toast, setToast] = useState<string | null>(null);

  const origin = useMemo(() => {
    if (myLive) {
      return { lat: myLive.availability.lat, lng: myLive.availability.lng };
    }
    return LONDON_CENTER;
  }, [myLive]);

  const topMatches = useMemo(
    () => (myLive ? topDemoMatches(people, origin, myLive) : []),
    [people, myLive, origin]
  );

  const mapPeople = useMemo(() => {
    const all = myLive ? [...people, myLive] : people;
    return toMapPeople(subsampleForMap(all));
  }, [people, myLive]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }, []);

  function handlePersonClick(person: MapPerson) {
    const all = myLive ? [...people, myLive] : people;
    const found = all.find((p) => p.availability.id === person.availability.id);
    if (found) setSelected({ ...found, isSelf: found.profile.id === DEMO_ME_ID });
  }

  function handleGoLive(payload: GoLivePayload) {
    const session: DemoPerson = {
      profile: { ...DEMO_ME_PROFILE, avg_score: null, rating_count: 0 },
      isSelf: true,
      availability: {
        id: `me-${Date.now()}`,
        user_id: DEMO_ME_ID,
        lat: payload.lat,
        lng: payload.lng,
        hangout_format: payload.hangout_format,
        hangout_intent: payload.hangout_intent,
        match_preference: payload.match_preference,
        hangout_note: payload.hangout_note,
        duration_minutes: payload.duration_minutes,
        expires_at: payload.expires_at,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    };
    setMyLive(session);
    setShowGoLive(false);
    showToast(
      payload.match_preference === "vibe"
        ? `You're live. Here are your top ${DEMO_TOP_MATCH_COUNT} vibe matches.`
        : `You're live. Here are your top ${DEMO_TOP_MATCH_COUNT} closest people.`
    );
  }

  function handleStopLive() {
    setMyLive(null);
    setSelected(null);
    showToast("You're off the map");
  }

  function handleConnect(userId: string) {
    setConnections((prev) => ({ ...prev, [userId]: "pending" }));
    showToast("Connect request sent");
    setTimeout(() => {
      setConnections((prev) => ({ ...prev, [userId]: "accepted" }));
      showToast("They accepted. Messaging stays demo-only.");
    }, 1500);
  }

  function getConnectionStatus(userId: string) {
    return connections[userId] ?? "none";
  }

  const preferVibe = myLive?.availability.match_preference === "vibe";

  return (
    <div className="h-[100dvh] flex flex-col relative bg-paper overflow-hidden">
      <header className="absolute top-0 inset-x-0 z-[1000] p-3 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto bg-white/95 backdrop-blur rounded-xl px-3 py-2 shadow-lg border border-paper-3">
          <Logo size="sm" />
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <span className="text-xs bg-accent text-white px-2.5 py-1 rounded-lg font-semibold">
            Demo · {DEMO_PERSON_COUNT} people
          </span>
          <Link
            href="/"
            className="text-xs bg-navy text-white px-3 py-1.5 rounded-lg font-medium"
          >
            Waitlist
          </Link>
        </div>
      </header>

      <div className="flex-1 relative min-h-0">
        <PopbyMapLoader
          people={mapPeople}
          center={DEMO_MAP_CENTER}
          zoom={11}
          onPersonClick={handlePersonClick}
          className="h-full w-full"
        />
      </div>

      <div className="absolute bottom-0 inset-x-0 z-[1000] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex justify-center pointer-events-none">
        {myLive ? (
          <div className="pointer-events-auto flex items-center gap-3 bg-navy text-white rounded-xl px-5 py-3 shadow-xl w-full max-w-sm">
            <span className="live-dot" />
            <span className="text-sm font-medium flex-1">You&apos;re live</span>
            <button
              type="button"
              onClick={() => setShowGoLive(true)}
              className="text-xs underline opacity-90"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleStopLive}
              className="text-xs bg-white/15 rounded-lg px-3 py-1"
            >
              Stop
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowGoLive(true)}
            className="pointer-events-auto popby-btn popby-btn-accent shadow-xl text-base px-8 py-3.5 w-full max-w-sm"
          >
            <span className="live-dot" />
            I&apos;m free to hang out
          </button>
        )}
      </div>

      {showGoLive && (
        <GoLiveModal
          demo
          onClose={() => setShowGoLive(false)}
          onLive={(payload) => payload && handleGoLive(payload)}
        />
      )}

      {selected && (
        <PersonSheet
          profile={selected.profile}
          availability={selected.availability}
          isSelf={selected.isSelf ?? false}
          connectionStatus={getConnectionStatus(selected.profile.id)}
          onConnect={() => handleConnect(selected.profile.id)}
          onMessage={() =>
            showToast("Messaging needs a real account. Join the waitlist from home.")
          }
          onRate={() => setShowRating(true)}
          onClose={() => setSelected(null)}
          onStopLive={handleStopLive}
        />
      )}

      {showRating && selected && (
        <RatingModal
          demo
          connectionId="demo-conn"
          toUserId={selected.profile.id}
          toUserName={selected.profile.first_name}
          fromUserId={DEMO_ME_ID}
          onClose={() => setShowRating(false)}
          onSubmitted={() => {
            setShowRating(false);
            showToast("Rating saved in the demo only");
          }}
        />
      )}

      {toast && (
        <div className="absolute top-16 inset-x-4 z-[1200] flex justify-center pointer-events-none">
          <div className="bg-navy text-white text-sm px-4 py-2.5 rounded-xl shadow-lg max-w-xs text-center">
            {toast}
          </div>
        </div>
      )}

      <div className="absolute top-14 inset-x-3 z-[900] pointer-events-none">
        <div className="pointer-events-auto max-w-lg mx-auto">
          {!myLive && (
            <div className="bg-white border-2 border-navy rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-navy text-white px-4 py-3.5">
                <p
                  className="text-lg font-bold tracking-tight leading-snug"
                  style={{ fontFamily: "var(--font-syne), system-ui, sans-serif" }}
                >
                  Fake London crowd for Encode
                </p>
                <p className="text-sm text-white/85 mt-1 leading-snug">
                  Go live and we pick {DEMO_TOP_MATCH_COUNT} people you should
                  meet. Pins are spread across the city, not one blob.
                </p>
              </div>
            </div>
          )}

          {myLive && topMatches.length > 0 && (
            <div className="bg-paper border-2 border-navy rounded-2xl shadow-2xl overflow-hidden max-h-[min(62vh,520px)] flex flex-col">
              <div className="bg-navy text-white px-4 py-4 flex-shrink-0">
                <p
                  className="text-xl font-bold tracking-tight leading-tight"
                  style={{ fontFamily: "var(--font-syne), system-ui, sans-serif" }}
                >
                  You should connect with…
                </p>
                <p className="text-sm text-white/80 mt-1.5 leading-snug">
                  {preferVibe
                    ? `Your top ${DEMO_TOP_MATCH_COUNT} by hangout vibe. Edit live to switch to closest.`
                    : `Your top ${DEMO_TOP_MATCH_COUNT} closest to your pin. Edit live to switch to vibe.`}
                </p>
              </div>
              <ul className="overflow-y-auto divide-y divide-paper-3 bg-white">
                {topMatches.map((p, i) => {
                  const metres = distanceMetres(origin, {
                    lat: p.availability.lat,
                    lng: p.availability.lng,
                  });
                  const why = matchWhy(myLive, p, origin);
                  const status = getConnectionStatus(p.profile.id);
                  return (
                    <li
                      key={p.profile.id}
                      className="flex items-stretch gap-3 px-3.5 py-3.5 bg-white"
                    >
                      <button
                        type="button"
                        onClick={() => setSelected({ ...p })}
                        className="flex items-center gap-3 min-w-0 flex-1 text-left"
                      >
                        <span className="flex-shrink-0 w-6 text-sm font-bold text-accent tabular-nums">
                          {i + 1}
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.profile.photo_url ?? ""}
                          alt=""
                          className="w-14 h-14 rounded-full object-cover bg-paper-2 flex-shrink-0 ring-2 ring-navy/15"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.visibility =
                              "hidden";
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-navy truncate">
                            {p.profile.first_name}
                            <span className="font-normal text-muted text-sm">
                              {" "}
                              · {roleLabel(p.profile.role)}
                            </span>
                          </p>
                          <p className="text-xs text-muted truncate mt-0.5">
                            {formatDistance(metres)} ·{" "}
                            {hangoutSummary(
                              p.availability.hangout_format,
                              p.availability.hangout_intent
                            )}
                          </p>
                          <p className="text-xs text-accent font-semibold truncate mt-0.5">
                            {why}
                          </p>
                        </div>
                      </button>
                      <div className="flex-shrink-0 flex items-center">
                        {status === "none" ? (
                          <button
                            type="button"
                            onClick={() => handleConnect(p.profile.id)}
                            className="text-sm font-semibold bg-accent text-white rounded-xl px-3.5 py-2.5 hover:bg-accent-dark shadow-sm"
                          >
                            Connect
                          </button>
                        ) : status === "pending" ? (
                          <span className="text-xs text-muted px-2">Sent</span>
                        ) : (
                          <span className="text-xs text-navy font-semibold px-2">
                            Connected
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
