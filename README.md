# Popby

**The social network that only works IRL.**

See who's free to hang out in London right now. Founders, operators, investors — spontaneous meetups, no awkward cold intros.

## Try the demo

```bash
npm install
npm run dev
```

Open [http://localhost:3000/demo](http://localhost:3000/demo) — full interactive demo, no account needed.

## Features

- **Go live** — toggle availability, pick hangout type, duration, approximate spot on map
- **Live map** — see who's free nearby (OpenFreeMap, no API key)
- **Connect + chat** — send requests, message in-app
- **Ratings** — post-hangout trust layer
- **Events** — upload Luma calendar screenshot, AI extracts events
- **Profiles** — role, photo, LinkedIn, X, Luma link

## Setup (real app)

See [SETUP.md](./SETUP.md). You need:

1. A [Supabase](https://supabase.com) project (free)
2. Run `supabase/schema.sql` + `supabase/storage.sql`
3. Copy `.env.example` → `.env.local` and fill in keys
4. `npm run dev` or deploy to Vercel

## Deploy

```bash
npx vercel --prod
```

Add env vars in Vercel. Set Supabase redirect URL to `https://your-app.vercel.app/auth/callback`.

## Stack

Next.js · Supabase · MapLibre · OpenFreeMap · TypeScript

## License

Private — Popby.
