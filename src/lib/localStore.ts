import * as React from 'react'

/**
 * Minimal localStorage-backed collection hook.
 * Used for user-created records while the backend schema is not yet live.
 * Data stays in the browser; swap for Supabase queries in Phase 2.
 */
export function useLocalCollection<T extends { id: string }>(storageKey: string) {
  const [items, setItems] = React.useState<T[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? '[]') as T[]
    } catch {
      return []
    }
  })

  const persist = (next: T[]) => {
    setItems(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  const add = (item: Omit<T, 'id'> & { id?: string }) => {
    const record = { ...item, id: item.id ?? crypto.randomUUID() } as T
    persist([record, ...items])
    return record
  }

  const update = (id: string, patch: Partial<T>) => {
    persist(items.map((i) => (i.id === id ? ({ ...i, ...patch } as T) : i)))
  }

  const remove = (id: string) => {
    persist(items.filter((i) => i.id !== id))
  }

  /** Insert or replace by id — used for edits and for shadowing seed records. */
  const upsert = (record: T) => {
    persist([record, ...items.filter((i) => i.id !== record.id)])
  }

  return { items, add, update, remove, upsert }
}

/** Tracks ids of seed/demo records the user has deleted locally. */
export function useTombstones(storageKey: string) {
  const [ids, setIds] = React.useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? '[]') as string[]
    } catch {
      return []
    }
  })

  const tombstone = (id: string) => {
    const next = ids.includes(id) ? ids : [...ids, id]
    setIds(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  return { deletedIds: new Set(ids), tombstone }
}
