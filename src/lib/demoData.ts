/**
 * FICTIONAL demo dataset — for local UI development only.
 * All names, companies and figures are invented. Never use as real data.
 * Active only in demo mode (Supabase not configured).
 */

export type PropertyStatus = 'available' | 'under_offer' | 'let' | 'sold'
export type PropertyCategory = 'Retail' | 'Office' | 'Hospitality' | 'Industrial' | 'Mixed-use'

export interface DemoProperty {
  id: string
  name: string
  category: PropertyCategory
  location: string
  areaSqm: number
  askingValue: number | null
  status: PropertyStatus
  addedAt: string
}

export type DealStatus = 'open' | 'negotiation' | 'closed_won' | 'closed_lost'
export type DealType = 'sale' | 'acquisition' | 'lease'

export interface DemoTransaction {
  id: string
  name: string
  type: DealType
  category: PropertyCategory
  counterparty: string
  value: number
  status: DealStatus
  closedAt: string | null
  createdAt: string
}

export type ContactType = 'owner' | 'tenant' | 'buyer' | 'broker' | 'service_provider'

export interface DemoContact {
  id: string
  name: string
  company: string
  type: ContactType
  email: string
  phone: string
  /** ids of properties this contact owns / rents / is interested in */
  propertyIds: string[]
  /** free-text: what they're buying, selling, looking for */
  notes: string
}

export type ActivityType = 'call' | 'meeting' | 'viewing' | 'task' | 'email'
export type ActivityStatus = 'upcoming' | 'completed' | 'overdue'

export interface DemoActivity {
  id: string
  title: string
  type: ActivityType
  relatedTo: string
  scheduledAt: string
  status: ActivityStatus
}

export const DEMO_PROPERTIES: DemoProperty[] = [
  { id: 'p1', name: 'Riverside Retail Unit 4', category: 'Retail', location: 'Harbor District', areaSqm: 145, askingValue: 1250000, status: 'available', addedAt: '2026-10-28' },
  { id: 'p2', name: 'Harbor Office Suite 210', category: 'Office', location: 'Harbor District', areaSqm: 320, askingValue: 2400000, status: 'under_offer', addedAt: '2026-10-21' },
  { id: 'p3', name: 'Old Town Brasserie Space', category: 'Hospitality', location: 'Old Town', areaSqm: 90, askingValue: 680000, status: 'let', addedAt: '2026-10-15' },
  { id: 'p4', name: 'Northgate Logistics Warehouse', category: 'Industrial', location: 'Northgate', areaSqm: 2400, askingValue: 5100000, status: 'available', addedAt: '2026-09-30' },
  { id: 'p5', name: 'Market Hall Mixed-Use G1', category: 'Mixed-use', location: 'Market Square', areaSqm: 410, askingValue: 3900000, status: 'available', addedAt: '2026-11-02' },
  { id: 'p6', name: 'Cedar Street Showroom', category: 'Retail', location: 'Cedar Street', areaSqm: 180, askingValue: 940000, status: 'sold', addedAt: '2026-09-12' },
  { id: 'p7', name: 'Lakeside Café Unit', category: 'Hospitality', location: 'Lakeside', areaSqm: 75, askingValue: 420000, status: 'let', addedAt: '2026-08-19' },
  { id: 'p8', name: 'Foundry Lofts Retail Podium', category: 'Mixed-use', location: 'Foundry Quarter', areaSqm: 260, askingValue: 2750000, status: 'under_offer', addedAt: '2026-11-08' },
]

export const DEMO_TRANSACTIONS: DemoTransaction[] = [
  { id: 't1', name: 'Cedar Street Showroom — sale', type: 'sale', category: 'Retail', counterparty: 'Vireo Retail Group', value: 940000, status: 'closed_won', closedAt: '2026-10-30', createdAt: '2026-09-01' },
  { id: 't2', name: 'Harbor Office Suite 210 — acquisition', type: 'acquisition', category: 'Office', counterparty: 'Meridian Capital', value: 2400000, status: 'negotiation', closedAt: null, createdAt: '2026-10-05' },
  { id: 't3', name: 'Old Town Brasserie — lease', type: 'lease', category: 'Hospitality', counterparty: 'Casa Verde Hospitality', value: 185000, status: 'closed_won', closedAt: '2026-10-18', createdAt: '2026-09-20' },
  { id: 't4', name: 'Northgate Warehouse — sale', type: 'sale', category: 'Industrial', counterparty: 'BlueRidge Logistics', value: 5100000, status: 'open', closedAt: null, createdAt: '2026-10-25' },
  { id: 't5', name: 'Market Hall G1 — acquisition', type: 'acquisition', category: 'Mixed-use', counterparty: 'Atlas Property Partners', value: 3900000, status: 'negotiation', closedAt: null, createdAt: '2026-11-04' },
  { id: 't6', name: 'Lakeside Café — lease renewal', type: 'lease', category: 'Hospitality', counterparty: 'Lakeside Coffee Co.', value: 96000, status: 'closed_won', closedAt: '2026-09-27', createdAt: '2026-08-30' },
  { id: 't7', name: 'Foundry Podium — sale', type: 'sale', category: 'Mixed-use', counterparty: 'Northfork Investments', value: 2750000, status: 'open', closedAt: null, createdAt: '2026-11-10' },
]

