-- Cony database schema — run in Supabase SQL Editor

create extension if not exists "uuid-ossp";

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  photo_url text,
  role text not null check (role in ('founder', 'operator', 'investor', 'freelancer', 'service_provider')),
  bio text,
  linkedin_url text,
  twitter_url text,
  luma_profile_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Manual upcoming events (Luma workaround until OAuth exists)
create table public.user_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  event_url text,
  event_date timestamptz,
  created_at timestamptz default now() not null
);

-- Go-live availability sessions
create table public.availability (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  hangout_type text not null,
  hangout_note text,
  duration_minutes int not null check (duration_minutes in (30, 60, 120)),
  expires_at timestamptz not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null
);

create index availability_active_idx on public.availability (is_active, expires_at) where is_active = true;
create index availability_user_idx on public.availability (user_id);

-- Connection requests
create table public.connections (
  id uuid primary key default uuid_generate_v4(),
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  availability_id uuid references public.availability(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (from_user_id, to_user_id, availability_id)
);

-- Messages (only between accepted connections)
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  connection_id uuid not null references public.connections(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now() not null
);

create index messages_connection_idx on public.messages (connection_id, created_at);

-- Ratings after hangouts
create table public.ratings (
  id uuid primary key default uuid_generate_v4(),
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  connection_id uuid not null references public.connections(id) on delete cascade,
  score int not null check (score between 1 and 5),
  comment text,
  created_at timestamptz default now() not null,
  unique (from_user_id, connection_id)
);

-- Average rating view
create or replace view public.profile_ratings as
select
  to_user_id as user_id,
  round(avg(score)::numeric, 1) as avg_score,
  count(*)::int as rating_count
from public.ratings
group by to_user_id;

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, role)
  values (new.id, split_part(new.email, '@', 1), 'founder');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Expire old availability sessions
create or replace function public.expire_availability()
returns void as $$
begin
  update public.availability
  set is_active = false
  where is_active = true and expires_at < now();
end;
$$ language plpgsql security definer;

-- RLS
alter table public.profiles enable row level security;
alter table public.user_events enable row level security;
alter table public.availability enable row level security;
alter table public.connections enable row level security;
alter table public.messages enable row level security;
alter table public.ratings enable row level security;

-- Profiles: anyone authenticated can read, users edit own
create policy "profiles_read" on public.profiles for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- User events
create policy "events_read" on public.user_events for select to authenticated using (true);
create policy "events_manage_own" on public.user_events for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Availability: read active sessions, manage own
create policy "availability_read" on public.availability for select to authenticated using (true);
create policy "availability_manage_own" on public.availability for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Connections
create policy "connections_read_own" on public.connections for select to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "connections_insert" on public.connections for insert to authenticated
  with check (auth.uid() = from_user_id);
create policy "connections_update_participant" on public.connections for update to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- Messages: only connection participants, only if accepted
create policy "messages_read" on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.connections c
      where c.id = connection_id
        and c.status = 'accepted'
        and (c.from_user_id = auth.uid() or c.to_user_id = auth.uid())
    )
  );
create policy "messages_insert" on public.messages for insert to authenticated
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.connections c
      where c.id = connection_id
        and c.status = 'accepted'
        and (c.from_user_id = auth.uid() or c.to_user_id = auth.uid())
    )
  );

-- Ratings: read all, write own once per connection
create policy "ratings_read" on public.ratings for select to authenticated using (true);
create policy "ratings_insert" on public.ratings for insert to authenticated with check (auth.uid() = from_user_id);

-- Realtime
alter publication supabase_realtime add table public.availability;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.connections;

-- Storage bucket for profile photos (create in dashboard: profile-photos, public read)
-- Policy: authenticated users upload to own folder
