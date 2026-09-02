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
  clearDemoTourDone,
  markDemoTourDone,
  markDemoTourSkipped,
  readDemoTourStatus,
  shouldAutoOpenDemoTour,
  type DemoProfileDraft,
  type DemoTourStatus,
} from "@/components/DemoOnboardingTour";
import {
  DEMO_ME_ID,
  DEMO_ME_PROFILE,
  DEMO_TOP_MATCH_COUNT,
  INITIAL_DEMO_PEOPLE,
  newDemoMatchBatchSeed,
  pickSessionDemoMePhoto,
  subsampleForMap,
  toMapPeople,
  topDemoMatches,
  type DemoPerson,
} from "@/lib/demo-data";
import { ALL_DEMO_PORTRAIT_URLS } from "@/lib/demo-portraits";
import { LONDON_CENTER } from "@/lib/constants";

/** Frames the central London pin cluster (not Greater London empty outskirts). */
const DEMO_MAP_CENTER: [number, number] = [51.505, -0.115];
const DEMO_MAP_ZOOM = 12;

type ConnectionMap = Record<string, "none" | "pending" | "accepted">;

type SelectedPerson = DemoPerson & { isSelf?: boolean };

/** Full interactive demo — real London map, fake crowd, no Supabase. */
export default function DemoPage() {
  const [people] = useState<DemoPerson[]>(INITIAL_DEMO_PEOPLE);
  const [myLive, setMyLive] = useState<DemoPerson | null>(null);
  const [matchBatchSeed, setMatchBatchSeed] = useState(0);
  const [selected, setSelected] = useState<SelectedPerson | null>(null);
  const [showGoLive, setShowGoLive] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showMatches, setShowMatches] = useState(false);
  const [connections, setConnections] = useState<ConnectionMap>({});
  const [toast, setToast] = useState<string | null>(null);

  const [draft, setDraft] = useState<DemoProfileDraft>(DEFAULT_DEMO_DRAFT);
  const [tourHydrated, setTourHydrated] = useState(false);
  const [tourStatus, setTourStatus] = useState<DemoTourStatus>(null);
  const [profileTourOpen, setProfileTourOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const goLiveBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Warm the portrait cache so map pins don't sit on the accent circle.
    for (const url of ALL_DEMO_PORTRAIT_URLS) {
      const img = new window.Image();
      img.decoding = "async";
      img.src = url;
    }
  }, []);

  useEffect(() => {
    const status = readDemoTourStatus();
    setTourStatus(status);
    setTourHydrated(true);
    if (shouldAutoOpenDemoTour()) setProfileTourOpen(true);
  }, []);

  const origin = useMemo(() => {
    if (myLive) {
      return { lat: myLive.availability.lat, lng: myLive.availability.lng };
    }
    return LONDON_CENTER;
  }, [myLive]);

  const topMatches = useMemo(
    () =>
      myLive
        ? topDemoMatches(people, origin, myLive, DEMO_TOP_MATCH_COUNT, matchBatchSeed)
        : [],
    [people, myLive, origin, matchBatchSeed]
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
    markDemoTourDone();
    setTourStatus("done");
    setProfileTourOpen(false);
    setCoachOpen(false);
  }

  function handleSkipTour() {
    markDemoTourSkipped();
    setTourStatus("skipped");
    setProfileTourOpen(false);
    setCoachOpen(false);
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

  function handleStartTour() {
    setMyLive(null);
    setShowMatches(false);
    setShowGoLive(false);
    setSelected(null);
    setDraft({ ...DEFAULT_DEMO_DRAFT });
    setCoachOpen(false);
    setProfileTourOpen(true);
  }

  function handleReplayTour() {
    clearDemoTourDone();
    setTourStatus(null);
    handleStartTour();
  }

  function handlePersonClick(person: MapPerson) {
    const all = myLive ? [...people, myLive] : people;
    const found = all.find((p) => p.availability.id === person.availability.id);
    if (found) setSelected({ ...found, isSelf: found.profile.id === DEMO_ME_ID });
  }

  function handleGoLive(payload: GoLivePayload) {
    const name = draft.first_name.trim() || "You";
    // New seed each go-live so Top 5 rotates across replay / re-test sessions.
    setMatchBatchSeed(newDemoMatchBatchSeed());
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
  const showTourNudge =
    showIntroBanner && tourStatus === "skipped";

  return (
    <div className="h-[100dvh] flex flex-col relative bg-paper overflow-hidden">
      {!matchesOpen && (
        <header className="absolute top-0 inset-x-0 z-[1000] p-3 flex items-center justify-between gap-2 pointer-events-none">
          <Logo
            size="sm"
            className="pointer-events-auto bg-white/95 backdrop-blur rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-lg border border-paper-3 cursor-pointer shrink-0 max-w-[42%]"
          />
          <div className="pointer-events-auto flex items-center gap-2 shrink-0">
            {tourHydrated && !tourBlocking && (
              <button
                type="button"
                onClick={handleReplayTour}
                className="text-base sm:text-lg bg-white/95 text-navy px-3 sm:px-4 min-h-[44px] sm:min-h-[52px] inline-flex items-center rounded-xl font-semibold border-2 border-navy/20 shadow-md whitespace-nowrap"
              >
                <span className="sm:hidden">Tour</span>
                <span className="hidden sm:inline">Replay tour</span>
              </button>
            )}
            <Link
              href="/waitlist"
              className="text-base sm:text-lg bg-navy text-white px-3 sm:px-5 min-h-[44px] sm:min-h-[52px] inline-flex items-center rounded-xl font-semibold shadow-md whitespace-nowrap"
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
          zoom={DEMO_MAP_ZOOM}
          onPersonClick={handlePersonClick}
          className="h-full w-full"
        />
      </div>

      {showIntroBanner && (
        <div className="absolute top-[4.75rem] sm:top-16 inset-x-3 z-[900] pointer-events-none">
          <div className="pointer-events-auto max-w-lg mx-auto">
            <div className="bg-white border-2 border-navy rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-navy text-white px-4 py-3.5">
                <p
                  className="text-lg font-bold tracking-tight leading-snug"
                  style={{ fontFamily: "var(--font-syne), system-ui, sans-serif" }}
                >
                  Simulated London crowd
                </p>
                <p className="text-lg text-white/85 mt-1 leading-snug">
                  {showTourNudge
                    ? "A one-minute walkthrough helps — or just go live."
                    : `Go live, and we pick ${DEMO_TOP_MATCH_COUNT} people you should meet.`}
                </p>
                {showTourNudge && (
                  <button
                    type="button"
                    onClick={handleStartTour}
                    className="mt-3 text-lg font-semibold bg-white text-navy rounded-lg px-4 min-h-[44px] inline-flex items-center"
                  >
                    Take the tour
                  </button>
                )}
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
            <div className="pointer-events-auto flex items-center gap-2.5 bg-navy text-white rounded-xl px-4 py-3.5 min-h-[56px] shadow-xl w-full max-w-md">
              <span className="live-dot" />
              <span className="text-xl font-semibold flex-1">You&apos;re live</span>
              <button
                type="button"
                onClick={() => setShowMatches(true)}
                className="text-lg bg-accent rounded-lg px-3.5 min-h-[52px] font-semibold inline-flex items-center"
              >
                See matches
              </button>
              <button
                type="button"
                onClick={() => setShowGoLive(true)}
                className="text-lg font-semibold underline underline-offset-2 px-2.5 min-h-[52px] inline-flex items-center"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleStopLive}
                className="text-lg font-semibold bg-white/20 rounded-lg px-3.5 min-h-[52px] inline-flex items-center"
              >
                Stop
              </button>
            </div>
          ) : (
            <button
              ref={goLiveBtnRef}
              type="button"
              onClick={() => setShowGoLive(true)}
              className="pointer-events-auto popby-btn popby-btn-accent shadow-xl text-xl px-8 min-h-[56px] w-full max-w-sm"
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
          <div className="bg-navy text-white text-lg px-4 py-3.5 rounded-xl shadow-lg max-w-xs text-center">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
