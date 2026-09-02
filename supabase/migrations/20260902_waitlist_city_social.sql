-- Waitlist: city demand + optional social / feedback.
-- Safe to re-run. Email uniqueness stays on waitlist_email_unique.

alter table public.waitlist
  add column if not exists city text,
  add column if not exists country text,
  add column if not exists social text,
  add column if not exists feedback text;

create index if not exists waitlist_city_idx on public.waitlist (city);
create index if not exists waitlist_source_idx on public.waitlist (source);
