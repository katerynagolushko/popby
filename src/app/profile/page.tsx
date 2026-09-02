"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import EventScreenshotUpload from "@/components/EventScreenshotUpload";
import { COMPANY_TYPES, ROLES } from "@/lib/constants";
import type { CompanyType, Role, SocialsVisibility, UserEvent } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [role, setRole] = useState<Role>("founder");
  const [companyType, setCompanyType] = useState<CompanyType>("early_stage");
  const [bio, setBio] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [lumaProfileUrl, setLumaProfileUrl] = useState("");
  const [socialsVisibility, setSocialsVisibility] =
    useState<SocialsVisibility>("public");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
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
        setCompanyType(data.company_type ?? "early_stage");
        setBio(data.bio ?? "");
        setLinkedinUrl(data.linkedin_url ?? "");
        setTwitterUrl(data.twitter_url ?? "");
        setLumaProfileUrl(data.luma_profile_url ?? "");
        setSocialsVisibility(data.socials_visibility ?? "public");
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

    let nextPhoto = photoUrl;
    if (photoFile) {
      const ext = photoFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;
      await supabase.storage
        .from("profile-photos")
        .upload(path, photoFile, { upsert: true });
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-photos").getPublicUrl(path);
      nextPhoto = publicUrl;
      setPhotoUrl(publicUrl);
      setPhotoFile(null);
    }

    await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim(),
        role,
        company_type: companyType,
        bio: bio.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        twitter_url: twitterUrl.trim() || null,
        luma_profile_url: lumaProfileUrl.trim() || null,
        socials_visibility: socialsVisibility,
        photo_url: nextPhoto,
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
          <label className="flex items-center gap-4 cursor-pointer">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-paper-2 border-2 border-paper-3">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="flex items-center justify-center h-full text-muted text-sm">
                  Photo
                </span>
              )}
            </div>
            <span className="text-sm text-accent font-medium">Change photo</span>
            <input
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setPhotoFile(file);
                setPhotoUrl(URL.createObjectURL(file));
              }}
            />
          </label>

          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="popby-input"
            placeholder="First name"
          />

          <div>
            <p className="text-sm font-medium mb-2 text-navy">Role</p>
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
          </div>

          <div>
            <p className="text-sm font-medium mb-2 text-navy">Kind of company</p>
            <div className="flex flex-wrap gap-2">
              {COMPANY_TYPES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCompanyType(c.value)}
                  className={`popby-chip ${companyType === c.value ? "popby-chip-selected" : ""}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="popby-input min-h-[70px] resize-none"
            placeholder="Bio (optional)"
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

          {(linkedinUrl.trim() || twitterUrl.trim() || lumaProfileUrl.trim()) && (
            <div>
              <p className="text-sm font-medium mb-2 text-navy">Who can see socials?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSocialsVisibility("public")}
                  className={`popby-chip justify-center ${socialsVisibility === "public" ? "popby-chip-selected" : ""}`}
                >
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setSocialsVisibility("after_hangout")}
                  className={`popby-chip justify-center ${socialsVisibility === "after_hangout" ? "popby-chip-selected" : ""}`}
                >
                  After we&apos;ve hung out
                </button>
              </div>
            </div>
          )}

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
          <p className="text-sm text-navy/70 mb-4 leading-relaxed">
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
                  <p className="text-base font-medium truncate text-navy">{ev.title}</p>
                  {ev.event_date && (
                    <p className="text-sm text-navy/70">
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
                      className="text-sm text-accent underline"
                    >
                      View on Luma
                    </a>
                  )}
                </div>
                <button
                  onClick={() => removeEvent(ev.id)}
                  className="text-muted hover:text-ink text-base px-2 min-h-11 min-w-11"
                >
                  ✕
                </button>
              </li>
            ))}
            {events.length === 0 && (
              <p className="text-base text-navy/70 text-center py-4">
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
