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

1. **Go live** — user toggles "I'm free to hang out", picks a hangout intent (product feedback, co-work, walk, coffee, casual chat, brainstorm, other), a duration (30 min / 1h / 2h), and an *approximate* spot on the map (never exact location; privacy by design).
2. **Live map** — everyone currently live shows up as a marker on a London map. Availability auto-expires when the duration runs out.
3. **Connect** — tap a person, view their profile sheet, send a connect request. Statuses: pending / accepted / declined.
4. **Message** — accepted connections unlock an in-app chat (Supabase realtime). No chat before acceptance.
5. **Meet + rate** — after the hangout, users rate each other (score + optional comment). Ratings build the trust layer that makes strangers willing to meet.

## Main features

- **Profiles**: first name, photo, role, short bio, optional LinkedIn / X / Luma links. Deliberately thin — the product is the meetup, not the profile.
- **Go-live availability** with hangout type, note, duration, and map pin (`availability` table, auto-expiry via `expires_at`).
- **Live map**: MapLibre GL JS + OpenFreeMap "bright" style (no API key needed).
- **Connect requests + realtime messaging** (`connections`, `messages` tables).
- **Ratings v1** (`ratings` table, avg score shown on profiles).
- **Luma event import**: user uploads a screenshot of their Luma calendar; `/api/extract-events` uses GPT-4o-mini vision to extract events (Luma has no public end-user OAuth).
- **`/demo` route**: full interactive demo with 9 fake people around Shoreditch, works with zero Supabase config. Used for pitching; gate or remove before real launch.

## Architecture / key decisions (don't relitigate these)

- **Stack**: Next.js (App Router) + React + TypeScript + Tailwind v4; Supabase for auth (magic link), Postgres, and realtime; Vercel for deploy. Mobile-first PWA — no App Store for launch, QR → mobile web.
- **Branding lives in `src/lib/brand.ts`** (APP_NAME = "Popby"). One-file rebrand — never hardcode the app name elsewhere.
- **Domain constants live in `src/lib/constants.ts`** (roles, hangout types, durations, London bounds) and **types in `src/lib/types.ts`**. Extend these, don't duplicate.
- **Map**: native MapLibre GL JS, worker files served from `public/maplibre/` (copied by the `postinstall` script). **`src/middleware.ts` must keep excluding `maplibre/` and `.mjs` files from the auth matcher** — the map goes blank if the worker gets redirected to `/login`.
- **Design**: must not look AI-generated. Syne + IBM Plex Sans fonts, navy/orange/cream palette, custom SVG logo in `src/components/Logo.tsx`. No stock gradients, no emoji mascots.
- **Privacy**: approximate map pins only; profiles expose first name only.
- **DB schema** is in `supabase/schema.sql` (+ `supabase/storage.sql`). Keep it the source of truth; update it when adding tables.

## Where things live

- Pages: `src/app/` (`page.tsx` landing, `demo/`, `login/`, `onboarding/`, `map/`, `profile/`, `messages/`, `api/extract-events/`, `auth/callback/`)
- Components: `src/components/` (`PopbyMap.tsx`, `PopbyMapLoader.tsx` for ssr:false dynamic import, `GoLiveModal.tsx` which supports a `demo` prop, `PersonSheet.tsx`, `RatingModal.tsx`, `EventScreenshotUpload.tsx`)
- Lib: `src/lib/` (brand, constants, types, demo-data, map-tiles, maplibre-setup, `supabase/` clients)
- Human docs: `README.md` (overview + demo), `SETUP.md` (Supabase/Vercel setup)

## Dev

```bash
npm install   # postinstall copies maplibre worker to public/
npm run dev   # http://localhost:3000/demo for the no-config demo
```

Env vars (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, optional `OPENAI_API_KEY` for event extraction.
