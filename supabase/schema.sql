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
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  name text not null,
  description text not null default '',
  prompt text not null default '',
  slug text not null,
  stage text not null default 'plan' check (stage in ('plan','connect','build','test','ship','live')),
  status text not null default 'draft' check (status in ('draft','preview','in_review','live')),
  spend_usd numeric(10,2) not null default 0,
  tests_passed int not null default 0,
  tests_total int not null default 0,
  -- Where the scripted journey is (answers, connections, test run, review state), shared by everyone on the project.
  journey jsonb not null default '{}'::jsonb,
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
  display text := coalesce(new.raw_user_meta_data->>'full_name', nullif(split_part(coalesce(new.email, ''), '@', 1), ''));
begin
  insert into public.organisations (name) values (coalesce(display || '''s organisation', 'My organisation')) returning id into new_org;
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
    insert into public.organisations (name) values (coalesce(nullif(split_part(coalesce(u.email, ''), '@', 1), '') || '''s workspace', 'My workspace')) returning id into new_org;
    insert into public.memberships (org_id, user_id, is_admin) values (new_org, u.id, true);
  end loop;
end $$;

-- For databases created before the journey column existed.
alter table public.projects add column if not exists journey jsonb not null default '{}'::jsonb;

-- Workspaces ------------------------------------------------------------------
-- An organisation is a workspace. An FDE keeps their own and one per customer; each has its own
-- members, approval rule and deploy target, and nothing is shared across them.
alter table public.organisations add column if not exists kind text not null default 'own' check (kind in ('own','customer'));
alter table public.organisations add column if not exists deploy_target text not null default 'architect' check (deploy_target in ('architect','customer_cloud'));
alter table public.organisations add column if not exists cloud_account text not null default '';

create or replace function public.create_workspace(p_name text, p_kind text default 'customer')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  new_org uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  insert into public.organisations (name, kind, approval_required)
    values (p_name, p_kind, p_kind = 'customer') returning id into new_org;
  insert into public.memberships (org_id, user_id, is_admin) values (new_org, auth.uid(), true);
  return new_org;
end;
$$;
grant execute on function public.create_workspace(text, text) to authenticated;

-- Invitations -----------------------------------------------------------------
-- Pending until someone signs in with that email; then they become a member with the role's permissions.
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin','builder','developer','approver')),
  status text not null default 'pending' check (status in ('pending','accepted')),
  invited_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, email)
);
alter table public.invitations enable row level security;

drop policy if exists "members read invitations" on public.invitations;
create policy "members read invitations" on public.invitations
  for select using (public.is_member(org_id));

drop policy if exists "admins invite" on public.invitations;
create policy "admins invite" on public.invitations
  for insert with check (exists (select 1 from public.memberships m where m.org_id = invitations.org_id and m.user_id = auth.uid() and m.is_admin));

create or replace function public.role_permissions(p_role text)
returns text[] language sql immutable as $$
  select case p_role
    when 'builder' then array['build']
    when 'developer' then array['build','edit_code']
    when 'approver' then array['approve','deploy']
    else array['build','edit_code','approve','deploy']
  end;
$$;

create or replace function public.accept_invitations_for(p_user uuid, p_email text)
returns int language plpgsql security definer set search_path = public as $$
declare
  inv record;
  n int := 0;
begin
  if p_user is null or p_email is null then return 0; end if;
  for inv in select * from public.invitations where lower(email) = lower(p_email) and status = 'pending' loop
    insert into public.memberships (org_id, user_id, is_admin, permissions)
      values (inv.org_id, p_user, inv.role = 'admin', public.role_permissions(inv.role))
      on conflict (org_id, user_id) do nothing;
    update public.invitations set status = 'accepted' where id = inv.id;
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- Called by the app after sign-in, for people who already had an account when they were invited.
create or replace function public.accept_invitations()
returns int language sql security definer set search_path = public as $$
  -- Only a confirmed email can claim an invitation, so signing up with someone else's address gets nothing.
  select public.accept_invitations_for(auth.uid(), (select email from auth.users where id = auth.uid() and email_confirmed_at is not null));
$$;
grant execute on function public.accept_invitations() to authenticated;
-- Internal helpers: Supabase grants new functions to everyone, so take that back. Their security definer callers still work.
revoke execute on function public.accept_invitations_for(uuid, text) from public, anon, authenticated;

-- New users get their own workspace. Invitations are claimed after sign-in, once the email is confirmed.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  new_org uuid;
  display text := coalesce(new.raw_user_meta_data->>'full_name', nullif(split_part(coalesce(new.email, ''), '@', 1), ''));
begin
  insert into public.organisations (name) values (coalesce(display || '''s workspace', 'My workspace')) returning id into new_org;
  insert into public.memberships (org_id, user_id, is_admin) values (new_org, new.id, true);
  return new;
end;
$$;

-- Blueprints ------------------------------------------------------------------
-- A delivered app saved for reuse: its plan answers and prompt, never the customer's files or data.
create table if not exists public.blueprints (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  prompt text not null,
  answers jsonb not null default '{}'::jsonb,
  suggested_on text[] not null default '{}',
  source text not null default '',
  created_at timestamptz not null default now()
);
alter table public.blueprints enable row level security;

drop policy if exists "owners use their blueprints" on public.blueprints;
create policy "owners use their blueprints" on public.blueprints
  for all using (owner = auth.uid()) with check (owner = auth.uid());

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Projects: who created a project and which workspace it belongs to are set by the database, not the client.
-- Going live needs the deploy permission. (The separate-approver check runs in the app in this prototype.)
create or replace function public.guard_project()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
  elsif pg_trigger_depth() = 1 then  -- a direct client update, not the ON DELETE SET NULL from auth.users
    new.created_by := old.created_by;
    new.org_id := old.org_id;
    if ((new.status = 'live' and old.status <> 'live') or (new.stage = 'live' and old.stage <> 'live'))
       and auth.uid() is not null and not exists (
      select 1 from public.memberships m where m.org_id = old.org_id and m.user_id = auth.uid() and 'deploy' = any(m.permissions)
    ) then
      raise exception 'You need the deploy permission in this workspace to put a version live';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.guard_project() from public, anon, authenticated;

drop trigger if exists guard_project on public.projects;
create trigger guard_project before insert or update on public.projects
  for each row execute function public.guard_project();

-- Databases created before these columns could be emptied when a user is deleted.
alter table public.projects alter column created_by drop not null;
alter table public.projects drop constraint if exists projects_created_by_fkey;
alter table public.projects add constraint projects_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null;
alter table public.invitations alter column invited_by drop not null;
alter table public.invitations drop constraint if exists invitations_invited_by_fkey;
alter table public.invitations add constraint invitations_invited_by_fkey foreign key (invited_by) references auth.users(id) on delete set null;

-- Credits: top-ups recorded per workspace (simulated in the prototype; no payment is taken).
alter table public.organisations add column if not exists credit_topups jsonb not null default '[]'::jsonb;

-- Blueprint versions: an FDE publishes updates from the source project and rolls them out to customers.
alter table public.blueprints add column if not exists version int not null default 1;
alter table public.blueprints add column if not exists source_project uuid references public.projects(id) on delete set null;
alter table public.blueprints add column if not exists source_version int not null default 1;
alter table public.blueprints add column if not exists changelog jsonb not null default '[]'::jsonb;
