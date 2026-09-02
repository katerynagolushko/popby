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
  INITIAL_DEMO_PEOPLE,
  rankDemoPeople,
  subsampleForMap,
  toMapPeople,
  vibeMatchReason,
  type DemoPerson,
} from "@/lib/demo-data";
import {
  LONDON_CENTER,
  distanceMetres,
  formatDistance,
  hangoutSummary,
} from "@/lib/constants";

const DEMO_MAP_CENTER: [number, number] = [
  LONDON_CENTER.lat,
  LONDON_CENTER.lng,
];

type ConnectionMap = Record<string, "none" | "pending" | "accepted">;

type SelectedPerson = DemoPerson & { isSelf?: boolean };

/** Full interactive demo — real London map, ~500 fake people, no Supabase. */
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

  // Ranking always uses the full 500; map only paints nearest ~100 + self.
  const rankedPeople = useMemo(
    () => rankDemoPeople(people, origin, myLive),
    [people, myLive, origin]
  );

  const mapPeople = useMemo(() => {
    const all = myLive ? [...people, myLive] : people;
    return toMapPeople(subsampleForMap(all, origin));
  }, [people, myLive, origin]);

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
        ? "You're live. Suggestions favour your hangout vibe."
        : "You're live. Suggestions are closest first."
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
          zoom={12}
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
        <div className="pointer-events-auto max-w-lg mx-auto space-y-2">
          {!myLive && (
            <p className="text-center text-[11px] text-muted bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 border border-paper-3">
              Fake London crowd for Encode. Go live to rank matches by distance or vibe.
            </p>
          )}
          {myLive && (
            <p className="text-center text-[11px] text-muted bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 border border-paper-3">
              {preferVibe
                ? "Sorted by hangout vibe (format + intent), then distance. Edit to switch."
                : "Sorted by closest to your pin. Edit to switch to vibe match."}
            </p>
          )}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {rankedPeople.slice(0, 8).map((p) => {
              const metres = distanceMetres(origin, {
                lat: p.availability.lat,
                lng: p.availability.lng,
              });
              const why =
                preferVibe && myLive ? vibeMatchReason(myLive, p) : null;
              return (
                <button
                  key={p.profile.id}
                  type="button"
                  onClick={() => setSelected({ ...p })}
                  className="flex-shrink-0 flex items-center gap-2 bg-white/95 backdrop-blur border border-paper-3 rounded-xl px-2.5 py-2 shadow text-left min-w-[168px]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.profile.photo_url ?? ""}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover bg-paper-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.visibility = "hidden";
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-navy truncate">
                      {p.profile.first_name}
                    </p>
                    <p className="text-[10px] text-muted truncate max-w-[130px]">
                      {formatDistance(metres)} ·{" "}
                      {hangoutSummary(
                        p.availability.hangout_format,
                        p.availability.hangout_intent
                      )}
                    </p>
                    {why && (
                      <p className="text-[10px] text-accent font-medium truncate max-w-[130px]">
                        {why}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
