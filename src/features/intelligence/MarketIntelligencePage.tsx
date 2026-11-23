import Papa from 'papaparse'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download, FileUp, Trash2 } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { formatCurrency } from '@/lib/utils'
import { DEMO_TRANSACTIONS } from '@/lib/demoData'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'
import {
  detectMapping,
  downloadTemplate,
  mapRows,
  type ParsedRecord,
} from './analytics'

interface Dataset {
  filename: string
  records: ParsedRecord[]
  importedAt: number
}

const DATASET_KEY = 'retailscope.intelligence.dataset'

function loadDataset(): Dataset | null {
  try {
    return JSON.parse(localStorage.getItem(DATASET_KEY) ?? 'null') as Dataset | null
  } catch {
    return null
  }
}

/** Fictional dataset so charts are explorable in demo mode. */
function demoDataset(): Dataset {
  return {
    filename: 'demo-transactions.csv (fictional)',
    importedAt: Date.now(),
    records: DEMO_TRANSACTIONS.map((t) => ({
      name: t.name,
      category: t.category,
      location: 'Demo Market',
      areaSqm: null,
      value: t.value,
      date: t.closedAt ?? t.createdAt,
      status: t.status.replace(/_/g, ' '),
    })),
  }
}

export function MarketIntelligencePage() {
  const { t } = useI18n()
  const [dataset, setDataset] = React.useState<Dataset | null>(
    () => loadDataset() ?? (!isSupabaseConfigured ? demoDataset() : null),
  )
  const fileRef = React.useRef<HTMLInputElement>(null)

  const persist = (d: Dataset | null) => {
    setDataset(d)
    if (d) localStorage.setItem(DATASET_KEY, JSON.stringify(d))
    else localStorage.removeItem(DATASET_KEY)
  }

  const handleFile = (file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data
        if (rows.length === 0) {
          toast.error('The file contains no data rows.')
          return
        }
        const mapping = detectMapping(Object.keys(rows[0]))
        if (!mapping) {
          toast.error(
            'Could not recognize the columns. Download the template to see the expected format.',
          )
          return
        }
        const records = mapRows(rows, mapping)
        if (records.length === 0) {
          toast.error('No usable records found after parsing.')
          return
        }
        persist({ filename: file.name, records, importedAt: Date.now() })
        toast.success(`Imported ${records.length} records from ${file.name}`)
      },
      error: () => toast.error('Could not parse the file. Make sure it is a valid CSV.'),
    })
  }

  return (
    <div>
      <PageHeader
        title={t('intelligence.title')}
        subtitle={t('intelligence.subtitle')}
        actions={
          dataset ? (
            <>
              <Badge variant="info">
                {dataset.records.length} records · {dataset.filename}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => persist(null)}>
                <Trash2 /> Clear data
              </Button>
            </>
          ) : undefined
        }
      />

      {!dataset ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={FileUp}
              title="Import your data to begin"
              description="Upload a CSV export of your transactions or property records. Columns are auto-detected; download the template for the expected format. All processing happens in your browser — files are never uploaded anywhere."
              action={
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => fileRef.current?.click()}>
                    <FileUp /> Choose CSV file
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download /> Download template
                  </Button>
                </div>
              }
            />
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
                e.target.value = ''
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <DatasetView dataset={dataset} />
      )}
    </div>
  )
}

