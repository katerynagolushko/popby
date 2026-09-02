"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DURATIONS, HANGOUT_TYPES, LONDON_CENTER } from "@/lib/constants";
import type { HangoutType } from "@/lib/types";
import PopbyMapLoader from "./PopbyMapLoader";

export interface GoLivePayload {
  lat: number;
  lng: number;
  hangout_type: HangoutType;
  hangout_note: string | null;
  duration_minutes: 30 | 60 | 120;
  expires_at: string;
}

interface GoLiveModalProps {
  userId?: string;
  demo?: boolean;
  onClose: () => void;
  onLive: (payload?: GoLivePayload) => void;
}

export default function GoLiveModal({
  userId,
  demo = false,
  onClose,
  onLive,
}: GoLiveModalProps) {
  const supabase = demo ? null : createClient();
  const [hangoutType, setHangoutType] = useState<HangoutType>("coffee");
  const [hangoutNote, setHangoutNote] = useState("");
  const [duration, setDuration] = useState<30 | 60 | 120>(60);
  const [location, setLocation] = useState<[number, number] | null>([
    LONDON_CENTER.lat,
    LONDON_CENTER.lng,
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoLive() {
    if (!location) {
      setError("Pick a spot on the map");
      return;
    }

    const expiresAt = new Date(Date.now() + duration * 60 * 1000).toISOString();
    const payload: GoLivePayload = {
      lat: location[0],
      lng: location[1],
      hangout_type: hangoutType,
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
      hangout_type: payload.hangout_type,
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
            <p className="text-xs text-muted">People nearby can see you</p>
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
          <div>
            <label className="block text-sm font-medium mb-2 text-navy">
              What for?
            </label>
            <div className="flex flex-wrap gap-2">
              {HANGOUT_TYPES.map((h) => (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => setHangoutType(h.value)}
                  className={`popby-chip ${hangoutType === h.value ? "popby-chip-selected" : ""}`}
                >
                  {h.emoji} {h.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-navy">
              Note <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              value={hangoutNote}
              onChange={(e) => setHangoutNote(e.target.value)}
              className="popby-input"
              placeholder="e.g. happy to give product feedback"
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
            <label className="block text-sm font-medium mb-2 text-navy">
              Approximate spot — tap the map
            </label>
            <div className="h-48 rounded-2xl overflow-hidden border border-paper-3 relative">
              <PopbyMapLoader
                people={[]}
                pickMode
                pickedLocation={location}
                onPickLocation={(lat, lng) => setLocation([lat, lng])}
                className="h-full"
                zoom={15}
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
            {loading ? "Going live…" : "I'm free — show me on the map"}
          </button>
        </div>
      </div>
    </div>
  );
}
