-- Incremental migration for existing Popby DBs (run if schema.sql was already applied)

alter table public.profiles
  add column if not exists company_type text
    check (company_type in (
      'early_stage', 'scale_up', 'corporate', 'vc_fund', 'agency', 'independent', 'student'
    ));

alter table public.profiles
  add column if not exists socials_visibility text not null default 'public'
    check (socials_visibility in ('public', 'after_hangout'));

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

-- Mark existing complete-ish profiles as onboarded
update public.profiles
set onboarding_completed = true
where first_name is not null
  and first_name <> ''
  and photo_url is not null;

alter table public.availability
  add column if not exists hangout_format text
    check (hangout_format in ('coffee', 'walk', 'cowork', 'activity'));

alter table public.availability
  add column if not exists hangout_intent text
    check (hangout_intent in (
      'product_feedback', 'brainstorm', 'casual_chat', 'just_hang', 'other'
    ));

-- Best-effort backfill from legacy hangout_type if present
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'availability' and column_name = 'hangout_type'
  ) then
    update public.availability set
      hangout_format = case hangout_type
        when 'walk' then 'walk'
        when 'cowork' then 'cowork'
        when 'other' then 'activity'
        else 'coffee'
      end,
      hangout_intent = case hangout_type
        when 'product_feedback' then 'product_feedback'
        when 'brainstorm' then 'brainstorm'
        when 'casual_chat' then 'casual_chat'
        when 'other' then 'other'
        else 'just_hang'
      end
    where hangout_format is null or hangout_intent is null;

    alter table public.availability drop column hangout_type;
  end if;
end $$;

update public.availability set hangout_format = 'coffee' where hangout_format is null;
update public.availability set hangout_intent = 'just_hang' where hangout_intent is null;

alter table public.availability alter column hangout_format set not null;
alter table public.availability alter column hangout_intent set not null;

alter table public.availability
  add column if not exists match_preference text
    check (match_preference in ('nearest', 'vibe'));

update public.availability set match_preference = 'nearest' where match_preference is null;
alter table public.availability alter column match_preference set default 'nearest';
alter table public.availability alter column match_preference set not null;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, role, onboarding_completed)
  values (new.id, split_part(new.email, '@', 1), 'founder', false);
  return new;
end;
$$ language plpgsql security definer;
