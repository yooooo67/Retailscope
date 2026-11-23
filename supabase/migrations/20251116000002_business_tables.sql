-- RETAILSCOPE — Phase 2 business tables
-- properties, contacts, transactions, activities — all agency-scoped with RLS.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  name text not null,
  category text not null check (category in ('Retail', 'Office', 'Hospitality', 'Industrial', 'Mixed-use')),
  location text not null default '',
  area_sqm numeric(12, 2) check (area_sqm is null or area_sqm > 0),
  asking_value numeric(14, 2) check (asking_value is null or asking_value > 0),
  status text not null default 'available'
    check (status in ('available', 'under_offer', 'let', 'sold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  name text not null,
  company text not null default '',
  type text not null default 'owner'
    check (type in ('owner', 'tenant', 'buyer', 'broker', 'service_provider')),
  email text not null default '',
  phone text not null default '',
  notes text not null default '',
  property_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  name text not null,
  type text not null check (type in ('sale', 'acquisition', 'lease')),
  category text not null
    check (category in ('Retail', 'Office', 'Hospitality', 'Industrial', 'Mixed-use')),
  counterparty text not null default '',
  value numeric(14, 2) not null check (value > 0),
  status text not null default 'open'
    check (status in ('open', 'negotiation', 'closed_won', 'closed_lost')),
  opened_at date not null default current_date,
  closed_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  title text not null,
  type text not null check (type in ('call', 'meeting', 'viewing', 'task', 'email')),
  related_to text not null default '',
  scheduled_at timestamptz not null,
  status text not null default 'upcoming'
    check (status in ('upcoming', 'completed', 'overdue')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index properties_agency_idx on public.properties (agency_id);
create index properties_status_idx on public.properties (agency_id, status);
create index contacts_agency_idx on public.contacts (agency_id);
create index transactions_agency_idx on public.transactions (agency_id);
create index transactions_status_idx on public.transactions (agency_id, status);
create index activities_agency_idx on public.activities (agency_id);
create index activities_scheduled_idx on public.activities (agency_id, scheduled_at);

-- ---------------------------------------------------------------------------
-- updated_at triggers (reuse public.set_updated_at from foundation migration)
-- ---------------------------------------------------------------------------
create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

create trigger contacts_set_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

create trigger activities_set_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — every row belongs to exactly one agency
-- ---------------------------------------------------------------------------
alter table public.properties enable row level security;
alter table public.contacts enable row level security;
alter table public.transactions enable row level security;
alter table public.activities enable row level security;

-- properties
create policy "properties_select" on public.properties for select to authenticated
  using (agency_id = public.current_agency_id());
create policy "properties_insert" on public.properties for insert to authenticated
  with check (agency_id = public.current_agency_id());
create policy "properties_update" on public.properties for update to authenticated
  using (agency_id = public.current_agency_id())
  with check (agency_id = public.current_agency_id());
create policy "properties_delete" on public.properties for delete to authenticated
  using (agency_id = public.current_agency_id());

-- contacts
create policy "contacts_select" on public.contacts for select to authenticated
  using (agency_id = public.current_agency_id());
create policy "contacts_insert" on public.contacts for insert to authenticated
  with check (agency_id = public.current_agency_id());
create policy "contacts_update" on public.contacts for update to authenticated
  using (agency_id = public.current_agency_id())
  with check (agency_id = public.current_agency_id());
create policy "contacts_delete" on public.contacts for delete to authenticated
  using (agency_id = public.current_agency_id());

-- transactions
create policy "transactions_select" on public.transactions for select to authenticated
  using (agency_id = public.current_agency_id());
create policy "transactions_insert" on public.transactions for insert to authenticated
  with check (agency_id = public.current_agency_id());
create policy "transactions_update" on public.transactions for update to authenticated
  using (agency_id = public.current_agency_id())
  with check (agency_id = public.current_agency_id());
create policy "transactions_delete" on public.transactions for delete to authenticated
  using (agency_id = public.current_agency_id());

-- activities
create policy "activities_select" on public.activities for select to authenticated
  using (agency_id = public.current_agency_id());
create policy "activities_insert" on public.activities for insert to authenticated
  with check (agency_id = public.current_agency_id());
create policy "activities_update" on public.activities for update to authenticated
  using (agency_id = public.current_agency_id())
  with check (agency_id = public.current_agency_id());
create policy "activities_delete" on public.activities for delete to authenticated
  using (agency_id = public.current_agency_id());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.properties to authenticated;
grant select, insert, update, delete on public.contacts to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.activities to authenticated;
grant all on public.properties to service_role;
grant all on public.contacts to service_role;
grant all on public.transactions to service_role;
grant all on public.activities to service_role;
