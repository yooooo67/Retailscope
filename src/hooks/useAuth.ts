import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { demoSignOut, getDemoSession, DEMO_PROFILE } from '@/lib/demo'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthUser {
  id: string
  email?: string
}

/**
 * Auth state. Uses Supabase Auth when configured; falls back to the
 * localStorage-backed demo session when Supabase env vars are absent.
 */
export function useAuth() {
  const [status, setStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? 'loading' : getDemoSession() ? 'authenticated' : 'unauthenticated',
  )
  const [user, setUser] = useState<AuthUser | null>(() =>
    isSupabaseConfigured
      ? null
      : getDemoSession()
        ? { id: DEMO_PROFILE.id, email: getDemoSession()!.email }
        : null,
  )

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setStatus(data.session ? 'authenticated' : 'unauthenticated')
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setUser(newSession?.user ?? null)
      setStatus(newSession ? 'authenticated' : 'unauthenticated')
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    } else {
      demoSignOut()
      setUser(null)
      setStatus('unauthenticated')
    }
  }

  return { status, user, signOut }
}
