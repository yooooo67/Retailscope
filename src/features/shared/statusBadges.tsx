import { Badge } from '@/components/ui/badge'
import type { DemoActivity, DemoProperty, DemoTransaction } from '@/lib/demoData'
import { formatCurrency } from '@/lib/utils'

const variantMap: Record<string, 'default' | 'teal' | 'success' | 'warning' | 'danger' | 'info' | 'outline'> = {
  available: 'teal',
  under_offer: 'warning',
  let: 'success',
  sold: 'default',
  open: 'info',
  negotiation: 'warning',
  closed_won: 'success',
  closed_lost: 'danger',
  upcoming: 'info',
  completed: 'success',
  overdue: 'danger',
  owner: 'default',
  tenant: 'teal',
  buyer: 'info',
  broker: 'warning',
  service_provider: 'outline',
  call: 'default',
  meeting: 'info',
  viewing: 'teal',
  task: 'warning',
  email: 'outline',
  sale: 'default',
  acquisition: 'teal',
  lease: 'info',
}

function statusLabel(s: string) {
  return s.replace(/_/g, ' ')
}

export function StatusBadge({ value }: { value: string }) {
  return (
    <Badge variant={variantMap[value] ?? 'outline'} className="capitalize">
      {statusLabel(value)}
    </Badge>
  )
}

export function money(v: number | null | undefined) {
  return v === null || v === undefined ? '—' : formatCurrency(v)
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export type { DemoProperty, DemoTransaction, DemoActivity }
