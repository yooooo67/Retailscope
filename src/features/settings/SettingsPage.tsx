import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Globe, Palette, RefreshCw, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useI18n } from '@/lib/i18n'
import { isSupabaseConfigured } from '@/lib/supabase'
import { updateSettings, useSettings } from '@/lib/settings'

const LOCAL_KEYS = [
  'retailscope.demo.session',
  'retailscope.settings',
  'retailscope.sidebar.collapsed',
  'retailscope.local.properties',
  'retailscope.local.properties.deleted',
  'retailscope.local.contacts',
  'retailscope.local.contacts.deleted',
  'retailscope.local.transactions',
  'retailscope.local.transactions.deleted',
  'retailscope.local.activities',
  'retailscope.local.activities.deleted',
  'retailscope.intelligence.dataset',
  'retailscope.ai.conversations',
  'retailscope.ai.key',
  'retailscope.ai.provider',
  'retailscope.ai.model',
]

export function SettingsPage() {
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const { t, lang, setLang } = useI18n()
  const settings = useSettings()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const exportData = () => {
    const dump: Record<string, unknown> = {}
    for (const key of LOCAL_KEYS) {
      const raw = localStorage.getItem(key)
      if (raw !== null) {
        try {
          dump[key] = JSON.parse(raw)
        } catch {
          dump[key] = raw
        }
      }
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `retailscope-data-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Local data exported')
  }

  const clearLocalData = () => {
    for (const key of LOCAL_KEYS) localStorage.removeItem(key)
    toast.success('Local data cleared — reload to reset the app')
  }

  return (
    <div>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <div className="grid max-w-3xl grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account details within this agency.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full-name">Full name</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!isSupabaseConfigured}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile?.email ?? user?.email ?? ''} disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <Select id="role" value={profile?.role ?? 'agent'} disabled>
                <option value="administrator">Administrator</option>
                <option value="manager">Manager</option>
                <option value="agent">Agent</option>
              </Select>
              <p className="text-[12px] text-slate-muted">
                Roles are managed by your administrator and enforced by the database.
              </p>
            </div>
            <Button
              size="sm"
              disabled={!isSupabaseConfigured}
              onClick={() => toast.info('Profile editing arrives with the workspace module.')}
            >
              {t('common.save')} changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-4 text-slate-muted" /> Preferences
            </CardTitle>
            <CardDescription>Display and behavior options for this workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="language">Language / Lingua</Label>
                <Select
                  id="language"
                  value={lang}
                  onChange={(e) => setLang(e.target.value as 'en' | 'it')}
                >
                  <option value="en">English</option>
                  <option value="it">Italiano</option>
                </Select>
                <p className="text-[12px] text-slate-muted">
                  Applies to navigation, headers and main controls.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currency">Currency / Valuta</Label>
                <Select
                  id="currency"
                  value={settings.currency}
                  onChange={(e) =>
                    updateSettings({ currency: e.target.value as 'USD' | 'EUR' })
                  }
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </Select>
                <p className="text-[12px] text-slate-muted">Used for all deal values and prices.</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-line pt-4">
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <span>
                  <span className="block text-[14px] font-medium text-ink">Compact sidebar</span>
                  <span className="block text-[12px] text-ink-secondary">
                    Start with the navigation collapsed to icons only.
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="size-4 accent-teal"
                  checked={settings.sidebarCollapsed}
                  onChange={(e) => updateSettings({ sidebarCollapsed: e.target.checked })}
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <span>
                  <span className="block text-[14px] font-medium text-ink">
                    Confirm before deleting
                  </span>
                  <span className="block text-[12px] text-ink-secondary">
                    Ask for confirmation before removing a record.
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="size-4 accent-teal"
                  checked={settings.confirmDeletes}
                  onChange={(e) => updateSettings({ confirmDeletes: e.target.checked })}
                />
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="size-4 text-slate-muted" /> Workspace
            </CardTitle>
            <CardDescription>Agency-level configuration.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium text-ink">Single-agency mode</p>
              <p className="text-[13px] text-ink-secondary">
                The schema supports multiple agencies; multi-workspace switching arrives later.
              </p>
            </div>
            <Badge variant="info">Phase 1</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="size-4 text-slate-muted" /> Local data
            </CardTitle>
            <CardDescription>
              Everything you create in demo mode is stored in this browser only.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download /> Export data (JSON)
            </Button>
            <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
              <Trash2 /> Clear local data
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Clear all local data?"
        description="This permanently deletes every record you added, your AI conversations, imported datasets and settings stored in this browser. Demo seed data is unaffected. This cannot be undone."
        confirmLabel="Clear everything"
        onConfirm={clearLocalData}
      />
    </div>
  )
}
