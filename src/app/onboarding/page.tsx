"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ROLES } from "@/lib/constants";
import type { Role } from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [firstName, setFirstName] = useState("");
  const [role, setRole] = useState<Role>("founder");
  const [bio, setBio] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [lumaProfileUrl, setLumaProfileUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
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
        if (data.photo_url) setPhotoPreview(data.photo_url);
      }
    }
    loadProfile();
  }, [router, supabase]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    let photoUrl = photoPreview;

    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, photoFile, { upsert: true });
      if (uploadError) {
        setError("Photo upload failed. You can skip and add one later.");
        setLoading(false);
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-photos").getPublicUrl(path);
      photoUrl = publicUrl;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim(),
        role,
        bio: bio.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        twitter_url: twitterUrl.trim() || null,
        luma_profile_url: lumaProfileUrl.trim() || null,
        photo_url: photoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push("/map");
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">🐰</div>
        <h1 className="text-3xl text-forest">Set up your profile</h1>
        <p className="text-sm text-ink-muted mt-2">
          First name and photo show on the map. That&apos;s what people tap.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="cony-card p-6 space-y-5">
        <div className="flex flex-col items-center gap-3">
          <label className="cursor-pointer group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-cream-dark bg-cream flex items-center justify-center">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl text-ink-muted group-hover:scale-110 transition-transform">
                  📷
                </span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </label>
          <span className="text-xs text-ink-muted">Tap to add photo</span>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">First name</label>
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="cony-input"
            placeholder="Kateryna"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">I am a…</label>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`cony-chip ${role === r.value ? "cony-chip-selected" : ""}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Bio <span className="text-ink-muted font-normal">(optional)</span>
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="cony-input min-h-[80px] resize-none"
            placeholder="Building something in fintech. Always up for a walk."
            maxLength={200}
          />
        </div>

        <div className="space-y-3 pt-2 border-t border-cream-dark">
          <p className="text-xs text-ink-muted font-medium uppercase tracking-wide">
            Links (optional)
          </p>
          <input
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            className="cony-input"
            placeholder="LinkedIn URL"
          />
          <input
            value={twitterUrl}
            onChange={(e) => setTwitterUrl(e.target.value)}
            className="cony-input"
            placeholder="X / Twitter URL"
          />
          <input
            value={lumaProfileUrl}
            onChange={(e) => setLumaProfileUrl(e.target.value)}
            className="cony-input"
            placeholder="Luma profile URL (lu.ma/...)"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !firstName.trim()}
          className="cony-btn cony-btn-primary w-full disabled:opacity-50"
        >
          {loading ? "Saving…" : "Continue to map"}
        </button>
      </form>
    </main>
  );
}
