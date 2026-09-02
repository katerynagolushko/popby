# Hangbyme — setup in ~15 minutes

Hangbyme (Hangby.me) is a London-only IRL hangout app for startup people.

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
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
- `OPENAI_API_KEY` (optional — for Luma screenshot event extraction)
- `RESEND_API_KEY` + `WAITLIST_FROM_EMAIL` (optional — waitlist confirmation email; see below)

## Waitlist signups (where they go)

Landing form → `POST /api/waitlist` → Supabase table `waitlist` (columns: email, name, role, company_type, city, country, social, feedback, source, created_at).

- London waitlist: `/waitlist` (city defaults to London)
- City demand waitlist: `/waitlist/city` (city required; optional social + feedback on both)

View them: Supabase dashboard → **Table Editor** → **waitlist**.

Migrations: `supabase/migrations/20260302_waitlist.sql`, `20260902_waitlist_fields.sql`, `20260902_waitlist_city_social.sql` (also in `schema.sql`). Run if the table / columns are missing.

Signup still returns ok if Supabase env is missing (local/demo); nothing is persisted in that case.

## Waitlist confirmation email (Resend — optional)

Code path is ready in `src/lib/waitlist-email.ts`. If keys are missing, signup still succeeds; only the confirmation email is skipped.

1. Create a [Resend](https://resend.com) account.
2. Add and verify your domain (DNS: SPF, DKIM, and whatever Resend shows for the domain). Until the domain is verified, you can only send from Resend’s onboarding address in test mode.
3. Create an API key. Put it in Vercel / `.env.local` as `RESEND_API_KEY`.
4. Set `WAITLIST_FROM_EMAIL` to a verified sender, e.g. `Hangbyme <hello@hangby.me>`.
5. Set `WAITLIST_REPLY_TO` to `kat@hangby.me` (replies go to you).
6. Redeploy. Join the waitlist once and check Resend → Emails plus the inbox.

Do not pretend email works without keys. The API returns `emailSent: true|false` so you can confirm.

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
