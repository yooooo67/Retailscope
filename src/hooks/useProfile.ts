import { useQuery } from '@tanstack/react-query'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { DEMO_AGENCY, DEMO_PROFILE } from '@/lib/demo'
import type { Agency, Profile } from '@/types'

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Profile | null> => {
      if (!isSupabaseConfigured || !supabase) return DEMO_PROFILE
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .maybeSingle()
      if (error) throw error
      return data as Profile | null
    },
  })
}

export function useAgency(agencyId: string | undefined) {
  return useQuery({
    queryKey: ['agency', agencyId],
    enabled: Boolean(agencyId),
    queryFn: async (): Promise<Agency | null> => {
      if (!isSupabaseConfigured || !supabase) return DEMO_AGENCY
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', agencyId!)
        .maybeSingle()
      if (error) throw error
      return data as Agency | null
    },
  })
}
