# Popby — setup in ~15 minutes

Popby is a London-only IRL hangout app for startup people.

## 1. Supabase (5 min)

1. Create a project at [supabase.com](https://supabase.com)
2. **SQL Editor** → run `supabase/schema.sql`
3. **SQL Editor** → run `supabase/storage.sql`
4. If upgrading an older DB, also run `supabase/migrations/002_onboarding_hangout.sql`
5. **Storage** → create bucket `profile-photos` (public)
6. **Authentication**:
   - Enable Email (OTP / magic link templates — app uses a typed 6-digit code)
   - Enable Google and Apple providers (recommended for event QR signup)
7. Copy **Project URL** and **anon key**

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

Open `/demo` for the no-config interactive demo.

## 4. Deploy to Vercel

```bash
npx vercel --prod
```

Add env vars in Vercel. In Supabase → Auth → Redirect URLs:

- `https://YOUR-VERCEL-URL.vercel.app/auth/callback`

Also add the same URL under Google / Apple OAuth redirect allow-lists.

## Luma events via screenshot

Users upload a screenshot of their Luma calendar. GPT-4o-mini vision extracts event names, dates, and URLs. No manual pasting.

Requires `OPENAI_API_KEY` (~$0.01 per screenshot).

## Rename

App name lives in `src/lib/brand.ts` — change one file to rebrand. Product language is "hang out"; brand name is separate.
