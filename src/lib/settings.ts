import * as React from 'react'

export interface AppSettings {
  language: 'en' | 'it'
  currency: 'USD' | 'EUR'
  sidebarCollapsed: boolean
  confirmDeletes: boolean
}

const KEY = 'retailscope.settings'

const DEFAULTS: AppSettings = {
  language: 'en',
  currency: 'USD',
  sidebarCollapsed: false,
  confirmDeletes: true,
}

function load(): AppSettings {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<AppSettings>) }
  } catch {
    return DEFAULTS
  }
}

const listeners = new Set<() => void>()

export function getSettings(): AppSettings {
  return load()
}

export function updateSettings(patch: Partial<AppSettings>) {
  const next = { ...load(), ...patch }
  localStorage.setItem(KEY, JSON.stringify(next))
  listeners.forEach((l) => l())
  if (patch.language) document.documentElement.lang = patch.language
}

/** Reactive settings hook — re-renders on updateSettings(). */
export function useSettings(): AppSettings {
  const [settings, setSettings] = React.useState<AppSettings>(load)

  React.useEffect(() => {
    const cb = () => setSettings(load())
    listeners.add(cb)
    return () => {
      listeners.delete(cb)
    }
  }, [])

  return settings
}

/** Non-hook currency read for plain helpers like money(). */
export function currentCurrency(): 'USD' | 'EUR' {
  return load().currency
}
