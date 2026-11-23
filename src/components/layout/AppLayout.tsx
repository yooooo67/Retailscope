import * as React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useAgency, useProfile } from '@/hooks/useProfile'
import { useAuth } from '@/hooks/useAuth'
import { isSupabaseConfigured } from '@/lib/supabase'
import { updateSettings, useSettings } from '@/lib/settings'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function AppLayout() {
  const { user, signOut } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const { data: agency } = useAgency(profile?.agency_id)

  const settings = useSettings()
  const [collapsed, setCollapsed] = React.useState(settings.sidebarCollapsed)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const location = useLocation()

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      updateSettings({ sidebarCollapsed: !v })
      return !v
    })
  }

  // Close mobile nav on route change
  React.useEffect(() => setMobileOpen(false), [location.pathname])

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
  }

  return (
    <div className="min-h-full">
      <Sidebar
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div
        className={cn(
          'flex min-h-screen flex-col transition-[margin] duration-200',
          'md:ml-[248px]',
          collapsed && 'md:ml-[72px]',
        )}
      >
        <Topbar
          profile={profile}
          agency={agency}
          onMenuClick={() => setMobileOpen(true)}
          onSignOut={handleSignOut}
        />
        <main className="flex-1 px-4 py-8 md:px-8">
          <div className="mx-auto w-full max-w-[1200px]">
            {!isSupabaseConfigured && (
              <div className="mb-4 rounded-md border border-warning/30 bg-warning-bg px-4 py-2.5 text-[12px] font-medium text-warning">
                Demo mode — Supabase is not configured. All displayed data is fictional and stored
                only in this browser.
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export { AppLayout }
