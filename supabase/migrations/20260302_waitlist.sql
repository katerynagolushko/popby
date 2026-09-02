-- Waitlist for Encode / early access launch
-- Run in Supabase SQL Editor (or via migrations) before relying on /api/waitlist.

create table if not exists public.waitlist (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  name text,
  role text,
  company_type text,
  source text not null default 'landing',
  created_at timestamptz default now() not null,
  constraint waitlist_email_unique unique (email)
);

create index if not exists waitlist_created_idx on public.waitlist (created_at desc);

alter table public.waitlist enable row level security;

-- Public signup via anon key from the API route; no public reads.
drop policy if exists "waitlist_insert_anon" on public.waitlist;
create policy "waitlist_insert_anon" on public.waitlist
  for insert to anon, authenticated
  with check (true);

drop policy if exists "waitlist_no_public_read" on public.waitlist;
-- No select policy for anon/authenticated → inserts only from the client/API.
