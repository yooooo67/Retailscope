import { Activity as ActivityIcon, Download, Plus } from 'lucide-react'
import { format } from 'date-fns'
import * as React from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { EntityFormDialog, type FieldConfig } from '@/components/shared/EntityFormDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { RowActionsMenu } from '@/components/shared/RowActionsMenu'
import { Select } from '@/components/ui/select'
import { DEMO_ACTIVITIES, type ActivityStatus, type ActivityType, type DemoActivity } from '@/lib/demoData'
import { useLocalCollection, useTombstones } from '@/lib/localStore'
import { useI18n } from '@/lib/i18n'
import { useSettings } from '@/lib/settings'
import { downloadCSV } from '@/lib/exportCsv'
import { toast } from 'sonner'
import { formatDateTime, StatusBadge } from '../shared/statusBadges'

const TYPES: ActivityType[] = ['call', 'meeting', 'viewing', 'task', 'email']
const STATUSES: ActivityStatus[] = ['upcoming', 'completed', 'overdue']

const activitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(TYPES as [string, ...string[]]),
  relatedTo: z.string().min(1, 'Related record is required'),
  scheduledAt: z.string().min(1, 'Date & time is required'),
  status: z.enum(STATUSES as [string, ...string[]]),
})

type ActivityFormValues = z.infer<typeof activitySchema>

const fields: FieldConfig[] = [
  { name: 'title', label: 'Title', type: 'text', placeholder: 'e.g. Site viewing — Northgate Warehouse' },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    options: TYPES.map((t) => ({ value: t, label: t })),
  },
  { name: 'relatedTo', label: 'Related to', type: 'text', placeholder: 'Property, contact or deal name' },
  { name: 'scheduledAt', label: 'Date & time', type: 'datetime-local' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: STATUSES.map((s) => ({ value: s, label: s })),
  },
]

const TYPE_ORDER: Record<string, number> = { overdue: 0, upcoming: 1, completed: 2 }

function toLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toFormValues(a: DemoActivity) {
  return {
    title: a.title,
    type: a.type,
    relatedTo: a.relatedTo,
    scheduledAt: toLocalInput(a.scheduledAt),
    status: a.status,
  }
}

export function ActivitiesPage() {
  const { t } = useI18n()
  const settings = useSettings()
  const [filter, setFilter] = React.useState('all')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<DemoActivity | null>(null)
  const [deleting, setDeleting] = React.useState<DemoActivity | null>(null)

  const { items: custom, upsert, remove } = useLocalCollection<DemoActivity>('retailscope.local.activities')
  const { deletedIds, tombstone } = useTombstones('retailscope.local.activities.deleted')

  const customIds = new Set(custom.map((a) => a.id))
  const all = [
    ...custom,
    ...DEMO_ACTIVITIES.filter((a) => !customIds.has(a.id) && !deletedIds.has(a.id)),
  ]

  const rows = React.useMemo(() => {
    const sorted = [...all].sort(
      (a, b) =>
        TYPE_ORDER[a.status] - TYPE_ORDER[b.status] ||
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    )
    return filter === 'all' ? sorted : sorted.filter((a) => a.status === filter)
  }, [all, filter])

  const grouped = React.useMemo(() => {
    const map = new Map<string, DemoActivity[]>()
    for (const a of rows) {
      const day = format(new Date(a.scheduledAt), 'EEEE, MMMM d')
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(a)
    }
    return [...map.entries()]
  }, [rows])

  const openNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (a: DemoActivity) => {
    setEditing(a)
    setDialogOpen(true)
  }

  const onSubmit = (v: ActivityFormValues) => {
    upsert({
      id: editing?.id ?? crypto.randomUUID(),
      title: v.title,
      type: v.type as ActivityType,
      relatedTo: v.relatedTo,
      scheduledAt: new Date(v.scheduledAt).toISOString(),
      status: v.status as ActivityStatus,
    })
  }

  const performDelete = (row: DemoActivity) => {
    remove(row.id)
    tombstone(row.id)
  }
  const onDeleteNow = performDelete

  const onDelete = () => {
    if (!deleting) return
    remove(deleting.id)
    tombstone(deleting.id)
  }

  const now = new Date().toISOString().slice(0, 16)

  return (
    <div>
      <PageHeader
        title={t('activities.title')}
        subtitle={t('activities.subtitle')}
        actions={
          <>
            <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-40" aria-label="Filter activities">
              <option value="all">All activities</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                downloadCSV(
                  'activities',
                  ['Title', 'Type', 'Related to', 'Scheduled at', 'Status'],
                  rows.map((a) => [a.title, a.type, a.relatedTo, a.scheduledAt, a.status]),
                )
                toast.success(`Exported ${rows.length} records → activities.csv (check Downloads)`)
              }}
            >
              <Download /> Export CSV
            </Button>
            <Button size="sm" onClick={openNew}>
              <Plus /> {t('activities.new')}
            </Button>
          </>
        }
      />

      {grouped.length === 0 ? (
        <Card>
          <EmptyState icon={ActivityIcon} title="No activities" description="Nothing matches this filter." />
        </Card>
      ) : (
        <div className="space-y-5">
          {grouped.map(([day, items]) => (
            <div key={day}>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-secondary">
                {day}
              </p>
              <div className="space-y-2">
                {items.map((a) => (
                  <Card key={a.id}>
                    <CardContent className="flex flex-wrap items-center gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium text-ink">{a.title}</p>
                        <p className="mt-0.5 text-[12px] text-ink-secondary">
                          {a.relatedTo} · {formatDateTime(a.scheduledAt)}
                        </p>
                      </div>
                      <StatusBadge value={a.type} />
                      <StatusBadge value={a.status} />
                      <RowActionsMenu
                        label={`Actions for ${a.title}`}
                        onEdit={() => openEdit(a)}
                        onDelete={() => (settings.confirmDeletes ? setDeleting(a) : onDeleteNow(a))}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 flex items-center gap-1.5 text-[12px] text-slate-muted">
        <ActivityIcon className="size-3.5" /> Records you add or edit are stored locally in this browser
        until the database backend is connected.
      </p>

      <EntityFormDialog
        key={editing?.id ?? 'new'}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Edit activity' : 'New activity'}
        description={editing ? 'Update this activity\u2019s details.' : 'Schedule a call, meeting, viewing or task.'}
        schema={activitySchema}
        fields={fields}
        defaultValues={editing ? toFormValues(editing) : { title: '', type: 'call', relatedTo: '', scheduledAt: now, status: 'upcoming' }}
        submitLabel={editing ? 'Save changes' : 'Add activity'}
        onSubmit={(v) => onSubmit(v as ActivityFormValues)}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete activity"
        description={`Delete “${deleting?.title ?? ''}”? This cannot be undone.`}
        onConfirm={onDelete}
      />
    </div>
  )
}