function DatasetView({ dataset }: { dataset: Dataset }) {
  const { records } = dataset
  const withValue = records.filter((r) => r.value !== null)
  const totalValue = withValue.reduce((s, r) => s + (r.value ?? 0), 0)
  const avgValue = withValue.length ? totalValue / withValue.length : 0
  const withAreaValue = withValue.filter((r) => r.areaSqm && r.areaSqm > 0)
  const avgPriceSqm = withAreaValue.length
    ? withAreaValue.reduce((s, r) => s + (r.value ?? 0) / (r.areaSqm ?? 1), 0) / withAreaValue.length
    : null

  const byCategory = aggregate(records, (r) => r.category, (rs) => ({
    name: rs[0].category,
    count: rs.length,
    value: rs.reduce((s, r) => s + (r.value ?? 0), 0),
  }))

  const byLocation = aggregate(records, (r) => r.location, (rs) => ({
    name: rs[0].location,
    count: rs.length,
  })).slice(0, 8)

  const byMonth = aggregateByMonth(records)

  const byStatus = aggregate(records, (r) => r.status, (rs) => ({
    name: rs[0].status,
    value: rs.length,
  }))

  const statusColor = (s: string) =>
    /clos|won|sold|complete/i.test(s)
      ? '#3F7D5D'
      : /open|active|pending|progress/i.test(s)
        ? '#4D8C83'
        : '#8B98A5'

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Records" value={records.length} />
        <StatCard
          label="Total Value"
          value={withValue.length ? formatCurrency(totalValue) : '—'}
          hint={withValue.length ? `${withValue.length} priced records` : 'No values in file'}
        />
        <StatCard label="Avg. Value" value={withValue.length ? formatCurrency(avgValue) : '—'} />
        <StatCard
          label="Avg. Price / m²"
          value={avgPriceSqm ? formatCurrency(avgPriceSqm) : '—'}
          hint={avgPriceSqm ? 'Across records with area + value' : undefined}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Value over time</CardTitle>
            <CardDescription>Cumulative deal/property value by month.</CardDescription>
          </CardHeader>
          <CardContent>
            {byMonth.length === 0 ? (
              <EmptyState compact title="No dated records" description="Add a date column to see trends." />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={byMonth} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="valFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4D8C83" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#4D8C83" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E9E8" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#697887' }} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#697887' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) =>
                        v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${Math.round(v / 1000)}k`
                      }
                    />
                    <Tooltip
                      formatter={(v) => formatCurrency(Number(v))}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E9E8' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#4D8C83" strokeWidth={2} fill="url(#valFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status mix</CardTitle>
            <CardDescription>Records by status.</CardDescription>
          </CardHeader>
          <CardContent>
            {byStatus.length === 0 ? (
              <EmptyState compact title="No status data" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byStatus}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {byStatus.map((s, i) => (
                        <Cell key={i} fill={statusColor(s.name)} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E9E8' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
                  {byStatus.map((s, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-[12px] text-ink-secondary">
                      <span className="size-2 rounded-full" style={{ background: statusColor(s.name) }} />
                      {s.name} ({s.value})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category + location charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By category</CardTitle>
            <CardDescription>Record count and total value per category.</CardDescription>
          </CardHeader>
          <CardContent>
            {byCategory.length === 0 ? (
              <EmptyState compact title="No category data" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCategory} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E9E8" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#697887' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#697887' }} tickLine={false} axisLine={false} width={60} />
                    <Tooltip
                      formatter={(v, name) =>
                        name === 'value' ? formatCurrency(Number(v)) : v
                      }
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E9E8' }}
                    />
                    <Bar dataKey="count" name="Records" fill="#172C42" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By location</CardTitle>
            <CardDescription>Top locations by record count.</CardDescription>
          </CardHeader>
          <CardContent>
            {byLocation.length === 0 ? (
              <EmptyState compact title="No location data" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byLocation} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E9E8" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#697887' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#697887' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E9E8' }} />
                    <Bar dataKey="count" name="Records" fill="#4D8C83" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Records table */}
      <Card>
        <CardHeader>
          <CardTitle>Imported records</CardTitle>
          <CardDescription>
            First {Math.min(50, records.length)} of {records.length} rows.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Area (m²)</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.slice(0, 50).map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell>{r.location}</TableCell>
                  <TableCell className="text-right">{r.areaSqm ?? '—'}</TableCell>
                  <TableCell className="text-right">{r.value !== null ? formatCurrency(r.value) : '—'}</TableCell>
                  <TableCell>{r.date ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function aggregate<T>(
  records: ParsedRecord[],
  key: (r: ParsedRecord) => string,
  make: (group: ParsedRecord[]) => T & { name: string },
): (T & { name: string })[] {
  const map = new Map<string, ParsedRecord[]>()
  for (const r of records) {
    const k = key(r)
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(r)
  }
  return [...map.entries()]
    .map(([, group]) => make(group))
    .sort((a, b) => (b as { count?: number }).count! - (a as { count?: number }).count! || 0)
    .slice(0, 10)
}

function aggregateByMonth(records: ParsedRecord[]) {
  const map = new Map<string, number>()
  for (const r of records) {
    if (!r.date || r.value === null) continue
    const month = r.date.slice(0, 7)
    map.set(month, (map.get(month) ?? 0) + r.value)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({
      month: new Date(`${month}-01`).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      value,
    }))
}
