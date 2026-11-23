import { Search } from 'lucide-react'
import * as React from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  label: string
  render: (row: T) => React.ReactNode
  /** text used for global search */
  searchText?: (row: T) => string
  className?: string
  align?: 'left' | 'right'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  searchPlaceholder?: string
  /** optional facets: label + get value */
  facets?: {
    label: string
    getValue: (row: T) => string
    allLabel?: string
  }[]
  emptyTitle?: string
  emptyDescription?: string
  /** render per-row actions (edit/delete menus) as a trailing column */
  rowActions?: (row: T) => React.ReactNode
}

function DataTable<T>({
  columns,
  rows,
  rowKey,
  searchPlaceholder = 'Search…',
  facets,
  emptyTitle = 'No records',
  emptyDescription = 'Nothing matches the current filters.',
  rowActions,
}: DataTableProps<T>) {
  const [query, setQuery] = React.useState('')
  const [facetValues, setFacetValues] = React.useState<Record<string, string>>({})

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (q) {
        const hay = columns.map((c) => c.searchText?.(row) ?? '').join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      for (const f of facets ?? []) {
        const selected = facetValues[f.label]
        if (selected && f.getValue(row) !== selected) return false
      }
      return true
    })
  }, [rows, query, facetValues, columns, facets])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8"
            aria-label="Search table"
          />
        </div>
        {(facets ?? []).map((f) => {
          const options = [...new Set(rows.map(f.getValue))].sort()
          return (
            <Select
              key={f.label}
              value={facetValues[f.label] ?? ''}
              onChange={(e) =>
                setFacetValues((prev) => ({ ...prev, [f.label]: e.target.value }))
              }
              className="w-40"
              aria-label={`Filter by ${f.label}`}
            >
              <option value="">{f.allLabel ?? `All ${f.label.toLowerCase()}s`}</option>
              {options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          )
        })}
        <span className="ml-auto text-[12px] text-slate-muted">
          {filtered.length} of {rows.length}
        </span>
      </div>

      <div className="rounded-lg border border-line bg-surface">
        {filtered.length === 0 ? (
          <EmptyState compact title={emptyTitle} description={emptyDescription} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key} className={cn(c.align === 'right' && 'text-right')}>
                    {c.label}
                  </TableHead>
                ))}
                {rowActions && <TableHead className="w-12 text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={rowKey(row)}>
                  {columns.map((c) => (
                    <TableCell key={c.key} className={cn(c.className, c.align === 'right' && 'text-right')}>
                      {c.render(row)}
                    </TableCell>
                  ))}
                  {rowActions && (
                    <TableCell className="text-right">{rowActions(row)}</TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

export { DataTable }
