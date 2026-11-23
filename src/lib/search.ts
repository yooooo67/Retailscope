import {
  DEMO_ACTIVITIES,
  DEMO_CONTACTS,
  DEMO_PROPERTIES,
  DEMO_TRANSACTIONS,
} from '@/lib/demoData'
import type { DemoActivity, DemoContact, DemoProperty, DemoTransaction } from '@/lib/demoData'

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

function getWorkspaceData() {
  return {
    properties: merge<DemoProperty>('retailscope.local.properties', 'retailscope.local.properties.deleted', DEMO_PROPERTIES),
    contacts: merge<DemoContact>('retailscope.local.contacts', 'retailscope.local.contacts.deleted', DEMO_CONTACTS),
    transactions: merge<DemoTransaction>('retailscope.local.transactions', 'retailscope.local.transactions.deleted', DEMO_TRANSACTIONS),
    activities: merge<DemoActivity>('retailscope.local.activities', 'retailscope.local.activities.deleted', DEMO_ACTIVITIES),
  }
}

const norm = (s: string) => s.toLowerCase()

function matches(haystack: string, q: string) {
  return norm(haystack).includes(norm(q))
}

/** Search all workspace modules. Returns grouped-ready flat results, best matches first. */
export function searchWorkspace(query: string, limit = 30): SearchResult[] {
  const q = query.trim()
  if (q.length < 2) return []

  const { properties, contacts, transactions, activities } = getWorkspaceData()
  const results: SearchResult[] = []

  for (const p of properties) {
    const hay = `${p.name} ${p.category} ${p.location} ${p.status}`
    if (matches(hay, q)) {
      results.push({
        type: 'property',
        id: p.id,
        title: p.name,
        subtitle: `${p.category} · ${p.location}`,
        to: `/properties/${p.id}`,
      })
    }
  }

  for (const c of contacts) {
    const hay = `${c.name} ${c.company} ${c.email} ${c.type} ${c.notes ?? ''}`
    if (matches(hay, q)) {
      results.push({
        type: 'contact',
        id: c.id,
        title: c.name,
        subtitle: `${c.company} · ${c.type.replace('_', ' ')}`,
        to: '/contacts',
      })
    }
  }

  for (const t of transactions) {
    const hay = `${t.name} ${t.counterparty} ${t.category} ${t.status} ${t.type}`
    if (matches(hay, q)) {
      results.push({
        type: 'transaction',
        id: t.id,
        title: t.name,
        subtitle: `${t.counterparty} · ${t.status.replace(/_/g, ' ')}`,
        to: '/transactions',
      })
    }
  }

  for (const a of activities) {
    const hay = `${a.title} ${a.relatedTo} ${a.type} ${a.status}`
    if (matches(hay, q)) {
      results.push({
        type: 'activity',
        id: a.id,
        title: a.title,
        subtitle: `${a.relatedTo} · ${a.status}`,
        to: '/activities',
      })
    }
  }

  // Exact-ish matches first, then alphabetical within type
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
