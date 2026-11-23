import {
  Activity,
  BarChart3,
  Building2,
  Handshake,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useI18n, type I18nKey } from '@/lib/i18n'
import { Button } from '@/components/ui/button'

interface NavItem {
  i18nKey: I18nKey
  to: string
  icon: LucideIcon
}

interface NavGroup {
  i18nKey: I18nKey
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    i18nKey: 'nav.overview',
    items: [{ i18nKey: 'nav.dashboard', to: '/dashboard', icon: LayoutDashboard }],
  },
  {
    i18nKey: 'nav.workspace',
    items: [
      { i18nKey: 'nav.properties', to: '/properties', icon: Building2 },
      { i18nKey: 'nav.contacts', to: '/contacts', icon: Users },
      { i18nKey: 'nav.transactions', to: '/transactions', icon: Handshake },
      { i18nKey: 'nav.activities', to: '/activities', icon: Activity },
    ],
  },
  {
    i18nKey: 'nav.intelligence',
    items: [
      { i18nKey: 'nav.marketIntelligence', to: '/intelligence', icon: BarChart3 },
      { i18nKey: 'nav.aiAssistant', to: '/ai-assistant', icon: Sparkles },
    ],
  },
  {
    i18nKey: 'nav.configuration',
    items: [{ i18nKey: 'nav.settings', to: '/settings', icon: Settings }],
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation()
  const { t } = useI18n()

  const content = (
    <div className="flex h-full flex-col bg-navy-900 text-white">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-teal">
          <BarChart3 className="size-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold tracking-tight">RETAILSCOPE</p>
            <p className="text-[11px] text-navy-300">CRE Intelligence</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary">
        {NAV.map((group) => (
          <div key={group.i18nKey} className="mb-5">
            {!collapsed && (
              <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-navy-300">
                {t(group.i18nKey)}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = location.pathname.startsWith(item.to)
                const label = t(item.i18nKey)
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onMobileClose}
                      title={collapsed ? label : undefined}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors',
                        collapsed && 'justify-center px-0',
                        active
                          ? 'bg-white/10 text-white'
                          : 'text-navy-200 hover:bg-white/5 hover:text-white',
                      )}
                    >
                      <item.icon className={cn('size-[18px] shrink-0', active ? 'text-teal' : 'text-navy-300')} />
                      {!collapsed && <span className="truncate">{label}</span>}
                      {active && !collapsed && (
                        <span className="ml-auto size-1.5 rounded-full bg-teal" aria-hidden="true" />
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle (desktop) */}
      <div className="hidden border-t border-white/10 p-3 md:block">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn('w-full text-navy-200 hover:bg-white/5 hover:text-white', collapsed && 'px-0')}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={cn('size-4 transition-transform', collapsed && 'rotate-180')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          {!collapsed && <span>{t('nav.collapse')}</span>}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col transition-[width] duration-200 md:flex',
          collapsed ? 'w-[72px]' : 'w-[248px]',
        )}
      >
        {content}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-navy-950/50" onClick={onMobileClose} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-[260px]">{content}</aside>
        </div>
      )}
    </>
  )
}

export { Sidebar }