export const DEMO_CONTACTS: DemoContact[] = [
  { id: 'c1', name: 'Amara Osei', company: 'Vireo Retail Group', type: 'buyer', email: 'a.osei@vireo.example', phone: '+1 555 0101', propertyIds: ['p6'], notes: 'Acquired the Cedar Street showroom; actively seeking additional retail units in Harbor District.' },
  { id: 'c2', name: 'Daniel Reyes', company: 'Meridian Capital', type: 'buyer', email: 'd.reyes@meridian.example', phone: '+1 555 0102', propertyIds: ['p2'], notes: 'Under offer on Harbor Office Suite 210; also targeting value-add office assets.' },
  { id: 'c3', name: 'Giulia Ferraro', company: 'Casa Verde Hospitality', type: 'tenant', email: 'g.ferraro@casaverde.example', phone: '+1 555 0103', propertyIds: ['p3'], notes: 'Leased Old Town Brasserie space; interested in second F&B location.' },
  { id: 'c4', name: 'Tom Beckett', company: 'BlueRidge Logistics', type: 'buyer', email: 't.beckett@blueridge.example', phone: '+1 555 0104', propertyIds: ['p4'], notes: 'Negotiating on Northgate Warehouse; requires 24/7 access and dock doors.' },
  { id: 'c5', name: 'Priya Nair', company: 'Atlas Property Partners', type: 'broker', email: 'p.nair@atlaspp.example', phone: '+1 555 0105', propertyIds: ['p5'], notes: 'Representing buyer for Market Hall G1; specializes in mixed-use.' },
  { id: 'c6', name: 'Jonas Lindqvist', company: 'Lakeside Coffee Co.', type: 'tenant', email: 'j.lindqvist@lakeside.example', phone: '+1 555 0106', propertyIds: ['p7'], notes: 'Renewed Lakeside Café unit; may expand to high-street retail.' },
  { id: 'c7', name: 'Sofia Marchetti', company: 'Harbor Property Mgmt', type: 'owner', email: 's.marchetti@harborpm.example', phone: '+1 555 0107', propertyIds: ['p1', 'p2'], notes: 'Owns Riverside Retail Unit 4 and Harbor Office Suite 210; open to joint-venture structures.' },
  { id: 'c8', name: 'Elliot Grant', company: 'Northfork Investments', type: 'buyer', email: 'e.grant@northfork.example', phone: '+1 555 0108', propertyIds: ['p8'], notes: 'Interested in Foundry Podium retail space; prefers sale-leaseback structures.' },
]

export const DEMO_ACTIVITIES: DemoActivity[] = [
  { id: 'a1', title: 'Site viewing — Northgate Warehouse', type: 'viewing', relatedTo: 'Northgate Logistics Warehouse', scheduledAt: '2026-11-18T10:00:00', status: 'upcoming' },
  { id: 'a2', title: 'Call with Meridian Capital re: Harbor Suite terms', type: 'call', relatedTo: 'Harbor Office Suite 210', scheduledAt: '2026-11-17T14:30:00', status: 'upcoming' },
  { id: 'a3', title: 'Lease negotiation follow-up — Casa Verde', type: 'meeting', relatedTo: 'Old Town Brasserie Space', scheduledAt: '2026-11-19T09:00:00', status: 'upcoming' },
  { id: 'a4', title: 'Send OM draft for Market Hall G1', type: 'task', relatedTo: 'Market Hall Mixed-Use G1', scheduledAt: '2026-11-16T16:00:00', status: 'completed' },
  { id: 'a5', title: 'Intro call — Lakeside Coffee renewal', type: 'call', relatedTo: 'Lakeside Café Unit', scheduledAt: '2026-11-14T11:00:00', status: 'completed' },
  { id: 'a6', title: 'Viewing — Foundry Podium with Northfork', type: 'viewing', relatedTo: 'Foundry Lofts Retail Podium', scheduledAt: '2026-11-21T13:00:00', status: 'upcoming' },
  { id: 'a7', title: 'Zoning check — Riverside unit change of use', type: 'task', relatedTo: 'Riverside Retail Unit 4', scheduledAt: '2026-11-12T09:00:00', status: 'overdue' },
]

export const DEMO_STATS = {
  activeProperties: DEMO_PROPERTIES.filter((p) => p.status === 'available' || p.status === 'under_offer').length,
  openTransactions: DEMO_TRANSACTIONS.filter((t) => ['open', 'negotiation'].includes(t.status)).length,
  totalDealValue: DEMO_TRANSACTIONS.reduce((s, t) => s + t.value, 0),
  closedDeals: DEMO_TRANSACTIONS.filter((t) => t.status.startsWith('closed')).length,
}
