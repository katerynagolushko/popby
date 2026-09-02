-- Waitlist: collect name + affiliation for early access outreach.
-- Safe to re-run. Email uniqueness stays on waitlist_email_unique.

alter table public.waitlist
  add column if not exists name text,
  add column if not exists role text,
  add column if not exists company_type text;
