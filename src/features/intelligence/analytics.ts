export type DatasetKind = 'transactions' | 'properties'

export interface ParsedRecord {
  /** display name (property or deal name) */
  name: string
  category: string
  location: string
  areaSqm: number | null
  /** transaction price or property asking value */
  value: number | null
  date: string | null
  status: string
}

export interface ColumnMapping {
  name: number
  category: number
  location: number
  area: number
  value: number
  date: number
  status: number
}

export const TEMPLATE_HEADERS = [
  'name',
  'category',
  'location',
  'area_sqm',
  'value',
  'date',
  'status',
] as const

export const TEMPLATE_CSV = [
  TEMPLATE_HEADERS.join(','),
  'Riverside Retail Unit,A, Downtown,145,1250000,2026-03-14,closed',
  'Harbor Office Suite,B, Harbor District,320,2400000,2026-05-02,open',
  'Old Town Restaurant,C, Old Town,90,680000,2026-07-21,closed',
].join('\n')

export function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'retailscope-import-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

/** Map CSV header names to canonical fields, tolerant of common variants. */
export function detectMapping(headers: string[]): ColumnMapping | null {
  const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  const idx = (candidates: string[]) =>
    headers.findIndex((h) => candidates.includes(norm(h)))

  const mapping: ColumnMapping = {
    name: idx(['name', 'property', 'property_name', 'title', 'asset', 'deal', 'listing']),
    category: idx(['category', 'type', 'property_type', 'use', 'sector', 'asset_class']),
    location: idx(['location', 'city', 'address', 'area', 'district', 'submarket']),
    area: idx(['area_sqm', 'area', 'sqm', 'size', 'size_sqm', 'floor_area', 'gla']),
    value: idx(['value', 'price', 'amount', 'deal_value', 'asking_price', 'asking', 'price_eur', 'transaction_value']),
    date: idx(['date', 'closing_date', 'transaction_date', 'signed_date', 'created_at', 'month']),
    status: idx(['status', 'stage', 'state', 'outcome']),
  }

  // Need at least name + (value or area) to be useful
  const hasCore =
    (mapping.value >= 0 || mapping.area >= 0) && (mapping.name >= 0 || mapping.category >= 0)
  return hasCore ? mapping : null
}

const toNumber = (raw: string | undefined): number | null => {
  if (!raw) return null
  const cleaned = raw.replace(/[^0-9.,-]/g, '').replace(/\s/g, '')
  if (!cleaned) return null
  // Handle European format "1.234,56" vs US "1,234.56"
  const normalized =
    cleaned.includes(',') && cleaned.includes('.')
      ? cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '')
      : cleaned.includes(',') && !cleaned.includes('.')
        ? cleaned.replace(',', '.')
        : cleaned
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

const toDate = (raw: string | undefined): string | null => {
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

export function mapRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
): ParsedRecord[] {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : []
  const cell = (row: Record<string, string>, i: number) =>
    i >= 0 ? (row[headers[i]] ?? '') : ''

  return rows
    .map((row) => ({
      name: cell(row, mapping.name).trim() || '—',
      category: cell(row, mapping.category).trim() || 'Uncategorized',
      location: cell(row, mapping.location).trim() || '—',
      areaSqm: toNumber(cell(row, mapping.area)),
      value: toNumber(cell(row, mapping.value)),
      date: toDate(cell(row, mapping.date)),
      status: cell(row, mapping.status).trim() || 'unknown',
    }))
    .filter((r) => r.value !== null || r.areaSqm !== null || r.name !== '—')
}
