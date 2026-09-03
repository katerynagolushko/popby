-- Waitlist for Encode / early access launch
-- Run in Supabase SQL Editor (or via migrations) before relying on /api/waitlist.

create table if not exists public.waitlist (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  name text,
  role text,
  company_type text,
  city text,
  country text,
  social text,
  feedback text,
  source text not null default 'landing',
  created_at timestamptz default now() not null,
  constraint waitlist_email_unique unique (email)
);

create index if not exists waitlist_created_idx on public.waitlist (created_at desc);
create index if not exists waitlist_city_idx on public.waitlist (city);
create index if not exists waitlist_source_idx on public.waitlist (source);

alter table public.waitlist enable row level security;

-- Public signup via anon key from the API route; no public reads.
drop policy if exists "waitlist_insert_anon" on public.waitlist;
create policy "waitlist_insert_anon" on public.waitlist
  for insert to anon, authenticated
  with check (true);

drop policy if exists "waitlist_no_public_read" on public.waitlist;
-- No select policy for anon/authenticated → inserts only from the client/API.

drop policy if exists "waitlist_update_anon" on public.waitlist;
create policy "waitlist_update_anon" on public.waitlist
  for update to anon, authenticated
  using (true)
  with check (true);
