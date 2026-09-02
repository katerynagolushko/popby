"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import PopbyMapLoader, { type MapPerson } from "@/components/PopbyMapLoader";
import GoLiveModal, { type GoLivePayload } from "@/components/GoLiveModal";
import MatchCarousel from "@/components/MatchCarousel";
import PersonSheet from "@/components/PersonSheet";
import RatingModal from "@/components/RatingModal";
import DemoOnboardingTour, {
  DEFAULT_DEMO_DRAFT,
  DEMO_TOUR_STORAGE_KEY,
  type DemoProfileDraft,
} from "@/components/DemoOnboardingTour";
import {
  DEMO_ME_ID,
  DEMO_ME_PROFILE,
  DEMO_TOP_MATCH_COUNT,
  INITIAL_DEMO_PEOPLE,
  pickSessionDemoMePhoto,
  subsampleForMap,
  toMapPeople,
  topDemoMatches,
  type DemoPerson,
} from "@/lib/demo-data";
import { LONDON_CENTER } from "@/lib/constants";

const DEMO_MAP_CENTER: [number, number] = [
  51.512, // mid-London so west/south/east pins aren't cropped at city zoom
  -0.12,
];

type ConnectionMap = Record<string, "none" | "pending" | "accepted">;

type SelectedPerson = DemoPerson & { isSelf?: boolean };

