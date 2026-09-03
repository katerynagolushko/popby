-- Waitlist re-submit backfill.
-- Anon has INSERT but no SELECT; Postgres won't UPDATE invisible rows even with
-- an UPDATE policy. Use a SECURITY DEFINER upsert instead.
-- Safe to re-run.

create or replace function public.waitlist_upsert_backfill(
  p_email text,
  p_name text,
  p_role text,
  p_company_type text,
  p_city text,
  p_country text,
  p_social text,
  p_feedback text,
  p_source text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exists boolean;
begin
  select exists(
    select 1 from public.waitlist w where w.email = lower(trim(p_email))
  ) into v_exists;

  if v_exists then
    update public.waitlist w set
      name = coalesce(nullif(trim(p_name), ''), w.name),
      role = coalesce(nullif(trim(p_role), ''), w.role),
      company_type = coalesce(nullif(trim(p_company_type), ''), w.company_type),
      city = case
        when w.city is null or btrim(w.city) = '' then nullif(trim(p_city), '')
        else w.city
      end,
      country = case
        when w.country is null or btrim(w.country) = '' then nullif(trim(p_country), '')
        else w.country
      end,
      social = case
        when w.social is null or btrim(w.social) = '' then nullif(trim(p_social), '')
        else w.social
      end,
      feedback = case
        when w.feedback is null or btrim(w.feedback) = '' then nullif(trim(p_feedback), '')
        else w.feedback
      end,
      source = coalesce(nullif(trim(p_source), ''), w.source)
    where w.email = lower(trim(p_email));

    return jsonb_build_object('stored', true, 'duplicate', true);
  end if;

  insert into public.waitlist (
    email, name, role, company_type, city, country, social, feedback, source
  ) values (
    lower(trim(p_email)),
    nullif(trim(p_name), ''),
    nullif(trim(p_role), ''),
    nullif(trim(p_company_type), ''),
    nullif(trim(p_city), ''),
    nullif(trim(p_country), ''),
    nullif(trim(p_social), ''),
    nullif(trim(p_feedback), ''),
    coalesce(nullif(trim(p_source), ''), 'landing')
  );

  return jsonb_build_object('stored', true, 'duplicate', false);
end;
$$;

revoke all on function public.waitlist_upsert_backfill(
  text, text, text, text, text, text, text, text, text
) from public;
grant execute on function public.waitlist_upsert_backfill(
  text, text, text, text, text, text, text, text, text
) to anon, authenticated;

-- Keep for docs / future; alone it does not allow anon updates without SELECT.
drop policy if exists "waitlist_update_anon" on public.waitlist;
create policy "waitlist_update_anon" on public.waitlist
  for update to anon, authenticated
  using (true)
  with check (true);
