import { Download, Plus, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { EntityFormDialog, type FieldConfig } from '@/components/shared/EntityFormDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { RowActionsMenu } from '@/components/shared/RowActionsMenu'
import { DEMO_CONTACTS, DEMO_PROPERTIES, type ContactType, type DemoContact, type DemoProperty } from '@/lib/demoData'
import { useI18n } from '@/lib/i18n'
import { useLocalCollection, useTombstones } from '@/lib/localStore'
import { useSettings } from '@/lib/settings'
import { downloadCSV } from '@/lib/exportCsv'
import { toast } from 'sonner'
import { StatusBadge } from '../shared/statusBadges'

const TYPES: ContactType[] = ['owner', 'tenant', 'buyer', 'broker', 'service_provider']

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  company: z.string().min(1, 'Company is required'),
  type: z.enum(TYPES as [string, ...string[]]),
  email: z.string().email('Enter a valid email').or(z.literal('')),
  phone: z.string(),
  propertyIds: z.array(z.string()).default([]),
  notes: z.string().default(''),
})

type ContactFormValues = z.infer<typeof contactSchema>

const columns: Column<DemoContact>[] = [
  {
    key: 'name',
    label: 'Name',
    render: (c) => <span className="font-medium">{c.name}</span>,
    searchText: (c) => `${c.name} ${c.company} ${c.email} ${c.notes}`,
  },
  { key: 'company', label: 'Company', render: (c) => c.company, searchText: (c) => c.company },
  { key: 'type', label: 'Type', render: (c) => <StatusBadge value={c.type} /> },
  { key: 'email', label: 'Email', render: (c) => c.email || '—', searchText: (c) => c.email },
  { key: 'phone', label: 'Phone', render: (c) => c.phone || '—', searchText: (c) => c.phone },
]

const DEFAULTS = { name: '', company: '', type: 'owner', email: '', phone: '', propertyIds: [] as string[], notes: '' }

function toFormValues(c: DemoContact) {
  return {
    name: c.name,
    company: c.company,
    type: c.type,
    email: c.email,
    phone: c.phone,
    propertyIds: c.propertyIds ?? [],
    notes: c.notes ?? '',
  }
}

