-- RETAILSCOPE seed data — DEVELOPMENT ONLY.
-- All names below are fictional placeholders. Do not use real customer data.
-- Run manually from the Supabase SQL editor after applying migrations.

-- 1. Create the initial agency (adjust name as needed).
insert into public.agencies (name)
values ('Demo Commercial Realty')
on conflict do nothing;

-- 2. Create the first admin user via Supabase Auth (Dashboard → Authentication
--    → Users → Add user), then promote them:
--
--    update public.profiles
--    set role = 'administrator'
--    where email = 'admin@youragency.com';
--
-- If the user was created before the agency existed, assign manually:
--
--    update public.profiles
--    set agency_id = (select id from public.agencies limit 1)
--    where email = 'admin@youragency.com';
