import { Activity, Bell, Building2, Handshake, LogOut, Menu, Search, User, Users } from 'lucide-react'
import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import type { Agency, Profile } from '@/types'
import { useI18n } from '@/lib/i18n'
import { SEARCH_TYPE_LABELS, searchWorkspace, type SearchResultType } from '@/lib/search'

interface TopbarProps {
  profile: Profile | null | undefined
  agency: Agency | null | undefined
  onMenuClick: () => void
  onSignOut: () => void
}

function Topbar({ profile, agency, onMenuClick, onSignOut }: TopbarProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')

  const results = React.useMemo(() => searchWorkspace(query), [query])
  const grouped = React.useMemo(() => {
    const map = new Map<SearchResultType, typeof results>()
    for (const r of results) {
      if (!map.has(r.type)) map.set(r.type, [])
      map.get(r.type)!.push(r)
    }
    return [...map.entries()]
  }, [results])

  const TYPE_ICONS: Record<SearchResultType, typeof Building2> = {
    property: Building2,
    contact: Users,
    transaction: Handshake,
    activity: Activity,
  }

  const go = (to: string) => {
    setSearchOpen(false)
    setQuery('')
    navigate(to)
  }

  const initials = (profile?.full_name || profile?.email || '?')
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      {/* Workspace identity */}
      <div className="hidden items-center gap-2 sm:flex">
        <div className="flex size-7 items-center justify-center rounded-md bg-navy-900 text-[11px] font-semibold text-white">
          {agency?.name?.slice(0, 2).toUpperCase() ?? 'RS'}
        </div>
        <span className="text-[13px] font-medium text-ink">{agency?.name ?? 'Workspace'}</span>
      </div>

      <div className="flex-1" />

      {/* Global search */}
      <button
        onClick={() => setSearchOpen(true)}
        className="flex h-9 w-full max-w-xs items-center gap-2 rounded-md border border-line bg-bg px-3 text-[13px] text-slate-muted transition-colors hover:border-navy-200 hover:text-ink-secondary"
        aria-label={t('common.search')}
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">{t('common.search')}</span>
        <kbd className="hidden rounded border border-line bg-surface px-1.5 text-[11px] text-slate-muted lg:inline">
          ⌘K
        </kbd>
      </button>

      {/* Notifications */}
      <DropdownMenu
        align="right"
        trigger={
          <Button variant="ghost" size="icon" aria-label={t('common.notifications')}>
            <Bell className="size-[18px]" />
          </Button>
        }
      >
        <DropdownMenuLabel>{t('common.notifications')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-3 py-6 text-center text-[13px] text-ink-secondary">
          {t('common.noNotifications')}
        </div>
      </DropdownMenu>

      {/* Profile */}
      <DropdownMenu
        align="right"
        trigger={
          <button
            className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-navy-50"
            aria-label="Account menu"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-navy-900 text-[12px] font-semibold text-white">
              {initials}
            </span>
            <span className="hidden text-left md:block">
              <span className="block text-[13px] font-medium leading-tight text-ink">
                {profile?.full_name || 'Account'}
              </span>
              <span className="block text-[11px] capitalize leading-tight text-ink-secondary">
                {profile?.role ?? ''}
              </span>
            </span>
          </button>
        }
      >
        <DropdownMenuLabel>
          <span className="block text-[13px] normal-case text-ink">{profile?.full_name}</span>
          <span className="block text-[12px] font-normal normal-case text-slate-muted">
            {profile?.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="size-4" /> {t('common.profile')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onSignOut}>
          <LogOut className="size-4" /> {t('common.signOut')}
        </DropdownMenuItem>
      </DropdownMenu>

      {/* Search dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="overflow-hidden p-0" onClose={() => setSearchOpen(false)}>
          <DialogHeader className="border-b-0 pb-0">
            <DialogTitle className="sr-only">Search</DialogTitle>
            <DialogDescription className="sr-only">
              Search across properties, contacts and transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 pb-2">
            <Input
              autoFocus
              placeholder="Search properties, contacts, transactions…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="max-h-[50vh] overflow-y-auto border-t border-line">
            {query.trim().length < 2 ? (
              <p className="px-4 py-6 text-center text-[13px] text-ink-secondary">
                Type at least 2 characters to search properties, contacts, deals and activities.
              </p>
            ) : results.length === 0 ? (
              <p className="px-4 py-6 text-center text-[13px] text-ink-secondary">
                No results for “{query}”.
              </p>
            ) : (
              grouped.map(([type, items]) => {
                const Icon = TYPE_ICONS[type]
                return (
                  <div key={type}>
                    <p className="bg-bg px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-secondary">
                      {SEARCH_TYPE_LABELS[type]}
                    </p>
                    <ul>
                      {items.map((r) => (
                        <li key={`${r.type}-${r.id}`}>
                          <button
                            onClick={() => go(r.to)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-navy-50"
                          >
                            <Icon className="size-4 shrink-0 text-slate-muted" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-medium text-ink">
                                {r.title}
                              </span>
                              <span className="block truncate text-[12px] text-slate-muted">
                                {r.subtitle}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ⌘K shortcut */}
      <KeyboardShortcut onTrigger={() => setSearchOpen(true)} />
    </header>
  )
}

function KeyboardShortcut({ onTrigger }: { onTrigger: () => void }) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onTrigger()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onTrigger])
  return null
}

export { Topbar }
