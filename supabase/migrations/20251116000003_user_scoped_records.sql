-- RETAILSCOPE — per-account data scoping
-- Records belong to the user who created them, not just the agency.
-- Keeps agency_id for future multi-agency support.

-- 1. Add nullable column, backfill existing rows to their agency's user,
--    then enforce NOT NULL + default.
alter table public.properties add column created_by uuid references auth.users (id);
alter table public.contacts add column created_by uuid references auth.users (id);
alter table public.transactions add column created_by uuid references auth.users (id);
alter table public.activities add column created_by uuid references auth.users (id);

update public.properties p
set created_by = (select pr.id from public.profiles pr where pr.agency_id = p.agency_id limit 1)
where p.created_by is null;
update public.contacts c
set created_by = (select pr.id from public.profiles pr where pr.agency_id = c.agency_id limit 1)
where c.created_by is null;
update public.transactions t
set created_by = (select pr.id from public.profiles pr where pr.agency_id = t.agency_id limit 1)
where t.created_by is null;
update public.activities a
set created_by = (select pr.id from public.profiles pr where pr.agency_id = a.agency_id limit 1)
where a.created_by is null;

alter table public.properties alter column created_by set not null;
alter table public.properties alter column created_by set default auth.uid();
alter table public.contacts alter column created_by set not null;
alter table public.contacts alter column created_by set default auth.uid();
alter table public.transactions alter column created_by set not null;
alter table public.transactions alter column created_by set default auth.uid();
alter table public.activities alter column created_by set not null;
alter table public.activities alter column created_by set default auth.uid();

create index properties_created_by_idx on public.properties (created_by);
create index contacts_created_by_idx on public.contacts (created_by);
create index transactions_created_by_idx on public.transactions (created_by);
create index activities_created_by_idx on public.activities (created_by);

-- 2. Replace agency-wide policies with owner-scoped policies
drop policy if exists properties_select on public.properties;
drop policy if exists properties_insert on public.properties;
drop policy if exists properties_update on public.properties;
drop policy if exists properties_delete on public.properties;
drop policy if exists contacts_select on public.contacts;
drop policy if exists contacts_insert on public.contacts;
drop policy if exists contacts_update on public.contacts;
drop policy if exists contacts_delete on public.contacts;
drop policy if exists transactions_select on public.transactions;
drop policy if exists transactions_insert on public.transactions;
drop policy if exists transactions_update on public.transactions;
drop policy if exists transactions_delete on public.transactions;
drop policy if exists activities_select on public.activities;
drop policy if exists activities_insert on public.activities;
drop policy if exists activities_update on public.activities;
drop policy if exists activities_delete on public.activities;

create policy "properties_select" on public.properties for select to authenticated
  using (created_by = auth.uid());
create policy "properties_insert" on public.properties for insert to authenticated
  with check (created_by = auth.uid());
create policy "properties_update" on public.properties for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());
create policy "properties_delete" on public.properties for delete to authenticated
  using (created_by = auth.uid());

create policy "contacts_select" on public.contacts for select to authenticated
  using (created_by = auth.uid());
create policy "contacts_insert" on public.contacts for insert to authenticated
  with check (created_by = auth.uid());
create policy "contacts_update" on public.contacts for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());
create policy "contacts_delete" on public.contacts for delete to authenticated
  using (created_by = auth.uid());

create policy "transactions_select" on public.transactions for select to authenticated
  using (created_by = auth.uid());
create policy "transactions_insert" on public.transactions for insert to authenticated
  with check (created_by = auth.uid());
create policy "transactions_update" on public.transactions for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());
create policy "transactions_delete" on public.transactions for delete to authenticated
  using (created_by = auth.uid());

create policy "activities_select" on public.activities for select to authenticated
  using (created_by = auth.uid());
create policy "activities_insert" on public.activities for insert to authenticated
  with check (created_by = auth.uid());
create policy "activities_update" on public.activities for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());
create policy "activities_delete" on public.activities for delete to authenticated
  using (created_by = auth.uid());
