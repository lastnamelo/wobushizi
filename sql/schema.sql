-- Enable UUID helpers for gen_random_uuid()
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.character_states (
  user_id uuid not null references public.profiles (id) on delete cascade,
  character text not null,
  status text not null default 'study' check (status in ('known', 'study')),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, character)
);

create table if not exists public.log_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.log_event_items (
  id bigint generated always as identity primary key,
  log_event_id uuid not null references public.log_events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  character text not null,
  action text not null check (action in ('logged_known', 'queued_study', 'skipped')),
  created_at timestamptz not null default now()
);

create index if not exists idx_character_states_user on public.character_states (user_id);
create index if not exists idx_character_states_user_status on public.character_states (user_id, status);
create index if not exists idx_character_states_user_character on public.character_states (user_id, character);

create index if not exists idx_log_events_user on public.log_events (user_id);
create index if not exists idx_log_event_items_user on public.log_event_items (user_id);
create index if not exists idx_log_event_items_user_character on public.log_event_items (user_id, character);

alter table public.profiles enable row level security;
alter table public.character_states enable row level security;
alter table public.log_events enable row level security;
alter table public.log_event_items enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "character_states_select_own" on public.character_states;
drop policy if exists "character_states_insert_own" on public.character_states;
drop policy if exists "character_states_update_own" on public.character_states;
drop policy if exists "character_states_delete_own" on public.character_states;
drop policy if exists "log_events_select_own" on public.log_events;
drop policy if exists "log_events_insert_own" on public.log_events;
drop policy if exists "log_events_update_own" on public.log_events;
drop policy if exists "log_events_delete_own" on public.log_events;
drop policy if exists "log_event_items_select_own" on public.log_event_items;
drop policy if exists "log_event_items_insert_own" on public.log_event_items;
drop policy if exists "log_event_items_update_own" on public.log_event_items;
drop policy if exists "log_event_items_delete_own" on public.log_event_items;

-- Profiles policies
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Character states policies
create policy "character_states_select_own"
  on public.character_states for select
  using (auth.uid() = user_id);

create policy "character_states_insert_own"
  on public.character_states for insert
  with check (auth.uid() = user_id);

create policy "character_states_update_own"
  on public.character_states for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "character_states_delete_own"
  on public.character_states for delete
  using (auth.uid() = user_id);

-- Log events policies
create policy "log_events_select_own"
  on public.log_events for select
  using (auth.uid() = user_id);

create policy "log_events_insert_own"
  on public.log_events for insert
  with check (auth.uid() = user_id);

create policy "log_events_update_own"
  on public.log_events for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "log_events_delete_own"
  on public.log_events for delete
  using (auth.uid() = user_id);

-- Log event items policies
create policy "log_event_items_select_own"
  on public.log_event_items for select
  using (auth.uid() = user_id);

create policy "log_event_items_insert_own"
  on public.log_event_items for insert
  with check (auth.uid() = user_id);

create policy "log_event_items_update_own"
  on public.log_event_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "log_event_items_delete_own"
  on public.log_event_items for delete
  using (auth.uid() = user_id);
