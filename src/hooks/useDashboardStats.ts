import { useQuery } from '@tanstack/react-query'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import {
  DEMO_PROPERTIES,
  DEMO_TRANSACTIONS,
  type DemoProperty,
  type DemoTransaction,
} from '@/lib/demoData'

export interface DashboardStats {
  activeProperties: number
  openTransactions: number
  totalDealValue: number
  closedDeals: number
  /** false when business tables are not yet migrated — UI shows zeros honestly */
  available: boolean
}

const EMPTY: DashboardStats = {
  activeProperties: 0,
  openTransactions: 0,
  totalDealValue: 0,
  closedDeals: 0,
  available: false,
}

/**
 * Derives dashboard KPIs from real tables when they exist.
 * The business schema (properties, transactions) lands in a later phase;
 * until then this returns zeros with `available: false` instead of
 * fabricating numbers. In demo mode (no Supabase) returns demo zeros.
 */
export function useDashboardStats(agencyId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard-stats', agencyId],
    enabled: Boolean(agencyId),
    queryFn: async (): Promise<DashboardStats> => {
      if (!isSupabaseConfigured || !supabase) {
        // Demo mode: combine fictional seed data with records the user added locally.
        const load = <T,>(key: string): T[] => {
          try {
            return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]
          } catch {
            return []
          }
        }
        const properties = [
          ...load<DemoProperty>('retailscope.local.properties'),
          ...DEMO_PROPERTIES,
        ]
        const transactions = [
          ...load<DemoTransaction>('retailscope.local.transactions'),
          ...DEMO_TRANSACTIONS,
        ]
        const open = transactions.filter((t) => ['open', 'negotiation'].includes(t.status))
        const closed = transactions.filter((t) => t.status === 'closed_won' || t.status === 'closed_lost')
        return {
          activeProperties: properties.filter(
            (p) => p.status === 'available' || p.status === 'under_offer',
          ).length,
          openTransactions: open.length,
          totalDealValue: transactions.reduce((s, t) => s + t.value, 0),
          closedDeals: closed.length,
          available: true,
        }
      }

      const [properties, transactions] = await Promise.all([
        supabase
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('agency_id', agencyId!)
          .eq('status', 'active'),
        supabase
          .from('transactions')
          .select('id, status, value', { count: 'exact' })
          .eq('agency_id', agencyId!),
      ])

      if (properties.error || transactions.error) return EMPTY

      const rows = (transactions.data ?? []) as { status: string; value: number | null }[]
      const open = rows.filter((r) => ['open', 'in_progress', 'pending'].includes(r.status))
      const closed = rows.filter((r) => r.status === 'closed' || r.status === 'won')

      return {
        activeProperties: properties.count ?? 0,
        openTransactions: open.length,
        totalDealValue: rows.reduce((sum, r) => sum + (r.value ?? 0), 0),
        closedDeals: closed.length,
        available: true,
      }
    },
  })
}
