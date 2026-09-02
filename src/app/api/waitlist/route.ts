import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { email?: string; source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Need a real email." },
      { status: 400 }
    );
  }

  const source =
    typeof body.source === "string" && body.source.length < 64
      ? body.source
      : "landing";

  const env = getEnv();
  if (!env) {
    // UI still works in local/demo builds without Supabase; nothing is persisted.
    console.warn("[waitlist] Supabase env missing — email accepted but not stored:", email);
    return NextResponse.json({ ok: true, stored: false });
  }

  const supabase = createClient(env.url, env.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from("waitlist").insert({
    email,
    source,
  });

  if (error) {
    // Unique violation — already signed up
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error("[waitlist] insert failed:", error.message);
    return NextResponse.json(
      { ok: false, error: "Could not save email. Try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, stored: true });
}
