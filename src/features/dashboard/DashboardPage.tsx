import { Activity, BarChart3, Building2, CheckCircle2, Handshake, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { useAuth } from '@/hooks/useAuth'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useProfile } from '@/hooks/useProfile'
import { formatCurrency } from '@/lib/utils'
import { DEMO_ACTIVITIES, DEMO_PROPERTIES, DEMO_TRANSACTIONS } from '@/lib/demoData'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'
import { useLocalCollection, useTombstones } from '@/lib/localStore'
import type { DemoActivity, DemoProperty, DemoTransaction } from '@/lib/demoData'
import { StatusBadge, formatDateTime, money } from '../shared/statusBadges'

export function DashboardPage() {
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const [range, setRange] = useState('30d')
  const demoMode = !isSupabaseConfigured
  const { t } = useI18n()
  const customProps = useLocalCollection<DemoProperty>('retailscope.local.properties')
  const customTx = useLocalCollection<DemoTransaction>('retailscope.local.transactions')
  const customActs = useLocalCollection<DemoActivity>('retailscope.local.activities')
  const delProps = useTombstones('retailscope.local.properties.deleted')
  const delTx = useTombstones('retailscope.local.transactions.deleted')
  const delActs = useTombstones('retailscope.local.activities.deleted')
  const propIds = new Set(customProps.items.map((p) => p.id))
  const txIds = new Set(customTx.items.map((t) => t.id))
  const actIds = new Set(customActs.items.map((a) => a.id))
  const allProps = [
    ...customProps.items,
    ...DEMO_PROPERTIES.filter((p) => !propIds.has(p.id) && !delProps.deletedIds.has(p.id)),
  ]
  const allTx = [
    ...customTx.items,
    ...DEMO_TRANSACTIONS.filter((t) => !txIds.has(t.id) && !delTx.deletedIds.has(t.id)),
  ]
  const allActs = [
    ...customActs.items,
    ...DEMO_ACTIVITIES.filter((a) => !actIds.has(a.id) && !delActs.deletedIds.has(a.id)),
  ]

  const stats = useDashboardStats(profile?.agency_id)

  return (
    <div>
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        actions={
          <>
            <Select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="w-32"
              aria-label="Date range"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => stats.refetch()}
              disabled={stats.isFetching}
            >
              <RefreshCw className={stats.isFetching ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </>
        }
      />

      {/* KPI section */}
      {stats.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <LoadingState rows={1} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats.isError ? (
        <Card>
          <ErrorState
            title="Could not load dashboard metrics"
            description="The workspace data service did not respond. Check your connection and try again."
            onRetry={() => stats.refetch()}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t('dashboard.kpi.properties')}
            value={stats.data?.activeProperties ?? 0}
            icon={Building2}
            hint={stats.data?.available ? undefined : 'Awaiting property records'}
          />
          <StatCard
            label={t('dashboard.kpi.transactions')}
            value={stats.data?.openTransactions ?? 0}
            icon={Handshake}
          />
          <StatCard
            label={t('dashboard.kpi.dealValue')}
            value={formatCurrency(stats.data?.totalDealValue ?? 0)}
            icon={BarChart3}
          />
          <StatCard
            label={t('dashboard.kpi.closed')}
            value={stats.data?.closedDeals ?? 0}
            icon={CheckCircle2}
          />
        </div>
      )}

      {!stats.isLoading && !stats.data?.available && (
        <p className="mt-3 text-[12px] text-slate-muted">
          KPI values will populate automatically once the Properties and Transactions modules are
          connected to your database.
        </p>
      )}

      {/* Activity sections */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentTx')}</CardTitle>
            <CardDescription>{t('dashboard.recentTxDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {demoMode ? (
              <ul className="divide-y divide-line">
                {allTx.slice(0, 4).map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{t.name}</p>
                      <p className="text-[12px] text-slate-muted">{t.counterparty}</p>
                    </div>
                    <span className="text-[13px] font-medium text-ink">{money(t.value)}</span>
                    <StatusBadge value={t.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                compact
                icon={Handshake}
                title="No transactions yet"
                description="Deals will appear here once the Transactions module launches."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentProps')}</CardTitle>
            <CardDescription>{t('dashboard.recentPropsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {demoMode ? (
              <ul className="divide-y divide-line">
                {[...allProps]
                  .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
                  .slice(0, 4)
                  .map((p) => (
                    <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink">{p.name}</p>
                        <p className="text-[12px] text-slate-muted">
                          {p.category} · {p.location}
                        </p>
                      </div>
                      <StatusBadge value={p.status} />
                    </li>
                  ))}
              </ul>
            ) : (
              <EmptyState
                compact
                icon={Building2}
                title="No properties yet"
                description="Properties will appear here once the Properties module launches."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.upcoming')}</CardTitle>
            <CardDescription>{t('dashboard.upcomingDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {demoMode ? (
              <ul className="divide-y divide-line">
                { allActs.filter((a) => a.status === 'upcoming')
                  .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
                  .slice(0, 4)
                  .map((a) => (
                    <li key={a.id} className="px-5 py-3">
                      <p className="truncate text-[13px] font-medium text-ink">{a.title}</p>
                      <p className="text-[12px] text-slate-muted">{formatDateTime(a.scheduledAt)}</p>
                    </li>
                  ))}
              </ul>
            ) : (
              <EmptyState
                compact
                icon={Activity}
                title="Nothing scheduled"
                description="Activities will appear here once the Activities module launches."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Intelligence preview */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{t('dashboard.insights')}</CardTitle>
          <CardDescription>
            {t('dashboard.insightsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            compact
            icon={BarChart3}
            title={t('dashboard.insightsTitle')}
            description="Market insights will become available once sufficient agency data has been collected across properties, transactions and activities. No estimates are shown until the underlying data exists."
            action={
              <Link to="/intelligence" className="text-[13px] font-medium text-teal hover:underline">
                Learn about Market Intelligence →
              </Link>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
