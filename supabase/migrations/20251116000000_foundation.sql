-- RETAILSCOPE — Phase 1 foundation migration
-- Creates agencies + profiles with role constraints, indexes, an auth-user
-- provisioning trigger, and agency-scoped Row Level Security policies.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  agency_id uuid not null references public.agencies (id) on delete cascade,
  full_name text not null default '',
  email text not null,
  role text not null default 'agent' check (role in ('administrator', 'manager', 'agent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index profiles_agency_id_idx on public.profiles (agency_id);
create index profiles_email_idx on public.profiles (email);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger agencies_set_updated_at
  before update on public.agencies
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Profile provisioning: when a Supabase Auth user is created, insert a
-- profile. Agency assignment happens after creation by an administrator
-- (defaults handled in seed.sql / admin tooling — see README).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agency_id uuid;
begin
  -- Assign to the first agency when only one exists (single-agency phase).
  select id into v_agency_id from public.agencies order by created_at limit 1;

  if v_agency_id is null then
    -- No agency yet: skip profile creation; an admin must provision manually.
    return new;
  end if;

  insert into public.profiles (id, agency_id, full_name, email, role)
  values (
    new.id,
    v_agency_id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    'agent'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Helper: current user's agency id (used by RLS policies)
-- ---------------------------------------------------------------------------
create or replace function public.current_agency_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select agency_id from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.agencies enable row level security;
alter table public.profiles enable row level security;

-- Agencies: members can read their own agency; only administrators can update.
create policy "agencies_select_own"
  on public.agencies for select
  to authenticated
  using (id = public.current_agency_id());

create policy "agencies_update_admin"
  on public.agencies for update
  to authenticated
  using (
    id = public.current_agency_id()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'administrator'
    )
  );

-- Profiles: members can read profiles within their agency.
create policy "profiles_select_same_agency"
  on public.profiles for select
  to authenticated
  using (agency_id = public.current_agency_id());

-- Profiles: users can update their own profile; administrators can update
-- any profile within their agency (e.g. role changes).
create policy "profiles_update_self_or_admin"
  on public.profiles for update
  to authenticated
  using (
    agency_id = public.current_agency_id()
    and (
      id = auth.uid()
      or exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'administrator'
      )
    )
  );

-- No direct INSERT policy for profiles: creation happens via the
-- handle_new_user trigger (security definer) or service role.

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select on public.agencies to authenticated;
grant select, update on public.profiles to authenticated;
grant all on public.agencies to service_role;
grant all on public.profiles to service_role;
