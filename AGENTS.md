<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Popby — project context (read this every session)

## Vision

A world where startup people actually meet in person instead of rotting in DMs and feeds. Popby is **the social network that only works IRL**: no feed, no posts, no follower counts. The app's only job is to get two people in the same city to physically show up.

## Mission

Make spontaneous, high-trust IRL hangouts between London startup people (founders, operators, investors, freelancers, service providers) as easy as toggling a switch. Launch wedge: the Encode event (~400 people) via QR code, but the product is London-wide, not event-tied.

## Core loop (the mechanism)

1. **Go live** — user toggles "I'm free to hang out", picks **format** (coffee / walk / co-work / activity) and **intent** (product feedback / brainstorm / casual chat / just hang / other) as two separate chip rows, a duration (30 min / 1h / 2h), and an *approximate* spot. Location is one-shot for that hangout only — never background tracking.
2. **Live map** — everyone currently live shows up as a marker. While you're live, suggestions rank by the **match preference you set when going live**: **Closest to me** (default) or **Most my vibe** (same hangout format/intent). Preference is not a free-floating map toggle — change it by editing / going live again. Availability auto-expires when the duration runs out.
3. **Connect** — tap a person, view their profile sheet, send a connect request. Statuses: pending / accepted / declined.
4. **Message** — accepted connections unlock in-app chat. Social links marked "After we've hung out" only appear after acceptance.
5. **Meet + rate** — after the hangout, users rate each other. Ratings build the trust layer.

## Onboarding (locked — keep short)

Signup target: under ~90 seconds. Collect only:

1. Auth: Google / Apple OAuth primary; email **OTP code** (not magic link) as fallback
2. First name
3. Role chip
4. Company-type chip (early-stage / scale-up / corporate / VC·fund / agency / independent / student)
5. Photo — optional; re-ask at first go-live ("so people can find you here")
6. Optional LinkedIn / X with visibility: **Public** or **After we've hung out**

Do **not** put hangout format, intent, or vibe preference on the profile — those are transient and live only at go-live. Completion is tracked via `profiles.onboarding_completed` (never infer from photo presence).

## Encode demo launch (current)

Public path for Encode: **landing waitlist + `/demo`**. City-wide real accounts are not open.

- Landing: waitlist email (`POST /api/waitlist` → Supabase `waitlist` table when env is set). Primary CTA is waitlist; secondary is "Try the full demo". Soft founder sign-in link stays.
- Soft gate: unauthenticated `/map` (and other app routes) redirect to `/` so visitors are not pushed into real signup. Founder auth still works via `/login`.
- **`/demo`**: ~500 fake people across London clusters (Shoreditch, Old Street, King's Cross, Soho, Canary Wharf, Hackney, Brixton, Clapham, etc.). Zero Supabase. Go-live picks format + intent + Closest / Most my vibe; suggestion strip ranks the full set; map paints ~100 nearest markers for mobile perf.
- Waitlist schema: `supabase/migrations/20260302_waitlist.sql` (also in `schema.sql`). Run in Supabase before relying on persistence.

## Main features

- **Profiles**: first name, photo, role, company type, short bio, optional LinkedIn / X / Luma links with visibility control. Deliberately thin.
- **Go-live availability** with format + intent, note, duration, and map pin (`availability` table, auto-expiry via `expires_at`).
- **Live map**: MapLibre GL JS + OpenFreeMap "bright" style (no API key needed). Suggestion strip sorted by nearest or vibe.
- **Connect requests + realtime messaging** (`connections`, `messages` tables).
- **Ratings v1** (`ratings` table, avg score shown on profiles).
- **Luma event import**: user uploads a screenshot of their Luma calendar; `/api/extract-events` uses GPT-4o-mini vision to extract events (Luma has no public end-user OAuth).
- **`/demo` route**: full interactive Encode demo (~500 people), works with zero Supabase. Landing points here after waitlist.
- **Waitlist**: `waitlist` table + `/api/waitlist` for early access emails.

## Architecture / key decisions (don't relitigate these)

- **Stack**: Next.js (App Router) + React + TypeScript + Tailwind v4; Supabase for auth (magic link), Postgres, and realtime; Vercel for deploy. Mobile-first PWA — no App Store for launch, QR → mobile web.
- **Branding lives in `src/lib/brand.ts`** (APP_NAME = "Popby"). One-file rebrand — never hardcode the app name elsewhere.
- **Domain constants live in `src/lib/constants.ts`** (roles, hangout types, durations, London bounds) and **types in `src/lib/types.ts`**. Extend these, don't duplicate.
- **Map**: native MapLibre GL JS, worker files served from `public/maplibre/` (copied by the `postinstall` script). **`src/middleware.ts` must keep excluding `maplibre/` and `.mjs` files from the auth matcher** — the map goes blank if the worker gets redirected to `/login`.
- **Design**: must not look AI-generated. Syne + IBM Plex Sans fonts, navy/orange/cream palette, custom SVG logo in `src/components/Logo.tsx`. No stock gradients, no emoji mascots.
- **Privacy**: approximate map pins only; profiles expose first name only.
- **DB schema** is in `supabase/schema.sql` (+ `supabase/storage.sql`). Keep it the source of truth; update it when adding tables.

## Where things live

- Pages: `src/app/` (`page.tsx` landing + waitlist, `demo/`, `login/`, `onboarding/`, `map/`, `profile/`, `messages/`, `api/waitlist/`, `api/extract-events/`, `auth/callback/`)
- Components: `src/components/` (`WaitlistForm.tsx`, `PopbyMap.tsx`, `PopbyMapLoader.tsx` for ssr:false dynamic import, `GoLiveModal.tsx` which supports a `demo` prop, `PersonSheet.tsx`, `RatingModal.tsx`, `EventScreenshotUpload.tsx`)
- Lib: `src/lib/` (brand, constants, types, demo-data with 500-person generator + map subsample helpers, map-tiles, maplibre-setup, `supabase/` clients)
- Human docs: `README.md` (overview + demo), `SETUP.md` (Supabase/Vercel setup)

## Dev

```bash
npm install   # postinstall copies maplibre worker to public/
npm run dev   # http://localhost:3000/demo for the no-config demo
```

Env vars (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, optional `OPENAI_API_KEY` for event extraction.
