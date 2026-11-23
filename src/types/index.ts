export type UserRole = 'administrator' | 'manager' | 'agent'

export interface Agency {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  agency_id: string
  full_name: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated'
