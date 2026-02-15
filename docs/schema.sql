-- Boom Database Schema
-- Run this in your Supabase SQL Editor

-- Users table (synced from auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  github_username text,
  github_access_token text,
  anthropic_api_key text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Projects table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  description text,
  type text check (type in ('website', 'deck')) default 'website' not null,
  github_repo text not null,
  github_owner text not null,
  brand_nucleus jsonb,
  cloudflare_project_id text,
  deploy_url text,
  deploy_status text check (deploy_status in ('idle', 'building', 'deployed', 'failed')) default 'idle' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Conversations table
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  messages jsonb default '[]'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes
create index idx_projects_user_id on public.projects(user_id);
create index idx_conversations_project_id on public.conversations(project_id);

-- Row Level Security
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.conversations enable row level security;

-- Users: can only read/update own profile
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Projects: CRUD scoped to own projects
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can create projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Conversations: scoped to project owner
create policy "Users can view own conversations"
  on public.conversations for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = conversations.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can create conversations"
  on public.conversations for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = conversations.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update own conversations"
  on public.conversations for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = conversations.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Trigger: auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, github_username)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'user_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at
  before update on public.users
  for each row execute procedure public.update_updated_at();

create trigger update_projects_updated_at
  before update on public.projects
  for each row execute procedure public.update_updated_at();

create trigger update_conversations_updated_at
  before update on public.conversations
  for each row execute procedure public.update_updated_at();
