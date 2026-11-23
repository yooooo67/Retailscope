import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  DEMO_ACTIVITIES,
  DEMO_CONTACTS,
  DEMO_PROPERTIES,
  DEMO_TRANSACTIONS,
  type DemoActivity,
  type DemoContact,
  type DemoProperty,
  type DemoTransaction,
} from '@/lib/demoData'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { useLocalCollection, useTombstones } from '@/lib/localStore'
import { useProfile } from './useProfile'
import { useAuth } from './useAuth'

/* ------------------------------------------------------------------ */
/* Row mappers: Postgres snake_case <-> app camelCase                  */
/* ------------------------------------------------------------------ */

type DbRow = Record<string, unknown>

const propToRow = (p: Omit<DemoProperty, 'id'> & { id?: string }): DbRow => ({
  ...(p.id ? { id: p.id } : {}),
  name: p.name,
  category: p.category,
  location: p.location,
  area_sqm: p.areaSqm,
  asking_value: p.askingValue,
  status: p.status,
})
export const propFromRow = (r: DbRow): DemoProperty => ({
  id: r.id as string,
  name: r.name as string,
  category: r.category as DemoProperty['category'],
  location: (r.location as string) ?? '',
  areaSqm: Number(r.area_sqm ?? 0),
  askingValue: r.asking_value === null || r.asking_value === undefined ? null : Number(r.asking_value),
  status: r.status as DemoProperty['status'],
  addedAt: String(r.created_at ?? '').slice(0, 10),
})

const contactToRow = (c: Omit<DemoContact, 'id'> & { id?: string }): DbRow => ({
  ...(c.id ? { id: c.id } : {}),
  name: c.name,
  company: c.company,
  type: c.type,
  email: c.email,
  phone: c.phone,
  notes: c.notes ?? '',
  property_ids: c.propertyIds ?? [],
})
export const contactFromRow = (r: DbRow): DemoContact => ({
  id: r.id as string,
  name: r.name as string,
  company: (r.company as string) ?? '',
  type: r.type as DemoContact['type'],
  email: (r.email as string) ?? '',
  phone: (r.phone as string) ?? '',
  propertyIds: (r.property_ids as string[]) ?? [],
  notes: (r.notes as string) ?? '',
})

const txToRow = (t: Omit<DemoTransaction, 'id'> & { id?: string }): DbRow => ({
  ...(t.id ? { id: t.id } : {}),
  name: t.name,
  type: t.type,
  category: t.category,
  counterparty: t.counterparty,
  value: t.value,
  status: t.status,
  opened_at: t.createdAt,
  closed_at: t.closedAt,
})
export const txFromRow = (r: DbRow): DemoTransaction => ({
  id: r.id as string,
  name: r.name as string,
  type: r.type as DemoTransaction['type'],
  category: r.category as DemoTransaction['category'],
  counterparty: (r.counterparty as string) ?? '',
  value: Number(r.value ?? 0),
  status: r.status as DemoTransaction['status'],
  createdAt: String(r.opened_at ?? '').slice(0, 10),
  closedAt: r.closed_at ? String(r.closed_at).slice(0, 10) : null,
})

const actToRow = (a: Omit<DemoActivity, 'id'> & { id?: string }): DbRow => ({
  ...(a.id ? { id: a.id } : {}),
  title: a.title,
  type: a.type,
  related_to: a.relatedTo,
  scheduled_at: a.scheduledAt,
  status: a.status,
})
export const actFromRow = (r: DbRow): DemoActivity => ({
  id: r.id as string,
  title: r.title as string,
  type: r.type as DemoActivity['type'],
  relatedTo: (r.related_to as string) ?? '',
  scheduledAt: r.scheduled_at as string,
  status: r.status as DemoActivity['status'],
})

/* ------------------------------------------------------------------ */
/* Generic workspace collection: Supabase when configured, else local  */
/* ------------------------------------------------------------------ */

interface EntityConfig<T extends { id: string }> {
  table: string
  localKey: string
  tombstoneKey: string
  seed: T[]
  toRow: (item: Omit<T, 'id'> & { id?: string }) => DbRow
  fromRow: (r: DbRow) => T
  queryKey: string
}

