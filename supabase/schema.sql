-- Architect 2.0 prototype schema.
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Every table has row-level security: a user only ever sees their own organisation's data.

create extension if not exists pgcrypto;

-- Organisations -------------------------------------------------------------
create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Organisation setting from the PRD: when true, the approver must be a different person (maker-checker).
  approval_required boolean not null default false,
  created_at timestamptz not null default now()
);

-- Members and their permissions. With no role setup, everyone can do all four.
create table if not exists public.memberships (
  org_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_admin boolean not null default false,
  permissions text[] not null default array['build','edit_code','approve','deploy'],
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- Projects ------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users(id),
  name text not null,
  description text not null default '',
  prompt text not null default '',
  slug text not null,
  stage text not null default 'plan' check (stage in ('plan','connect','build','test','ship','live')),
  status text not null default 'draft' check (status in ('draft','preview','in_review','live')),
  spend_usd numeric(10,2) not null default 0,
  tests_passed int not null default 0,
  tests_total int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_org_updated on public.projects (org_id, updated_at desc);

-- Helper: is the signed-in user a member of this organisation?
create or replace function public.is_member(org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.memberships m where m.org_id = org and m.user_id = auth.uid());
$$;

-- Row-level security ---------------------------------------------------------
alter table public.organisations enable row level security;
alter table public.memberships enable row level security;
alter table public.projects enable row level security;

drop policy if exists "members read their organisation" on public.organisations;
create policy "members read their organisation" on public.organisations
  for select using (public.is_member(id));

drop policy if exists "admins update their organisation" on public.organisations;
create policy "admins update their organisation" on public.organisations
  for update using (exists (select 1 from public.memberships m where m.org_id = id and m.user_id = auth.uid() and m.is_admin));

drop policy if exists "members read memberships" on public.memberships;
create policy "members read memberships" on public.memberships
  for select using (public.is_member(org_id));

drop policy if exists "members read projects" on public.projects;
create policy "members read projects" on public.projects
  for select using (public.is_member(org_id));

drop policy if exists "builders create projects" on public.projects;
create policy "builders create projects" on public.projects
  for insert with check (
    exists (select 1 from public.memberships m where m.org_id = projects.org_id and m.user_id = auth.uid() and 'build' = any(m.permissions))
  );

drop policy if exists "members update projects" on public.projects;
create policy "members update projects" on public.projects
  for update using (public.is_member(org_id));

drop policy if exists "creators delete projects" on public.projects;
create policy "creators delete projects" on public.projects
  for delete using (created_by = auth.uid());

-- New user -> their own organisation, as its admin ----------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  new_org uuid;
  display text := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
begin
  insert into public.organisations (name) values (display || '''s organisation') returning id into new_org;
  insert into public.memberships (org_id, user_id, is_admin) values (new_org, new.id, true);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users who signed up before this script ran also get an organisation.
do $$
declare
  u record;
  new_org uuid;
begin
  for u in select id, email from auth.users where not exists (select 1 from public.memberships m where m.user_id = auth.users.id) loop
    insert into public.organisations (name) values (split_part(u.email, '@', 1) || '''s organisation') returning id into new_org;
    insert into public.memberships (org_id, user_id, is_admin) values (new_org, u.id, true);
  end loop;
end $$;