function readTourDone(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return sessionStorage.getItem(DEMO_TOUR_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markTourDone() {
  try {
    sessionStorage.setItem(DEMO_TOUR_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Full interactive demo — real London map, fake crowd, no Supabase. */
export default function DemoPage() {
  const [people] = useState<DemoPerson[]>(INITIAL_DEMO_PEOPLE);
  const [myLive, setMyLive] = useState<DemoPerson | null>(null);
  const [selected, setSelected] = useState<SelectedPerson | null>(null);
  const [showGoLive, setShowGoLive] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showMatches, setShowMatches] = useState(false);
  const [connections, setConnections] = useState<ConnectionMap>({});
  const [toast, setToast] = useState<string | null>(null);

  const [draft, setDraft] = useState<DemoProfileDraft>(DEFAULT_DEMO_DRAFT);
  const [tourHydrated, setTourHydrated] = useState(false);
  const [profileTourOpen, setProfileTourOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const goLiveBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const done = readTourDone();
    setTourHydrated(true);
    if (!done) setProfileTourOpen(true);
  }, []);

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

  const matchesOpen = Boolean(myLive && showMatches && topMatches.length > 0);
  const tourBlocking = profileTourOpen || coachOpen;

  // Lock body / map scroll bleed while the fullscreen matches view is open.
  useEffect(() => {
    if (!matchesOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevTouch = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouch;
    };
  }, [matchesOpen]);

  // Soft-lock scroll while profile tour sheet is up
  useEffect(() => {
    if (!profileTourOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [profileTourOpen]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  function finishTourPersist() {
    markTourDone();
    setProfileTourOpen(false);
    setCoachOpen(false);
  }

  function handleSkipTour() {
    finishTourPersist();
  }

  function handleProfileDone() {
    setProfileTourOpen(false);
    setCoachOpen(true);
  }

  function handleCoachDone() {
    finishTourPersist();
  }

  function handlePromptGoLive() {
    finishTourPersist();
    setShowGoLive(true);
  }

  function handleReplayTour() {
    setMyLive(null);
    setShowMatches(false);
    setShowGoLive(false);
    setSelected(null);
    setDraft({ ...DEFAULT_DEMO_DRAFT });
    try {
      sessionStorage.removeItem(DEMO_TOUR_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setCoachOpen(false);
    setProfileTourOpen(true);
  }

  function handlePersonClick(person: MapPerson) {
    const all = myLive ? [...people, myLive] : people;
    const found = all.find((p) => p.availability.id === person.availability.id);
    if (found) setSelected({ ...found, isSelf: found.profile.id === DEMO_ME_ID });
  }

  function handleGoLive(payload: GoLivePayload) {
    const name = draft.first_name.trim() || "You";
    const session: DemoPerson = {
      profile: {
        ...DEMO_ME_PROFILE,
        first_name: name,
        role: draft.role,
        company_type: draft.company_type,
        photo_url: draft.photo_url ?? pickSessionDemoMePhoto(),
        linkedin_url: draft.linkedin_url.trim() || null,
        twitter_url: draft.twitter_url.trim() || null,
        socials_visibility: draft.socials_visibility,
        avg_score: null,
        rating_count: 0,
      },
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
    setShowMatches(true);
    if (coachOpen) finishTourPersist();
    showToast(
      payload.match_preference === "vibe"
        ? `You're live. ${DEMO_TOP_MATCH_COUNT} vibe matches.`
        : `You're live. ${DEMO_TOP_MATCH_COUNT} people near you.`
    );
  }

  function handleStopLive() {
    setMyLive(null);
    setShowMatches(false);
    setSelected(null);
    showToast("You're off the map");
  }

  function handleConnect(userId: string) {
    setConnections((prev) => ({ ...prev, [userId]: "pending" }));
    showToast("Connect sent. Waiting on them…");
    setTimeout(() => {
      setConnections((prev) => ({ ...prev, [userId]: "accepted" }));
      showToast("You're a pair. They connected back. You can message.");
    }, 1500);
  }

  function handleMessage() {
    window.location.assign("/waitlist");
  }

  function getConnectionStatus(userId: string): "none" | "pending" | "accepted" {
    return connections[userId] ?? "none";
  }

  const preferVibe = myLive?.availability.match_preference === "vibe";
  const showIntroBanner =
    !myLive && tourHydrated && !profileTourOpen && !coachOpen;

  return (
    <div className="h-[100dvh] flex flex-col relative bg-paper overflow-hidden">
      {!matchesOpen && (
        <header className="absolute top-0 inset-x-0 z-[1000] p-3 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto bg-white/95 backdrop-blur rounded-xl px-3 py-2 shadow-lg border border-paper-3">
            <Logo size="sm" />
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            {tourHydrated && !tourBlocking && (
              <button
                type="button"
                onClick={handleReplayTour}
                className="text-sm bg-white/95 text-navy px-3.5 py-2 rounded-xl font-semibold border-2 border-navy/20 shadow-md"
              >
                Replay tour
              </button>
            )}
            <Link
              href="/waitlist"
              className="text-sm bg-navy text-white px-4 py-2 rounded-xl font-semibold shadow-md"
            >
              Waitlist
            </Link>
          </div>
        </header>
      )}

      <div
        className={`flex-1 relative min-h-0 ${
          matchesOpen
            ? "pointer-events-none touch-none overflow-hidden select-none"
            : ""
        }`}
        aria-hidden={matchesOpen || undefined}
      >
        <PopbyMapLoader
          people={mapPeople}
          center={DEMO_MAP_CENTER}
          zoom={10.7}
          onPersonClick={handlePersonClick}
          className="h-full w-full"
        />
      </div>

      {showIntroBanner && (
        <div className="absolute top-14 inset-x-3 z-[900] pointer-events-none">
          <div className="pointer-events-auto max-w-lg mx-auto">
            <div className="bg-white border-2 border-navy rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-navy text-white px-4 py-3.5">
                <p
                  className="text-lg font-bold tracking-tight leading-snug"
                  style={{ fontFamily: "var(--font-syne), system-ui, sans-serif" }}
                >
                  Simulated London crowd
                </p>
                <p className="text-sm text-white/85 mt-1 leading-snug">
                  Go live, and we pick {DEMO_TOP_MATCH_COUNT} people you should
                  meet.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!matchesOpen && (
        <div
          className="absolute inset-x-0 bottom-0 z-[1000] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-2.5 pointer-events-none"
        >
          {myLive ? (
            <div className="pointer-events-auto flex items-center gap-2.5 bg-navy text-white rounded-xl px-4 py-2.5 min-h-12 shadow-xl w-full max-w-sm">
              <span className="live-dot" />
              <span className="text-base font-medium flex-1">You&apos;re live</span>
              <button
                type="button"
                onClick={() => setShowMatches(true)}
                className="text-sm bg-accent rounded-lg px-3.5 min-h-10 font-semibold"
              >
                See matches
              </button>
              <button
                type="button"
                onClick={() => setShowGoLive(true)}
                className="text-base font-medium underline underline-offset-2 px-2 min-h-10"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleStopLive}
                className="text-base font-semibold bg-white/20 rounded-lg px-3.5 min-h-10"
              >
                Stop
              </button>
            </div>
          ) : (
            <button
              ref={goLiveBtnRef}
              type="button"
              onClick={() => setShowGoLive(true)}
              className="pointer-events-auto popby-btn popby-btn-accent shadow-xl text-base px-8 py-3.5 w-full max-w-sm"
            >
              <span className="live-dot" />
              I&apos;m free to hang out
            </button>
          )}
        </div>
      )}

      {matchesOpen && myLive && (
        <MatchCarousel
          matches={topMatches}
          me={myLive}
          origin={origin}
          preferVibe={preferVibe}
          getConnectionStatus={getConnectionStatus}
          onOpen={(p) => setSelected({ ...p })}
          onConnect={handleConnect}
          onBackToMap={() => setShowMatches(false)}
          onEdit={() => setShowGoLive(true)}
          onStop={handleStopLive}
        />
      )}

      {showGoLive && (
        <GoLiveModal
          demo
          onClose={() => setShowGoLive(false)}
          onLive={(payload) => payload && handleGoLive(payload)}
        />
      )}

      {selected && (
        <PersonSheet
          demo
          profile={selected.profile}
          availability={selected.availability}
          isSelf={selected.isSelf ?? false}
          connectionStatus={getConnectionStatus(selected.profile.id)}
          profileHref={
            selected.isSelf ? undefined : `/demo/person/${selected.profile.id}`
          }
          onConnect={() => handleConnect(selected.profile.id)}
          onMessage={handleMessage}
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

      {tourHydrated && (
        <DemoOnboardingTour
          draft={draft}
          onDraftChange={setDraft}
          profileOpen={profileTourOpen}
          coachOpen={coachOpen && !myLive}
          goLiveTargetRef={goLiveBtnRef}
          onSkipAll={handleSkipTour}
          onProfileDone={handleProfileDone}
          onCoachDone={handleCoachDone}
          onPromptGoLive={handlePromptGoLive}
        />
      )}

      {toast && (
        <div className="absolute top-16 inset-x-4 z-[1200] flex justify-center pointer-events-none">
          <div className="bg-navy text-white text-sm px-4 py-2.5 rounded-xl shadow-lg max-w-xs text-center">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
