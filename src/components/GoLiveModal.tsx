"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DURATIONS,
  HANGOUT_FORMATS,
  HANGOUT_INTENTS,
  LONDON_BOUNDS,
  LONDON_CENTER,
} from "@/lib/constants";
import type { HangoutFormat, HangoutIntent, MatchPreference } from "@/lib/types";
import PopbyMapLoader from "./PopbyMapLoader";

function clampToLondon(lat: number, lng: number): [number, number] {
  return [
    Math.min(LONDON_BOUNDS.north, Math.max(LONDON_BOUNDS.south, lat)),
    Math.min(LONDON_BOUNDS.east, Math.max(LONDON_BOUNDS.west, lng)),
  ];
}

export interface GoLivePayload {
  lat: number;
  lng: number;
  hangout_format: HangoutFormat;
  hangout_intent: HangoutIntent;
  match_preference: MatchPreference;
  hangout_note: string | null;
  duration_minutes: 30 | 60 | 120;
  expires_at: string;
}

interface GoLiveModalProps {
  userId?: string;
  demo?: boolean;
  needsPhoto?: boolean;
  onClose: () => void;
  onLive: (payload?: GoLivePayload) => void;
  onPhotoAdded?: () => void;
}

export default function GoLiveModal({
  userId,
  demo = false,
  needsPhoto = false,
  onClose,
  onLive,
  onPhotoAdded,
}: GoLiveModalProps) {
  const supabase = demo ? null : createClient();
  const [format, setFormat] = useState<HangoutFormat>("coffee");
  const [intent, setIntent] = useState<HangoutIntent>("just_hang");
  const [matchPreference, setMatchPreference] =
    useState<MatchPreference>("nearest");
  const [hangoutNote, setHangoutNote] = useState("");
  const [duration, setDuration] = useState<30 | 60 | 120>(60);
  const [location, setLocation] = useState<[number, number]>([
    LONDON_CENTER.lat,
    LONDON_CENTER.lng,
  ]);
  /** Map view center — GPS may update once; never after the user places a pin. */
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    LONDON_CENTER.lat,
    LONDON_CENTER.lng,
  ]);
  const [locStatus, setLocStatus] = useState<"idle" | "asking" | "got" | "denied">(
    "idle"
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userPickedRef = useRef(false);

  useEffect(() => {
    // One-shot GPS as initial default only — never overwrite after the user picks
    if (!navigator.geolocation) {
      setLocStatus("denied");
      return;
    }
    setLocStatus("asking");
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled || userPickedRef.current) {
          if (!cancelled) setLocStatus("got");
          return;
        }
        const next = clampToLondon(pos.coords.latitude, pos.coords.longitude);
        setLocation(next);
        setMapCenter(next);
        setLocStatus("got");
      },
      () => {
        if (!cancelled) setLocStatus("denied");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  function handlePickLocation(lat: number, lng: number) {
    userPickedRef.current = true;
    setLocation(clampToLondon(lat, lng));
  }

  async function uploadPhotoIfNeeded(): Promise<boolean> {
    if (!needsPhoto || !photoFile || !userId || !supabase) return true;
    const ext = photoFile.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(path, photoFile, { upsert: true });
    if (uploadError) {
      setError("Photo upload failed. You can still go live.");
      return true;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("profile-photos").getPublicUrl(path);
    await supabase
      .from("profiles")
      .update({ photo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", userId);
    onPhotoAdded?.();
    return true;
  }

  async function handleGoLive() {
    const expiresAt = new Date(Date.now() + duration * 60 * 1000).toISOString();
    const payload: GoLivePayload = {
      lat: location[0],
      lng: location[1],
      hangout_format: format,
      hangout_intent: intent,
      match_preference: matchPreference,
      hangout_note: hangoutNote.trim() || null,
      duration_minutes: duration,
      expires_at: expiresAt,
    };

    if (demo) {
      onLive(payload);
      return;
    }

    if (!userId || !supabase) return;

    setLoading(true);
    setError(null);
    await uploadPhotoIfNeeded();

    await supabase.rpc("expire_availability");

    await supabase
      .from("availability")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("is_active", true);

    const { error: insertError } = await supabase.from("availability").insert({
      user_id: userId,
      lat: payload.lat,
      lng: payload.lng,
      hangout_format: payload.hangout_format,
      hangout_intent: payload.hangout_intent,
      match_preference: payload.match_preference,
      hangout_note: payload.hangout_note,
      duration_minutes: payload.duration_minutes,
      expires_at: payload.expires_at,
      is_active: true,
    });

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    onLive(payload);
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-paper w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-2xl pb-[env(safe-area-inset-bottom)]">
        <div className="p-5 border-b border-paper-3 flex items-center justify-between sticky top-0 bg-paper z-10">
          <div>
            <h2 className="text-xl text-navy font-display">Go live</h2>
            <p className="text-xs text-muted">
              {demo
                ? "Demo: matches rank against your picks"
                : "People nearby can see you while you're live"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-paper-2 flex items-center justify-center text-muted hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          {needsPhoto && (
            <div className="p-3 rounded-xl bg-paper-2 border border-paper-3">
              <p className="text-sm font-medium text-navy mb-2">
                Add a photo so people can find you here
              </p>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-paper border border-paper-3 flex items-center justify-center flex-shrink-0">
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted">Photo</span>
                  )}
                </div>
                <span className="text-sm text-muted">Tap to take or upload</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setPhotoFile(file);
                    setPhotoPreview(URL.createObjectURL(file));
                  }}
                />
              </label>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-navy">
              How?
            </label>
            <div className="flex flex-wrap gap-2">
              {HANGOUT_FORMATS.map((h) => (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => setFormat(h.value)}
                  className={`popby-chip ${format === h.value ? "popby-chip-selected" : ""}`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-navy">
              Why?
            </label>
            <div className="flex flex-wrap gap-2">
              {HANGOUT_INTENTS.map((h) => (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => setIntent(h.value)}
                  className={`popby-chip ${intent === h.value ? "popby-chip-selected" : ""}`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-navy">
              Show me
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMatchPreference("nearest")}
                className={`popby-chip justify-center ${matchPreference === "nearest" ? "popby-chip-selected" : ""}`}
              >
                Closest to me
              </button>
              <button
                type="button"
                onClick={() => setMatchPreference("vibe")}
                className={`popby-chip justify-center ${matchPreference === "vibe" ? "popby-chip-selected" : ""}`}
              >
                Most my vibe
              </button>
            </div>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              {matchPreference === "nearest"
                ? "Closest pins first."
                : "Same format and intent first (coffee + product feedback, etc.), then distance."}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-navy">
              Note <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              value={hangoutNote}
              onChange={(e) => setHangoutNote(e.target.value)}
              className="popby-input"
              placeholder="e.g. Ozone Coffee, 2 hours free"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-navy">
              How long?
            </label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDuration(d.value)}
                  className={`popby-chip flex-1 justify-center ${duration === d.value ? "popby-chip-selected" : ""}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-navy">
              Approximate spot
            </label>
            <p className="text-xs text-muted mb-2 leading-relaxed">
              Rough pin for this hangout only. Location turns off when you stop.
              No background tracking.
              {locStatus === "asking" && " Getting your spot…"}
              {locStatus === "got" && " Got it. Drag or tap anywhere in London."}
              {locStatus === "denied" &&
                " No GPS. Tap or drag the pin anywhere in London."}
            </p>
            <div className="h-48 rounded-2xl overflow-hidden border border-paper-3 relative">
              <PopbyMapLoader
                people={[]}
                pickMode
                center={mapCenter}
                pickedLocation={location}
                onPickLocation={handlePickLocation}
                className="h-full"
                zoom={13}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleGoLive}
            disabled={loading}
            className="popby-btn popby-btn-accent w-full disabled:opacity-50"
          >
            {loading ? "Going live…" : "I'm free. Show me on the map"}
          </button>
        </div>
      </div>
    </div>
  );
}
