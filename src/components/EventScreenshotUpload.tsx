"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserEvent } from "@/lib/types";
import type { ExtractedEvent } from "@/app/api/extract-events/route";

interface EventScreenshotUploadProps {
  userId: string;
  onEventsAdded: (events: UserEvent[]) => void;
}

export default function EventScreenshotUpload({
  userId,
  onEventsAdded,
}: EventScreenshotUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setSuccess(null);
    setExtracted(null);
    setPreview(URL.createObjectURL(file));
    setLoading(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/extract-events", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Extraction failed");
        setLoading(false);
        return;
      }

      if (!data.events?.length) {
        setError("No events found in that screenshot. Try a clearer shot of your Luma calendar.");
        setLoading(false);
        return;
      }

      setExtracted(data.events);
    } catch {
      setError("Upload failed. Check your connection.");
    }
    setLoading(false);
  }

  async function saveExtracted() {
    if (!extracted?.length) return;
    setLoading(true);
    setError(null);

    const rows = extracted.map((e) => ({
      user_id: userId,
      title: e.title,
      event_url: e.event_url,
      event_date: e.event_date,
    }));

    const { data, error: insertError } = await supabase
      .from("user_events")
      .insert(rows)
      .select();

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    onEventsAdded(data ?? []);
    setExtracted(null);
    setPreview(null);
    setSuccess(`Added ${data?.length ?? 0} events`);
    setTimeout(() => setSuccess(null), 3000);
  }

  return (
    <div className="space-y-4">
      <div
        onClick={() => !loading && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
          loading
            ? "border-paper-3 bg-paper-2 opacity-70"
            : "border-paper-3 hover:border-accent hover:bg-paper-2"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />

        {preview ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Screenshot preview"
              className="max-h-40 mx-auto rounded-lg border border-paper-3 object-contain"
            />
            {loading && (
              <p className="text-sm text-muted animate-pulse">Reading your calendar…</p>
            )}
          </div>
        ) : (
          <>
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-navy flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="#ff5722" strokeWidth="1.5" />
                <circle cx="8" cy="11" r="2" fill="#ff5722" />
                <path d="M12 15l2-2 3 3" stroke="#ff5722" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-medium text-navy">Upload Luma screenshot</p>
            <p className="text-xs text-muted mt-1 max-w-xs mx-auto leading-relaxed">
              Screenshot your upcoming events in Luma. We&apos;ll pull out names, dates, and links.
            </p>
          </>
        )}
      </div>

      {extracted && extracted.length > 0 && (
        <div className="popby-card p-4 space-y-3">
          <p className="text-sm font-medium text-navy">
            Found {extracted.length} event{extracted.length !== 1 ? "s" : ""}
          </p>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {extracted.map((e, i) => (
              <li key={i} className="text-sm p-2.5 bg-paper-2 rounded-xl border border-paper-3">
                <p className="font-medium">{e.title}</p>
                {e.event_date && (
                  <p className="text-xs text-muted mt-0.5">
                    {new Date(e.event_date).toLocaleString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setExtracted(null);
                setPreview(null);
              }}
              className="popby-btn popby-btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              onClick={saveExtracted}
              disabled={loading}
              className="popby-btn popby-btn-accent flex-1 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Add all"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700 font-medium">{success}</p>}
    </div>
  );
}
