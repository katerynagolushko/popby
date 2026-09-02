# Popby — setup in ~15 minutes

Popby is a London-only IRL hangout app for startup people.

## 1. Supabase (5 min)

1. Create a project at [supabase.com](https://supabase.com)
2. **SQL Editor** → run `supabase/schema.sql`
3. **SQL Editor** → run `supabase/storage.sql`
4. **Storage** → create bucket `profile-photos` (public)
5. **Authentication** → enable Email (magic link)
6. Copy **Project URL** and **anon key**

## 2. Local env

```bash
cp .env.example .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` (optional — for Luma screenshot event extraction)

## 3. Run locally

```bash
npm install
npm run dev
```

## 4. Deploy to Vercel

```bash
npx vercel --prod
```

Add env vars in Vercel. In Supabase → Auth → Redirect URLs:

- `https://YOUR-VERCEL-URL.vercel.app/auth/callback`

## Luma events via screenshot

Users upload a screenshot of their Luma calendar. GPT-4o-mini vision extracts event names, dates, and URLs. No manual pasting.

Requires `OPENAI_API_KEY` (~$0.01 per screenshot).

## Rename

App name lives in `src/lib/brand.ts` — change one file to rebrand.
