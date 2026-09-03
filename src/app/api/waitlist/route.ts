import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { COMPANY_TYPES, ROLES } from "@/lib/constants";
import type { CompanyType, Role } from "@/lib/types";
import { sendWaitlistConfirmationEmail } from "@/lib/waitlist-email";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLE_VALUES = new Set(ROLES.map((r) => r.value));
const COMPANY_VALUES = new Set(COMPANY_TYPES.map((c) => c.value));

function isMissingColumnError(error: { code?: string; message: string }): boolean {
  return (
    error.code === "PGRST204" ||
    /could not find the .+ column/i.test(error.message) ||
    /column .+ does not exist/i.test(error.message) ||
    /schema cache/i.test(error.message)
  );
}

function isMissingRpcError(error: { code?: string; message: string }): boolean {
  return (
    error.code === "PGRST202" ||
    /could not find the function/i.test(error.message) ||
    /function .*waitlist_upsert_backfill/i.test(error.message)
  );
}

function optionalText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}

export async function POST(request: Request) {
  let body: {
    email?: string;
    name?: string;
    role?: string;
    company_type?: string;
    city?: string | null;
    country?: string | null;
    social?: string | null;
    feedback?: string | null;
    source?: string;
  };
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

  const name = (body.name ?? "").trim().slice(0, 80);
  if (!name) {
    return NextResponse.json({ ok: false, error: "Need a name." }, { status: 400 });
  }

  const roleRaw = (body.role ?? "").trim();
  const companyRaw = (body.company_type ?? "").trim();
  if (!ROLE_VALUES.has(roleRaw as Role)) {
    return NextResponse.json({ ok: false, error: "Pick a role." }, { status: 400 });
  }
  if (!COMPANY_VALUES.has(companyRaw as CompanyType)) {
    return NextResponse.json(
      { ok: false, error: "Pick a company type." },
      { status: 400 }
    );
  }
  const role = roleRaw as Role;
  const company_type = companyRaw as CompanyType;

  const source =
    typeof body.source === "string" && body.source.length < 64
      ? body.source
      : "landing";

  const isCityWaitlist = source === "city_waitlist";
  const city = optionalText(body.city, 120);
  const country = optionalText(body.country, 80);
  const social = optionalText(body.social, 200);
  const feedback = optionalText(body.feedback, 2000);

  if (isCityWaitlist && !city) {
    return NextResponse.json(
      { ok: false, error: "Pick a city." },
      { status: 400 }
    );
  }

  const env = getEnv();
  let stored = false;
  let duplicate = false;

  if (!env) {
    console.warn(
      "[waitlist] Supabase env missing — signup accepted but not stored:",
      email
    );
  } else {
    const supabase = createClient(env.url, env.key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const fullRow = {
      email,
      name,
      role,
      company_type,
      city: city ?? (isCityWaitlist ? null : "London"),
      country: country ?? (isCityWaitlist ? null : "United Kingdom"),
      social,
      feedback,
      source,
    };

    // Prefer RPC: inserts new rows, or backfills null/blank fields on duplicate email.
    // Plain UPDATE under anon RLS fails because there is no public SELECT policy.
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "waitlist_upsert_backfill",
      {
        p_email: fullRow.email,
        p_name: fullRow.name,
        p_role: fullRow.role,
        p_company_type: fullRow.company_type,
        p_city: fullRow.city,
        p_country: fullRow.country,
        p_social: fullRow.social,
        p_feedback: fullRow.feedback,
        p_source: fullRow.source,
      }
    );

    if (!rpcError) {
      stored = true;
      const result = rpcData as { stored?: boolean; duplicate?: boolean } | null;
      duplicate = Boolean(result?.duplicate);
    } else if (!isMissingRpcError(rpcError)) {
      console.error("[waitlist] upsert rpc failed:", rpcError.message);
      return NextResponse.json(
        { ok: false, error: "Could not save. Try again." },
        { status: 500 }
      );
    } else {
      console.warn(
        "[waitlist] upsert rpc missing — falling back to insert. Run 20260903_waitlist_duplicate_update.sql."
      );

      let { error } = await supabase.from("waitlist").insert(fullRow);

      // Older DBs may lack newer columns. Fall back so signup never dies.
      if (error && isMissingColumnError(error)) {
        console.warn(
          "[waitlist] extra columns missing — retrying leaner row. Run latest waitlist migrations."
        );
        const midRow = {
          email,
          name,
          role,
          company_type,
          city: fullRow.city,
          country: fullRow.country,
          source,
        };
        ({ error } = await supabase.from("waitlist").insert(midRow));
        if (error && isMissingColumnError(error)) {
          ({ error } = await supabase
            .from("waitlist")
            .insert({ email, name, role, company_type, source }));
        }
        if (error && isMissingColumnError(error)) {
          ({ error } = await supabase.from("waitlist").insert({ email, source }));
        }
      }

      if (error) {
        if (error.code === "23505") {
          // Duplicate without RPC — cannot backfill under anon RLS; still OK for signup.
          duplicate = true;
          stored = true;
        } else if (
          error.code === "PGRST205" ||
          /could not find the table/i.test(error.message) ||
          /relation .*waitlist/i.test(error.message)
        ) {
          console.warn(
            "[waitlist] table missing — run supabase/migrations/20260302_waitlist.sql. Email:",
            email
          );
        } else {
          console.error("[waitlist] insert failed:", error.message);
          return NextResponse.json(
            { ok: false, error: "Could not save. Try again." },
            { status: 500 }
          );
        }
      } else {
        stored = true;
      }
    }
  }

  let emailSent = false;
  // Always try to send — including duplicates — so people who joined before
  // email was live still get a confirmation when they try again.
  const result = await sendWaitlistConfirmationEmail(email, name);
  emailSent = result.sent;
  if (!result.sent && result.reason) {
    console.info("[waitlist] confirmation email skipped:", result.reason);
  }

  return NextResponse.json({
    ok: true,
    stored,
    duplicate: duplicate || undefined,
    emailSent,
  });
}
