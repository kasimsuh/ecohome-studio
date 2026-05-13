-- Run this in the Supabase SQL Editor
-- Creates the projects table for storing user-generated home concepts

create table if not exists projects (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  project_id   text unique not null,
  data         jsonb not null,
  thumbnail    text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Row-Level Security: users can only access their own projects
alter table projects enable row level security;

create policy "Users can manage their own projects"
  on projects
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Fast listing of a user's projects ordered by most recent
create index if not exists projects_user_id_created_at_idx
  on projects(user_id, created_at desc);

-- GIN index for querying inside the JSONB blob (e.g. filter by climateRegion)
create index if not exists projects_data_gin_idx
  on projects using gin(data);

-- Auto-update updated_at on row changes
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on projects
  for each row
  execute function update_updated_at();
