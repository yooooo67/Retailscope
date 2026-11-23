# RETAILSCOPE

Commercial Real Estate Intelligence platform for commercial real estate agencies.
B2B SaaS — Phase 1: foundation, design system, auth and dashboard.

## Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query, React Hook Form + Zod, Recharts, Lucide icons, Sonner toasts
- **Backend:** Supabase (Postgres, Auth, RLS)

## Getting started

```bash
npm install
cp .env.example .env   # fill in Supabase credentials
npm run dev            # http://localhost:5173
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key — safe for frontend |

Without credentials the app renders a setup screen instead of crashing.
Never commit `.env`; never use the service-role key in frontend code.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. Apply `supabase/migrations/20251116000000_foundation.sql` via the SQL editor (or `supabase db push` if using the CLI).
3. Optionally run `supabase/seed.sql` to create the initial agency.
4. Create your first user under Authentication → Users, then promote to `administrator` (see comments in `seed.sql`).
5. Put the project URL + anon key in `.env` and restart the dev server.

The migration creates `agencies`, `profiles` (roles: `administrator`, `manager`, `agent`), an `on_auth_user_created` trigger that provisions profiles, and RLS policies enforcing agency-level isolation. Business tables (properties, contacts, transactions, activities) arrive in Phase 2 — every agency-owned table must carry `agency_id` and matching RLS policies.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | oxlint |

## Structure

```
src/
  app/            providers, router, App
  components/
    layout/       AppLayout, Sidebar, Topbar
    ui/           design-system primitives
    shared/       PageHeader, StatCard, EmptyState, Loading/Error states
  features/       dashboard, auth, settings, placeholders
  hooks/          useAuth, useProfile/useAgency, useDashboardStats
  lib/            supabase client, utils
  types/          shared domain types
supabase/
  migrations/     SQL migrations
  seed.sql        dev-only seed (fictional data only)
```

## Status

Phase 1 complete: design system, navigation shell, auth foundation, dashboard with honest empty/zero states, DB foundation + RLS. Properties/Contacts/Transactions/Activities/Intelligence/AI Assistant are routed placeholder pages pending later phases.