function useEntity<T extends { id: string }>(cfg: EntityConfig<T>) {
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const agencyId = profile?.agency_id
  const queryClient = useQueryClient()
  const remote = isSupabaseConfigured && Boolean(supabase) && Boolean(agencyId)

  // --- local mode state (always instantiated; harmless when remote) ---
  const local = useLocalCollection<T>(cfg.localKey)
  const tomb = useTombstones(cfg.tombstoneKey)

  const localRows = useMemo(() => {
    const customIds = new Set(local.items.map((i) => i.id))
    return [
      ...local.items,
      ...cfg.seed.filter((s) => !customIds.has(s.id) && !tomb.deletedIds.has(s.id)),
    ]
  }, [local.items, tomb.deletedIds, cfg.seed])

  // --- remote query ---
  const query = useQuery({
    queryKey: [cfg.queryKey, agencyId],
    enabled: remote,
    queryFn: async (): Promise<T[]> => {
      const { data, error } = await supabase!
        .from(cfg.table)
        .select('*')
        .eq('agency_id', agencyId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as DbRow[]).map(cfg.fromRow)
    },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [cfg.queryKey] })

  const addMutation = useMutation({
    mutationFn: async (item: Omit<T, 'id'>) => {
      const { data, error } = await supabase!
        .from(cfg.table)
        .insert({ ...cfg.toRow(item), agency_id: agencyId })
        .select()
        .single()
      if (error) throw error
      return cfg.fromRow(data as DbRow)
    },
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<T> }) => {
      const { error } = await supabase!
        .from(cfg.table)
        .update(cfg.toRow(patch as Omit<T, 'id'> & { id?: string }))
        .eq('id', id)
        .eq('agency_id', agencyId!)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase!
        .from(cfg.table)
        .delete()
        .eq('id', id)
        .eq('agency_id', agencyId!)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  // Unified API used by pages
  const add = async (item: Omit<T, 'id'> & { id?: string }) => {
    if (remote) {
      const { id: _id, ...rest } = item as Omit<T, 'id'> & { id?: string }
      return addMutation.mutateAsync(rest as Omit<T, 'id'>)
    }
    return local.upsert({ ...item, id: item.id ?? crypto.randomUUID() } as T)
  }

  const update = async (id: string, patch: Partial<T>) => {
    if (remote) return updateMutation.mutateAsync({ id, patch })
    local.upsert({ ...(localRows.find((r) => r.id === id) ?? {}), ...patch, id } as T)
  }

  const remove = async (id: string) => {
    if (remote) return removeMutation.mutateAsync(id)
    local.remove(id)
    tomb.tombstone(id)
  }

  return {
    rows: remote ? (query.data ?? []) : localRows,
    isLoading: remote && query.isLoading,
    isError: remote && query.isError,
    refetch: query.refetch,
    add,
    update,
    remove,
    remote,
  }
}

/* ------------------------------------------------------------------ */
/* Public hooks                                                        */
/* ------------------------------------------------------------------ */

export function useProperties() {
  return useEntity<DemoProperty>({
    table: 'properties',
    localKey: 'retailscope.local.properties',
    tombstoneKey: 'retailscope.local.properties.deleted',
    seed: DEMO_PROPERTIES,
    toRow: propToRow,
    fromRow: propFromRow,
    queryKey: 'properties',
  })
}

export function useContacts() {
  return useEntity<DemoContact>({
    table: 'contacts',
    localKey: 'retailscope.local.contacts',
    tombstoneKey: 'retailscope.local.contacts.deleted',
    seed: DEMO_CONTACTS,
    toRow: contactToRow,
    fromRow: contactFromRow,
    queryKey: 'contacts',
  })
}

export function useTransactions() {
  return useEntity<DemoTransaction>({
    table: 'transactions',
    localKey: 'retailscope.local.transactions',
    tombstoneKey: 'retailscope.local.transactions.deleted',
    seed: DEMO_TRANSACTIONS,
    toRow: txToRow,
    fromRow: txFromRow,
    queryKey: 'transactions',
  })
}

export function useActivities() {
  return useEntity<DemoActivity>({
    table: 'activities',
    localKey: 'retailscope.local.activities',
    tombstoneKey: 'retailscope.local.activities.deleted',
    seed: DEMO_ACTIVITIES,
    toRow: actToRow,
    fromRow: actFromRow,
    queryKey: 'activities',
  })
}
