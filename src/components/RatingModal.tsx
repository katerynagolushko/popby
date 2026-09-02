"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface RatingModalProps {
  connectionId: string;
  toUserId: string;
  toUserName: string;
  fromUserId: string;
  demo?: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function RatingModal({
  connectionId,
  toUserId,
  toUserName,
  fromUserId,
  demo = false,
  onClose,
  onSubmitted,
}: RatingModalProps) {
  const supabase = demo ? null : createClient();
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (demo) {
      setLoading(false);
      onSubmitted();
      return;
    }

    if (!supabase) return;

    const { error: insertError } = await supabase.from("ratings").insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      connection_id: connectionId,
      score,
      comment: comment.trim() || null,
    });

    setLoading(false);
    if (insertError) {
      if (insertError.code === "23505") {
        setError("You already rated this hangout.");
      } else {
        setError(insertError.message);
      }
      return;
    }
    onSubmitted();
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative popby-card p-6 w-full max-w-sm space-y-4"
      >
        <h2 className="text-xl text-navy font-display">Rate {toUserName}</h2>
        <p className="text-sm text-muted">
          How was the hangout? Helps everyone feel safe.
        </p>

        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setScore(n)}
              className={`text-2xl transition-transform ${n <= score ? "scale-110 text-accent" : "opacity-30 grayscale"}`}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="popby-input min-h-[70px] resize-none"
          placeholder="Optional comment"
          maxLength={200}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="popby-btn popby-btn-ghost flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="popby-btn popby-btn-accent flex-1 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
