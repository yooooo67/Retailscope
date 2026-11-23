import { Download, Handshake, Plus } from 'lucide-react'
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
import {
  type DealStatus,
  type DealType,
  type DemoTransaction,
  type PropertyCategory,
} from '@/lib/demoData'
import { downloadCSV } from '@/lib/exportCsv'
import { useI18n } from '@/lib/i18n'
import { useSettings } from '@/lib/settings'
import { useTransactions } from '@/hooks/useWorkspaceData'
import { formatDate, money, StatusBadge } from '../shared/statusBadges'

const STATUSES: DealStatus[] = ['open', 'negotiation', 'closed_won', 'closed_lost']
const TYPES: DealType[] = ['sale', 'acquisition', 'lease']
const CATEGORIES: PropertyCategory[] = ['Retail', 'Office', 'Hospitality', 'Industrial', 'Mixed-use']

const transactionSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  type: z.enum(TYPES as [string, ...string[]]),
  category: z.enum(CATEGORIES as [string, ...string[]]),
  counterparty: z.string().min(1, 'Counterparty is required'),
  value: z.coerce.number().positive('Value must be greater than 0'),
  status: z.enum(STATUSES as [string, ...string[]]),
})

type TransactionFormValues = z.infer<typeof transactionSchema>

const fields: FieldConfig[] = [
  { name: 'name', label: 'Deal name', type: 'text', placeholder: 'e.g. Cedar Street Showroom — sale' },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    options: TYPES.map((t) => ({ value: t, label: t })),
  },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    options: CATEGORIES.map((c) => ({ value: c, label: c })),
  },
  { name: 'counterparty', label: 'Counterparty', type: 'text', placeholder: 'e.g. Vireo Retail Group' },
  { name: 'value', label: 'Deal value', type: 'number', placeholder: '940000' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
  },
]

const columns: Column<DemoTransaction>[] = [
  {
    key: 'name',
    label: 'Deal',
    render: (t) => <span className="font-medium">{t.name}</span>,
    searchText: (t) => `${t.name} ${t.counterparty} ${t.category}`,
  },
  { key: 'type', label: 'Type', render: (t) => <StatusBadge value={t.type} /> },
  { key: 'category', label: 'Category', render: (t) => t.category },
  { key: 'counterparty', label: 'Counterparty', render: (t) => t.counterparty, searchText: (t) => t.counterparty },
  {
    key: 'value',
    label: 'Value',
    align: 'right',
    render: (t) => money(t.value),
    searchText: (t) => String(t.value),
  },
  { key: 'status', label: 'Status', render: (t) => <StatusBadge value={t.status} /> },
  { key: 'created', label: 'Opened', render: (t) => formatDate(t.createdAt) },
  { key: 'closed', label: 'Closed', render: (t) => formatDate(t.closedAt) },
]

const DEFAULTS = {
  name: '',
  type: 'sale',
  category: 'Retail',
  counterparty: '',
  value: '',
  status: 'open',
}

function toFormValues(t: DemoTransaction) {
  return {
    name: t.name,
    type: t.type,
    category: t.category,
    counterparty: t.counterparty,
    value: String(t.value),
    status: t.status,
  }
}

const CLOSED_STATUSES: DealStatus[] = ['closed_won', 'closed_lost']

export function TransactionsPage() {
  const { t } = useI18n()
  const settings = useSettings()
  const { rows, isLoading, add, update, remove, remote } = useTransactions()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DemoTransaction | null>(null)
  const [deleting, setDeleting] = useState<DemoTransaction | null>(null)

  const pipelineValue = rows
    .filter((t) => ['open', 'negotiation'].includes(t.status))
    .reduce((s, t) => s + t.value, 0)

  const openNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (t: DemoTransaction) => {
    setEditing(t)
    setDialogOpen(true)
  }

  const onSubmit = async (v: TransactionFormValues) => {
    const today = new Date().toISOString().slice(0, 10)
    const status = v.status as DealStatus
    const wasClosed = editing ? CLOSED_STATUSES.includes(editing.status) : false
    const data = {
      name: v.name,
      type: v.type as DealType,
      category: v.category as PropertyCategory,
      counterparty: v.counterparty,
      value: v.value,
      status,
      createdAt: editing?.createdAt ?? today,
      closedAt: CLOSED_STATUSES.includes(status) ? (wasClosed ? (editing?.closedAt ?? today) : today) : null,
    }
    try {
      if (editing) {
        const { createdAt: _c, ...patch } = data
        await update(editing.id, patch)
        toast.success('Deal updated')
      } else {
        await add(data)
        toast.success('Deal added')
      }
    } catch {
      toast.error('Could not save — check your connection and try again.')
    }
  }

  const performDelete = async (row: DemoTransaction) => {
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
        title={t('transactions.title')}
        subtitle={t('transactions.subtitle')}
        actions={
          <>
            <span className="rounded-md bg-navy-50 px-3 py-1.5 text-[13px] font-medium text-navy-700">
              Open pipeline: {money(pipelineValue)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                downloadCSV(
                  'transactions',
                  ['Deal', 'Type', 'Category', 'Counterparty', 'Value', 'Status', 'Opened', 'Closed'],
                  rows.map((t) => [t.name, t.type, t.category, t.counterparty, t.value, t.status, t.createdAt, t.closedAt]),
                )
                toast.success(`Exported ${rows.length} records → transactions.csv (check Downloads)`)
              }}
            >
              <Download /> Export CSV
            </Button>
            <Button size="sm" onClick={openNew}>
              <Plus /> {t('transactions.new')}
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
          rowKey={(t) => t.id}
          searchPlaceholder="Search deals…"
          facets={[
            { label: 'Status', getValue: (t) => t.status.replace(/_/g, ' ') },
            { label: 'Type', getValue: (t) => t.type },
            { label: 'Category', getValue: (t) => t.category },
          ]}
          emptyTitle="No transactions found"
          emptyDescription="Add your first deal or adjust your filters."
          rowActions={(t) => (
            <RowActionsMenu
              label={`Actions for ${t.name}`}
              onEdit={() => openEdit(t)}
              onDelete={() => (settings.confirmDeletes ? setDeleting(t) : void performDelete(t))}
            />
          )}
        />
      )}
      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-slate-muted">
        <Handshake className="size-3.5" />{' '}
        {remote
          ? 'Records are stored in your agency database.'
          : 'Demo mode — records are stored locally in this browser.'}
      </p>

      <EntityFormDialog
        key={editing?.id ?? 'new'}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Edit deal' : 'New deal'}
        description={editing ? 'Update this deal\u2019s details.' : 'Track a sale, acquisition or lease through the pipeline.'}
        schema={transactionSchema}
        fields={fields}
        defaultValues={editing ? toFormValues(editing) : DEFAULTS}
        submitLabel={editing ? 'Save changes' : 'Add deal'}
        onSubmit={(v) => void onSubmit(v as TransactionFormValues)}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete deal"
        description={`Delete “${deleting?.name ?? ''}”? This cannot be undone.`}
        onConfirm={onDelete}
      />
    </div>
  )
}