export function ContactsPage() {
  const { t } = useI18n()
  const settings = useSettings()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DemoContact | null>(null)
  const [deleting, setDeleting] = useState<DemoContact | null>(null)

  const { items: custom, upsert, remove } = useLocalCollection<DemoContact>('retailscope.local.contacts')
  const { deletedIds, tombstone } = useTombstones('retailscope.local.contacts.deleted')
  const { items: customProps } = useLocalCollection<DemoProperty>('retailscope.local.properties')

  const customIds = new Set(custom.map((c) => c.id))
  const propIds = new Set(customProps.map((p) => p.id))
  const rows = [
    ...custom,
    ...DEMO_CONTACTS.filter((c) => !customIds.has(c.id) && !deletedIds.has(c.id)),
  ]

  const allProperties = [
    ...customProps,
    ...DEMO_PROPERTIES.filter((p) => !propIds.has(p.id)),
  ]
  const propertyName = (id: string) => allProperties.find((p) => p.id === id)?.name ?? id

  const fields: FieldConfig[] = [
    { name: 'name', label: 'Full name', type: 'text', placeholder: 'e.g. Amara Osei' },
    { name: 'company', label: 'Company', type: 'text', placeholder: 'e.g. Vireo Retail Group' },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      options: TYPES.map((t) => ({ value: t, label: t.replace('_', ' ') })),
    },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'name@company.com' },
    { name: 'phone', label: 'Phone', type: 'text', placeholder: '+1 555 0000' },
    {
      name: 'propertyIds',
      label: 'Linked properties',
      type: 'multiselect',
      options: allProperties.map((p) => ({ value: p.id, label: p.name })),
      hint: 'Properties this person owns, rents or is interested in.',
    },
    {
      name: 'notes',
      label: 'Interests / notes',
      type: 'textarea',
      placeholder: 'What are they buying, selling or looking for?',
    },
  ]

  const openNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (c: DemoContact) => {
    setEditing(c)
    setDialogOpen(true)
  }

  const onSubmit = (v: ContactFormValues) => {
    upsert({
      id: editing?.id ?? crypto.randomUUID(),
      name: v.name,
      company: v.company,
      type: v.type as ContactType,
      email: v.email,
      phone: v.phone,
      propertyIds: v.propertyIds,
      notes: v.notes,
    })
  }

  const performDelete = (row: DemoContact) => {
    remove(row.id)
    tombstone(row.id)
  }
  const onDeleteNow = performDelete

  const onDelete = () => {
    if (!deleting) return
    remove(deleting.id)
    tombstone(deleting.id)
  }

  // Render linked properties as a dedicated column appended to the table
  const columnsWithLinks: Column<DemoContact>[] = [
    ...columns,
    {
      key: 'linked',
      label: 'Linked properties',
      render: (c) =>
        c.propertyIds?.length ? (
          <span className="flex max-w-[220px] flex-wrap gap-1">
            {c.propertyIds.slice(0, 3).map((id) => (
              <Link
                key={id}
                to={`/properties/${id}`}
                className="rounded-full transition-opacity hover:opacity-70"
                title={`Open ${propertyName(id)}`}
              >
                <Badge variant="outline" className="cursor-pointer font-normal">
                  {propertyName(id)}
                </Badge>
              </Link>
            ))}
            {c.propertyIds.length > 3 && (
              <Badge variant="outline" className="font-normal">
                +{c.propertyIds.length - 3}
              </Badge>
            )}
          </span>
        ) : (
          <span className="text-slate-muted">—</span>
        ),
      searchText: (c) => (c.propertyIds ?? []).map(propertyName).join(' '),
    },
  ]

  return (
    <div>
      <PageHeader
        title={t('contacts.title')}
        subtitle={t('contacts.subtitle')}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                downloadCSV(
                  'contacts',
                  ['Name', 'Company', 'Type', 'Email', 'Phone', 'Linked properties', 'Notes'],
                  rows.map((c) => [
                    c.name, c.company, c.type, c.email, c.phone,
                    (c.propertyIds ?? []).map(propertyName).join('; '), c.notes,
                  ]),
                )
                toast.success(`Exported ${rows.length} records → contacts.csv (check Downloads)`)
              }}
            >
              <Download /> Export CSV
            </Button>
            <Button size="sm" onClick={openNew}>
              <Plus /> {t('contacts.new')}
            </Button>
          </>
        }
      />
      <DataTable
        columns={columnsWithLinks}
        rows={rows}
        rowKey={(c) => c.id}
        searchPlaceholder="Search contacts…"
        facets={[{ label: 'Type', getValue: (c) => c.type.replace('_', ' ') }]}
        emptyTitle="No contacts found"
        emptyDescription="Add your first contact or adjust your filters."
        rowActions={(c) => (
          <RowActionsMenu
            label={`Actions for ${c.name}`}
            onEdit={() => openEdit(c)}
            onDelete={() => (settings.confirmDeletes ? setDeleting(c) : onDeleteNow(c))}
          />
        )}
      />
      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-slate-muted">
        <Users className="size-3.5" /> Records you add or edit are stored locally in this browser
        until the database backend is connected.
      </p>

      <EntityFormDialog
        key={editing?.id ?? 'new'}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Edit contact' : 'New contact'}
        description={editing ? 'Update this contact\u2019s details.' : 'Add a person or company to your network.'}
        schema={contactSchema}
        fields={fields}
        defaultValues={editing ? toFormValues(editing) : DEFAULTS}
        submitLabel={editing ? 'Save changes' : 'Add contact'}
        onSubmit={(v) => onSubmit(v as ContactFormValues)}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete contact"
        description={`Delete “${deleting?.name ?? ''}”? This cannot be undone.`}
        onConfirm={onDelete}
      />
    </div>
  )
}
