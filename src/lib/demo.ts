import type { Agency, Profile } from '@/types'
import type { DashboardStats } from '@/hooks/useDashboardStats'

/**
 * Demo mode — FICTIONAL data for local UI development only.
 * Active automatically when Supabase env vars are not configured.
 * Never present this data as real agency data.
 */

const SESSION_KEY = 'retailscope.demo.session'

export const DEMO_AGENCY: Agency = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Demo Commercial Realty',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

export const DEMO_PROFILE: Profile = {
  id: 'demo-user',
  agency_id: DEMO_AGENCY.id,
  full_name: 'Demo User',
  email: 'demo@retailscope.app',
  role: 'administrator',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

export const DEMO_STATS: DashboardStats = {
  activeProperties: 0,
  openTransactions: 0,
  totalDealValue: 0,
  closedDeals: 0,
  available: false,
}

export function getDemoSession(): { email: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as { email: string }) : null
  } catch {
    return null
  }
}

export function demoSignIn(email: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email }))
}

export function demoSignOut() {
  localStorage.removeItem(SESSION_KEY)
}
