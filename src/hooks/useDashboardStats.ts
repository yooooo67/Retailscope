import { useQuery } from '@tanstack/react-query'
import { useProperties, useTransactions } from './useWorkspaceData'

export interface DashboardStats {
  activeProperties: number
  openTransactions: number
  totalDealValue: number
  closedDeals: number
  available: boolean
}

/**
 * Dashboard KPIs computed from the workspace collections.
 * Works identically in demo (local) and live (Supabase) modes.
 */
export function useDashboardStats() {
  const properties = useProperties()
  const transactions = useTransactions()

  return useQuery({
    queryKey: ['dashboard-stats', properties.rows.length, transactions.rows.length],
    queryFn: async (): Promise<DashboardStats> => {
      const props = properties.rows
      const txs = transactions.rows
      const open = txs.filter((t) => ['open', 'negotiation'].includes(t.status))
      const closed = txs.filter((t) => t.status === 'closed_won' || t.status === 'closed_lost')
      return {
        activeProperties: props.filter(
          (p) => p.status === 'available' || p.status === 'under_offer',
        ).length,
        openTransactions: open.length,
        totalDealValue: txs.reduce((s, t) => s + t.value, 0),
        closedDeals: closed.length,
        available: true,
      }
    },
  })
}
