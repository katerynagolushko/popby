"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import EventScreenshotUpload from "@/components/EventScreenshotUpload";
import { ROLES } from "@/lib/constants";
import type { Role, UserEvent } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [role, setRole] = useState<Role>("founder");
  const [bio, setBio] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [lumaProfileUrl, setLumaProfileUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setFirstName(data.first_name ?? "");
        setRole(data.role ?? "founder");
        setBio(data.bio ?? "");
        setLinkedinUrl(data.linkedin_url ?? "");
        setTwitterUrl(data.twitter_url ?? "");
        setLumaProfileUrl(data.luma_profile_url ?? "");
        setPhotoUrl(data.photo_url);
      }

      const { data: evts } = await supabase
        .from("user_events")
        .select("*")
        .eq("user_id", user.id)
        .order("event_date", { ascending: true });
      setEvents(evts ?? []);
    }
    load();
  }, [router, supabase]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim(),
        role,
        bio: bio.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        twitter_url: twitterUrl.trim() || null,
        luma_profile_url: lumaProfileUrl.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setSaving(false);
    setMessage("Saved");
    setTimeout(() => setMessage(null), 2000);
  }

  async function removeEvent(id: string) {
    await supabase.from("user_events").delete().eq("id", id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-paper pb-12">
      <header className="sticky top-0 bg-paper/95 backdrop-blur border-b border-paper-3 px-4 py-4 flex items-center gap-3">
        <Link href="/map" className="text-muted hover:text-ink">
          ←
        </Link>
        <h1 className="text-xl text-navy font-display">Your profile</h1>
      </header>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        <form onSubmit={handleSave} className="popby-card p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-paper-2 border-2 border-paper-3">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="flex items-center justify-center h-full text-muted text-sm">
                  No photo
                </span>
              )}
            </div>
            <Link href="/onboarding" className="text-sm text-accent font-medium">
              Change photo
            </Link>
          </div>

          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="popby-input"
            placeholder="First name"
          />

          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`popby-chip ${role === r.value ? "popby-chip-selected" : ""}`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="popby-input min-h-[70px] resize-none"
            placeholder="Bio"
          />

          <input
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            className="popby-input"
            placeholder="LinkedIn"
          />
          <input
            value={twitterUrl}
            onChange={(e) => setTwitterUrl(e.target.value)}
            className="popby-input"
            placeholder="X / Twitter"
          />
          <input
            value={lumaProfileUrl}
            onChange={(e) => setLumaProfileUrl(e.target.value)}
            className="popby-input"
            placeholder="Luma profile URL"
          />

          <button
            type="submit"
            disabled={saving}
            className="popby-btn popby-btn-accent w-full"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
          {message && (
            <p className="text-sm text-green-700 text-center">{message}</p>
          )}
        </form>

        <section className="popby-card p-5">
          <h2 className="text-lg text-navy mb-1 font-display">Events I&apos;m going to</h2>
          <p className="text-xs text-muted mb-4 leading-relaxed">
            Screenshot your Luma calendar — we extract the events automatically.
          </p>

          {userId && (
            <EventScreenshotUpload
              userId={userId}
              onEventsAdded={(added) => setEvents((prev) => [...prev, ...added])}
            />
          )}

          <ul className="space-y-2 mt-4">
            {events.map((ev) => (
              <li
                key={ev.id}
                className="flex items-center justify-between gap-2 p-3 bg-paper rounded-xl border border-paper-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate text-navy">{ev.title}</p>
                  {ev.event_date && (
                    <p className="text-xs text-muted">
                      {new Date(ev.event_date).toLocaleString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                  {ev.event_url && (
                    <a
                      href={ev.event_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent underline"
                    >
                      View on Luma
                    </a>
                  )}
                </div>
                <button
                  onClick={() => removeEvent(ev.id)}
                  className="text-muted hover:text-ink text-sm px-2"
                >
                  ✕
                </button>
              </li>
            ))}
            {events.length === 0 && (
              <p className="text-sm text-muted text-center py-4">
                No events yet — upload a Luma screenshot above.
              </p>
            )}
          </ul>
        </section>

        <button
          onClick={signOut}
          className="popby-btn popby-btn-ghost w-full text-red-600"
        >
          Sign out
        </button>
      </div>
    </main>
  );
}
