import { Building2, Download, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { EntityFormDialog, type FieldConfig } from '@/components/shared/EntityFormDialog'
import { LoadingState } from '@/components/shared/LoadingState'
import { PageHeader } from '@/components/shared/PageHeader'
import { RowActionsMenu } from '@/components/shared/RowActionsMenu'
import { type DemoProperty, type PropertyCategory, type PropertyStatus } from '@/lib/demoData'
import { downloadCSV } from '@/lib/exportCsv'
import { useI18n } from '@/lib/i18n'
import { useSettings } from '@/lib/settings'
import { useProperties } from '@/hooks/useWorkspaceData'
import { formatDate, money, StatusBadge } from '../shared/statusBadges'

const STATUSES: PropertyStatus[] = ['available', 'under_offer', 'let', 'sold']
const CATEGORIES: PropertyCategory[] = ['Retail', 'Office', 'Hospitality', 'Industrial', 'Mixed-use']

const propertySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(CATEGORIES as [string, ...string[]]),
  location: z.string().min(1, 'Location is required'),
  areaSqm: z.coerce.number().positive('Area must be greater than 0'),
  askingValue: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().positive('Value must be positive').nullable(),
  ),
  status: z.enum(STATUSES as [string, ...string[]]),
})

type PropertyFormValues = z.infer<typeof propertySchema>

const fields: FieldConfig[] = [
  { name: 'name', label: 'Property name', type: 'text', placeholder: 'e.g. Riverside Retail Unit 4' },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    options: CATEGORIES.map((c) => ({ value: c, label: c })),
  },
  { name: 'location', label: 'Location / submarket', type: 'text', placeholder: 'e.g. Harbor District' },
  { name: 'areaSqm', label: 'Area (m²)', type: 'number', placeholder: '145' },
  { name: 'askingValue', label: 'Asking value', type: 'number', placeholder: '1250000', hint: 'Optional — leave empty if not priced' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') })),
  },
]

const columns: Column<DemoProperty>[] = [
  {
    key: 'name',
    label: 'Property',
    render: (p) => (
      <Link to={`/properties/${p.id}`} className="font-medium text-ink hover:text-teal hover:underline">
        {p.name}
      </Link>
    ),
    searchText: (p) => `${p.name} ${p.location} ${p.category}`,
  },
  { key: 'category', label: 'Category', render: (p) => p.category, searchText: (p) => p.category },
  { key: 'location', label: 'Location', render: (p) => p.location, searchText: (p) => p.location },
  {
    key: 'area',
    label: 'Area',
    align: 'right',
    render: (p) => `${p.areaSqm.toLocaleString()} m²`,
    searchText: (p) => String(p.areaSqm),
  },
  {
    key: 'value',
    label: 'Asking value',
    align: 'right',
    render: (p) => money(p.askingValue),
    searchText: (p) => String(p.askingValue ?? ''),
  },
  { key: 'status', label: 'Status', render: (p) => <StatusBadge value={p.status} /> },
  { key: 'added', label: 'Added', render: (p) => formatDate(p.addedAt), searchText: (p) => p.addedAt },
]

const DEFAULTS = {
  name: '',
  category: 'Retail',
  location: '',
  areaSqm: '',
  askingValue: '',
  status: 'available',
}

function toFormValues(p: DemoProperty) {
  return {
    name: p.name,
    category: p.category,
    location: p.location,
    areaSqm: String(p.areaSqm),
    askingValue: p.askingValue === null ? '' : String(p.askingValue),
    status: p.status,
  }
}

export function PropertiesPage() {
  const { t } = useI18n()
  const settings = useSettings()
  const { rows, isLoading, add, update, remove, remote } = useProperties()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DemoProperty | null>(null)
  const [deleting, setDeleting] = useState<DemoProperty | null>(null)

  const openNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (p: DemoProperty) => {
    setEditing(p)
    setDialogOpen(true)
  }

  const onSubmit = async (v: PropertyFormValues) => {
    const data = {
      name: v.name,
      category: v.category as PropertyCategory,
      location: v.location,
      areaSqm: v.areaSqm,
      askingValue: v.askingValue,
      status: v.status as PropertyStatus,
      addedAt: editing?.addedAt ?? new Date().toISOString().slice(0, 10),
    }
    try {
      if (editing) {
        const { addedAt: _a, ...patch } = data
        await update(editing.id, patch)
        toast.success('Property updated')
      } else {
        await add(data)
        toast.success('Property added')
      }
    } catch {
      toast.error('Could not save — check your connection and try again.')
    }
  }

  const performDelete = async (row: DemoProperty) => {
    try {
      await remove(row.id)
      toast.success(`Deleted “${row.name}”`)
    } catch {
      toast.error('Could not delete — try again.')
    }
  }

  const onDelete = () => {
    if (deleting) void performDelete(deleting)
  }

  return (
    <div>
      <PageHeader
        title={t('properties.title')}
        subtitle={t('properties.subtitle')}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                downloadCSV(
                  'properties',
                  ['Name', 'Category', 'Location', 'Area (m2)', 'Asking value', 'Status', 'Added'],
                  rows.map((p) => [p.name, p.category, p.location, p.areaSqm, p.askingValue, p.status, p.addedAt]),
                )
                toast.success(`Exported ${rows.length} records → properties.csv (check Downloads)`)
              }}
            >
              <Download /> Export CSV
            </Button>
            <Button size="sm" onClick={openNew}>
              <Plus /> {t('properties.new')}
            </Button>
          </>
        }
      />
      {isLoading ? (
        <LoadingState rows={6} />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(p) => p.id}
          searchPlaceholder="Search properties…"
          facets={[
            { label: 'Status', getValue: (p) => p.status.replace('_', ' ') },
            { label: 'Category', getValue: (p) => p.category },
          ]}
          emptyTitle="No properties found"
          emptyDescription="Add your first property or adjust your filters."
          rowActions={(p) => (
            <RowActionsMenu
              label={`Actions for ${p.name}`}
              onEdit={() => openEdit(p)}
              onDelete={() => (settings.confirmDeletes ? setDeleting(p) : void performDelete(p))}
            />
          )}
        />
      )}
      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-slate-muted">
        <Building2 className="size-3.5" />{' '}
        {remote
          ? 'Records are stored in your agency database.'
          : 'Demo mode — records are stored locally in this browser.'}
      </p>

      <EntityFormDialog
        key={editing?.id ?? 'new'}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Edit property' : 'New property'}
        description={editing ? 'Update this property\u2019s details.' : 'Add a commercial property to your portfolio.'}
        schema={propertySchema}
        fields={fields}
        defaultValues={editing ? toFormValues(editing) : DEFAULTS}
        submitLabel={editing ? 'Save changes' : 'Add property'}
        onSubmit={(v) => void onSubmit(v as PropertyFormValues)}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete property"
        description={`Delete “${deleting?.name ?? ''}”? This cannot be undone.`}
        onConfirm={onDelete}
      />
    </div>
  )
}
