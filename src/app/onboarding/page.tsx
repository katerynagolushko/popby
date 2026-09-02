"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COMPANY_TYPES, ROLES } from "@/lib/constants";
import type { CompanyType, Role, SocialsVisibility } from "@/lib/types";
import Logo from "@/components/Logo";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [firstName, setFirstName] = useState("");
  const [role, setRole] = useState<Role>("founder");
  const [companyType, setCompanyType] = useState<CompanyType>("early_stage");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [socialsVisibility, setSocialsVisibility] =
    useState<SocialsVisibility>("public");
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
      if (data?.onboarding_completed) {
        router.replace("/map");
        return;
      }
      if (data) {
        const emailPrefix = user.email?.split("@")[0] ?? "";
        setFirstName(
          data.first_name && data.first_name !== emailPrefix
            ? data.first_name
            : ""
        );
        setRole(data.role ?? "founder");
        setCompanyType(data.company_type ?? "early_stage");
        setLinkedinUrl(data.linkedin_url ?? "");
        setTwitterUrl(data.twitter_url ?? "");
        setSocialsVisibility(data.socials_visibility ?? "public");
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
    if (!firstName.trim()) return;
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    let photoUrl = photoPreview && !photoFile ? photoPreview : null;

    if (photoFile) {
      const ext = photoFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, photoFile, { upsert: true });
      if (uploadError) {
        setError("Photo upload failed — you can add one when you go live.");
        setLoading(false);
        // still continue without photo
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from("profile-photos").getPublicUrl(path);
        photoUrl = publicUrl;
      }
    }

    const profilePayload = {
      id: user.id,
      first_name: firstName.trim(),
      role,
      company_type: companyType,
      linkedin_url: linkedinUrl.trim() || null,
      twitter_url: twitterUrl.trim() || null,
      socials_visibility: socialsVisibility,
      photo_url: photoUrl,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" });

    setLoading(false);
    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    router.push("/map");
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-lg mx-auto bg-paper">
      <div className="mb-8">
        <Logo size="sm" />
        <h1 className="text-3xl text-navy mt-6 font-display">Almost there</h1>
        <p className="text-sm text-muted mt-2 leading-relaxed">
          Name, role, and what you&apos;re building. Photo helps people find you
          — skip if you want, we&apos;ll ask again when you go live.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="popby-card p-6 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <label className="cursor-pointer group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-paper-3 bg-paper-2 flex items-center justify-center">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm text-muted group-hover:text-navy transition-colors">
                  Add photo
                </span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              capture="user"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </label>
          <span className="text-xs text-muted">Optional — skip for now</span>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-navy">
            First name
          </label>
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="popby-input"
            placeholder="Kateryna"
            autoComplete="given-name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-navy">
            I am a…
          </label>
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
          <label className="block text-sm font-medium mb-2 text-navy">
            Kind of company
          </label>
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

        <div className="space-y-3 pt-2 border-t border-paper-3">
          <p className="text-xs text-muted font-medium uppercase tracking-wide">
            Socials <span className="normal-case font-normal">(optional)</span>
          </p>
          <input
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            className="popby-input"
            placeholder="LinkedIn URL"
            inputMode="url"
          />
          <input
            value={twitterUrl}
            onChange={(e) => setTwitterUrl(e.target.value)}
            className="popby-input"
            placeholder="X / Twitter URL"
            inputMode="url"
          />

          {(linkedinUrl.trim() || twitterUrl.trim()) && (
            <div>
              <p className="text-sm font-medium mb-2 text-navy">Who can see them?</p>
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
                  className={`popby-chip justify-center text-center ${socialsVisibility === "after_hangout" ? "popby-chip-selected" : ""}`}
                >
                  After we&apos;ve hung out
                </button>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !firstName.trim()}
          className="popby-btn popby-btn-accent w-full disabled:opacity-50"
        >
          {loading ? "Saving…" : "Continue to map"}
        </button>
      </form>
    </main>
  );
}
