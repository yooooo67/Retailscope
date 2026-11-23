import {
  DEMO_ACTIVITIES,
  DEMO_CONTACTS,
  DEMO_PROPERTIES,
  DEMO_TRANSACTIONS,
} from '@/lib/demoData'
import type { DemoActivity, DemoContact, DemoProperty, DemoTransaction } from '@/lib/demoData'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import {
  actFromRow,
  contactFromRow,
  propFromRow,
  txFromRow,
} from '@/hooks/useWorkspaceData'

export type SearchResultType = 'property' | 'contact' | 'transaction' | 'activity'

export interface SearchResult {
  type: SearchResultType
  id: string
  title: string
  subtitle: string
  /** route to navigate to */
  to: string
}

function load<T extends { id: string }>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]
  } catch {
    return []
  }
}

function loadDeleted(key: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function merge<T extends { id: string }>(
  customKey: string,
  deletedKey: string,
  seed: T[],
): T[] {
  const custom = load<T>(customKey)
  const customIds = new Set(custom.map((c) => c.id))
  const deleted = loadDeleted(deletedKey)
  return [...custom, ...seed.filter((s) => !customIds.has(s.id) && !deleted.has(s.id))]
}

function getLocalData() {
  return {
    properties: merge<DemoProperty>('retailscope.local.properties', 'retailscope.local.properties.deleted', DEMO_PROPERTIES),
    contacts: merge<DemoContact>('retailscope.local.contacts', 'retailscope.local.contacts.deleted', DEMO_CONTACTS),
    transactions: merge<DemoTransaction>('retailscope.local.transactions', 'retailscope.local.transactions.deleted', DEMO_TRANSACTIONS),
    activities: merge<DemoActivity>('retailscope.local.activities', 'retailscope.local.activities.deleted', DEMO_ACTIVITIES),
  }
}

async function getRemoteData() {
  const [props, contacts, txs, acts] = await Promise.all([
    supabase!.from('properties').select('*'),
    supabase!.from('contacts').select('*'),
    supabase!.from('transactions').select('*'),
    supabase!.from('activities').select('*'),
  ])
  return {
    properties: (props.data ?? []).map((r) => propFromRow(r)),
    contacts: (contacts.data ?? []).map((r) => contactFromRow(r)),
    transactions: (txs.data ?? []).map((r) => txFromRow(r)),
    activities: (acts.data ?? []).map((r) => actFromRow(r)),
  }
}

const norm = (s: string) => s.toLowerCase()
const matches = (haystack: string, q: string) => norm(haystack).includes(norm(q))

/** Search all workspace modules against the live DB (or local demo data). */
export async function searchWorkspace(query: string, limit = 30): Promise<SearchResult[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const data = isSupabaseConfigured && supabase ? await getRemoteData() : getLocalData()
  const results: SearchResult[] = []

  for (const p of data.properties) {
    if (matches(`${p.name} ${p.category} ${p.location} ${p.status}`, q)) {
      results.push({
        type: 'property',
        id: p.id,
        title: p.name,
        subtitle: `${p.category} · ${p.location}`,
        to: `/properties/${p.id}`,
      })
    }
  }

  for (const c of data.contacts) {
    if (matches(`${c.name} ${c.company} ${c.email} ${c.type} ${c.notes ?? ''}`, q)) {
      results.push({
        type: 'contact',
        id: c.id,
        title: c.name,
        subtitle: `${c.company} · ${c.type.replace('_', ' ')}`,
        to: '/contacts',
      })
    }
  }

  for (const t of data.transactions) {
    if (matches(`${t.name} ${t.counterparty} ${t.category} ${t.status} ${t.type}`, q)) {
      results.push({
        type: 'transaction',
        id: t.id,
        title: t.name,
        subtitle: `${t.counterparty} · ${t.status.replace(/_/g, ' ')}`,
        to: '/transactions',
      })
    }
  }

  for (const a of data.activities) {
    if (matches(`${a.title} ${a.relatedTo} ${a.type} ${a.status}`, q)) {
      results.push({
        type: 'activity',
        id: a.id,
        title: a.title,
        subtitle: `${a.relatedTo} · ${a.status}`,
        to: '/activities',
      })
    }
  }

  const typeOrder: Record<SearchResultType, number> = {
    property: 0,
    transaction: 1,
    contact: 2,
    activity: 3,
  }
  return results
    .sort((a, b) => typeOrder[a.type] - typeOrder[b.type] || a.title.localeCompare(b.title))
    .slice(0, limit)
}

export const SEARCH_TYPE_LABELS: Record<SearchResultType, string> = {
  property: 'Properties',
  contact: 'Contacts',
  transaction: 'Transactions',
  activity: 'Activities',
}
