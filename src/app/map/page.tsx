"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PopbyMapLoader, { type MapPerson } from "@/components/PopbyMapLoader";
import Logo from "@/components/Logo";
import GoLiveModal from "@/components/GoLiveModal";
import PersonSheet from "@/components/PersonSheet";
import RatingModal from "@/components/RatingModal";
import {
  LONDON_CENTER,
  distanceMetres,
  formatDistance,
  hangoutSummary,
} from "@/lib/constants";
import type { Availability, Connection, Profile } from "@/lib/types";

type PersonWithMeta = MapPerson & {
  profile: Profile & { avg_score?: number | null; rating_count?: number };
};

export default function MapPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [people, setPeople] = useState<PersonWithMeta[]>([]);
  const [selected, setSelected] = useState<PersonWithMeta | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [showGoLive, setShowGoLive] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [myLiveSession, setMyLiveSession] = useState<Availability | null>(null);

  const fetchAvailability = useCallback(async () => {
    await supabase.rpc("expire_availability");

    const { data: sessions } = await supabase
      .from("availability")
      .select(
        `
        *,
        profile:profiles(
          id, first_name, photo_url, role, company_type, bio,
          linkedin_url, twitter_url, luma_profile_url, socials_visibility,
          onboarding_completed
        )
      `
      )
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString());

    if (!sessions) return;

    const userIds = sessions.map((s) => s.user_id);
    const { data: ratings } = await supabase
      .from("profile_ratings")
      .select("*")
      .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

    const ratingMap = new Map((ratings ?? []).map((r) => [r.user_id, r]));

    const mapped: PersonWithMeta[] = sessions
      .filter((s) => s.profile)
      .map((s) => {
        const rating = ratingMap.get(s.user_id);
        const profile = s.profile as Profile;
        return {
          availability: s as Availability,
          first_name: profile.first_name,
          photo_url: profile.photo_url,
          role: profile.role,
          isSelf: s.user_id === userId,
          profile: {
            ...profile,
            avg_score: rating?.avg_score ?? null,
            rating_count: rating?.rating_count ?? 0,
          },
        };
      });

    setPeople(mapped);
    setMyLiveSession(mapped.find((p) => p.isSelf)?.availability ?? null);
  }, [supabase, userId]);

  const fetchConnections = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("connections")
      .select("*")
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);
    setConnections(data ?? []);

    const pending = (data ?? []).filter(
      (c) => c.to_user_id === userId && c.status === "pending"
    ).length;
    setPendingCount(pending);
  }, [supabase, userId]);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile?.onboarding_completed || !profile.first_name) {
        router.push("/onboarding");
        return;
      }
      setMyProfile(profile);
    }
    init();
  }, [router, supabase]);

  useEffect(() => {
    if (!userId) return;
    fetchAvailability();
    fetchConnections();

    const channel = supabase
      .channel("map-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "availability" },
        () => fetchAvailability()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connections" },
        () => fetchConnections()
      )
      .subscribe();

    const interval = setInterval(fetchAvailability, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [userId, fetchAvailability, fetchConnections, supabase]);

  const origin = useMemo(() => {
    if (myLiveSession) {
      return { lat: myLiveSession.lat, lng: myLiveSession.lng };
    }
    return LONDON_CENTER;
  }, [myLiveSession]);

  const rankedPeople = useMemo(() => {
    const others = people.filter((p) => !p.isSelf);
    const preferVibe = myLiveSession?.match_preference === "vibe";
    return [...others].sort((a, b) => {
      if (preferVibe && myLiveSession) {
        const score = (p: PersonWithMeta) => {
          let s = 0;
          if (p.availability.hangout_format === myLiveSession.hangout_format)
            s += 2;
          if (p.availability.hangout_intent === myLiveSession.hangout_intent)
            s += 3;
          return s;
        };
        const diff = score(b) - score(a);
        if (diff !== 0) return diff;
      }
      return (
        distanceMetres(origin, {
          lat: a.availability.lat,
          lng: a.availability.lng,
        }) -
        distanceMetres(origin, {
          lat: b.availability.lat,
          lng: b.availability.lng,
        })
      );
    });
  }, [people, myLiveSession, origin]);

  function getConnectionStatus(otherUserId: string): Connection["status"] | "none" {
    const conn = connections.find(
      (c) =>
        (c.from_user_id === userId && c.to_user_id === otherUserId) ||
        (c.from_user_id === otherUserId && c.to_user_id === userId)
    );
    return conn?.status ?? "none";
  }

  function getConnection(otherUserId: string): Connection | undefined {
    return connections.find(
      (c) =>
        (c.from_user_id === userId && c.to_user_id === otherUserId) ||
        (c.from_user_id === otherUserId && c.to_user_id === userId)
    );
  }

  async function handleConnect() {
    if (!selected || !userId) return;
    const { error } = await supabase.from("connections").insert({
      from_user_id: userId,
      to_user_id: selected.profile.id,
      availability_id: selected.availability.id,
      status: "pending",
    });
    if (!error) fetchConnections();
  }

  async function handleStopLive() {
    if (!userId) return;
    await supabase
      .from("availability")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("is_active", true);
    setSelected(null);
    fetchAvailability();
  }

  async function acceptPending(connectionId: string) {
    await supabase
      .from("connections")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", connectionId);
    fetchConnections();
  }

  const pendingIncoming = connections.filter(
    (c) => c.to_user_id === userId && c.status === "pending"
  );

  return (
    <div className="h-screen flex flex-col relative">
      <header className="absolute top-0 inset-x-0 z-[1000] p-4 flex items-center justify-between pointer-events-none">
        <Link
          href="/"
          aria-label="Popby home"
          className="pointer-events-auto bg-white/95 backdrop-blur rounded-xl px-3 py-2 shadow-lg border border-paper-3 cursor-pointer"
        >
          <Logo size="sm" />
        </Link>
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href="/messages"
            className="relative bg-white/95 backdrop-blur rounded-full px-5 min-h-[52px] inline-flex items-center shadow-lg border border-paper-3 text-lg font-medium hover:bg-white"
          >
            Messages
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-accent text-white text-base font-bold rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </Link>
          <Link
            href="/profile"
            className="bg-white/95 backdrop-blur rounded-full w-[52px] h-[52px] shadow-lg border border-paper-3 overflow-hidden"
          >
            {myProfile?.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={myProfile.photo_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="flex items-center justify-center h-full text-lg font-bold text-navy bg-paper">
                {myProfile?.first_name?.[0] ?? "?"}
              </span>
            )}
          </Link>
        </div>
      </header>

      <div className="absolute top-16 inset-x-3 z-[900] pointer-events-none">
        <div className="pointer-events-auto max-w-md mx-auto space-y-2">
          {myLiveSession && (
            <p className="text-center text-lg text-navy/70 bg-white/95 backdrop-blur rounded-xl px-3.5 py-3.5 border border-paper-3">
              {myLiveSession.match_preference === "vibe"
                ? "Sorted by hangout vibe · edit when you go live again"
                : "Sorted by closest · edit when you go live again"}
            </p>
          )}
          {rankedPeople.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {rankedPeople.slice(0, 5).map((p) => {
                const metres = distanceMetres(origin, {
                  lat: p.availability.lat,
                  lng: p.availability.lng,
                });
                return (
                  <button
                    key={p.profile.id}
                    type="button"
                    onClick={() => setSelected(p)}
                    className="flex-shrink-0 flex items-center gap-2.5 bg-white/95 backdrop-blur border border-paper-3 rounded-xl px-3 py-3.5 min-h-[56px] shadow text-left"
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-paper-2 flex-shrink-0">
                      {p.profile.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.profile.photo_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center text-lg font-bold text-accent">
                          {p.profile.first_name[0]}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-navy truncate">
                        {p.profile.first_name}
                      </p>
                      <p className="text-lg text-navy/70 truncate max-w-[140px]">
                        {formatDistance(metres)} ·{" "}
                        {hangoutSummary(
                          p.availability.hangout_format,
                          p.availability.hangout_intent
                        )}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 relative">
        <PopbyMapLoader
          people={people}
          onPersonClick={(p) => setSelected(p as PersonWithMeta)}
          className="h-full"
        />
      </div>

      <div className="absolute bottom-6 inset-x-0 flex justify-center z-[1000] px-4">
        {myLiveSession ? (
          <div className="flex items-center gap-3 bg-navy text-white rounded-xl px-5 py-3.5 min-h-[56px] shadow-xl">
            <span className="live-dot" />
            <span className="text-xl font-semibold">You&apos;re live</span>
            <button
              onClick={() => setShowGoLive(true)}
              className="text-lg font-semibold underline underline-offset-2 px-3 min-h-[52px] inline-flex items-center"
            >
              Edit
            </button>
            <button
              onClick={handleStopLive}
              className="text-lg font-semibold bg-white/20 rounded-lg px-4 min-h-[52px] inline-flex items-center"
            >
              Stop
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowGoLive(true)}
            className="popby-btn popby-btn-accent shadow-xl text-xl px-8 min-h-[56px]"
          >
            <span
              className="live-dot bg-white"
              style={{ animation: "none", opacity: 1 }}
            />
            I&apos;m free to hang out
          </button>
        )}
      </div>

      {pendingIncoming.length > 0 && (
        <div className="absolute top-[9.5rem] inset-x-4 z-[1000] space-y-2 max-w-md mx-auto">
          {pendingIncoming.map((c) => (
            <div
              key={c.id}
              className="popby-card p-3 flex items-center justify-between gap-3"
            >
              <p className="text-lg">Someone wants to connect!</p>
              <div className="flex gap-2">
                <button
                  onClick={() => acceptPending(c.id)}
                  className="popby-btn popby-btn-accent text-lg py-3.5 px-5 min-h-[52px]"
                >
                  Accept
                </button>
                <Link
                  href="/messages"
                  className="popby-btn popby-btn-ghost text-lg py-3.5 px-5 min-h-[52px]"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showGoLive && userId && (
        <GoLiveModal
          userId={userId}
          needsPhoto={!myProfile?.photo_url}
          onClose={() => setShowGoLive(false)}
          onPhotoAdded={() => {
            /* refreshed onLive below */
          }}
          onLive={() => {
            setShowGoLive(false);
            fetchAvailability();
            supabase
              .from("profiles")
              .select("*")
              .eq("id", userId)
              .single()
              .then(({ data }) => {
                if (data) setMyProfile(data);
              });
          }}
        />
      )}

      {selected && (
        <PersonSheet
          profile={selected.profile}
          availability={selected.availability}
          isSelf={selected.isSelf ?? false}
          connectionStatus={
            getConnectionStatus(selected.profile.id) as
              | "none"
              | "pending"
              | "accepted"
              | "declined"
          }
          onConnect={handleConnect}
          onMessage={() => {
            const conn = getConnection(selected.profile.id);
            if (conn) router.push(`/messages/${conn.id}`);
          }}
          onRate={() => setShowRating(true)}
          onClose={() => setSelected(null)}
          onStopLive={handleStopLive}
        />
      )}

      {showRating && selected && userId && (
        <RatingModal
          connectionId={getConnection(selected.profile.id)?.id ?? ""}
          toUserId={selected.profile.id}
          toUserName={selected.profile.first_name}
          fromUserId={userId}
          onClose={() => setShowRating(false)}
          onSubmitted={() => {
            setShowRating(false);
            fetchAvailability();
          }}
        />
      )}

      {people.length === 0 && !myLiveSession && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[500] pointer-events-none text-center px-6">
          <p className="text-navy/80 text-lg bg-white/80 backdrop-blur rounded-2xl px-5 py-3 shadow">
            No one live right now. Be the first: tap the button below.
          </p>
        </div>
      )}
    </div>
  );
}
