import { ArrowLeft, Building2, Handshake, Printer, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import {
  useActivities,
  useContacts,
  useProperties,
  useTransactions,
} from '@/hooks/useWorkspaceData'
import { money, StatusBadge } from '../shared/statusBadges'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-medium uppercase tracking-wide text-ink-secondary">{label}</p>
      <p className="mt-1 text-[14px] text-ink">{value ?? '—'}</p>
    </div>
  )
}

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()

  const props = useProperties()
  const contacts = useContacts()
  const transactions = useTransactions()
  const activities = useActivities()

  const isLoading = props.isLoading || contacts.isLoading || transactions.isLoading || activities.isLoading
  const property = props.rows.find((p) => p.id === id)

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Property" />
        <LoadingState rows={6} />
      </div>
    )
  }

  if (!property) {
    return (
      <div>
        <PageHeader title="Property not found" />
        <Card>
          <EmptyState
            icon={Building2}
            title="This property doesn't exist"
            description="It may have been deleted, or the link is incorrect."
            action={
              <Link to="/properties">
                <Button variant="outline" size="sm">
                  <ArrowLeft /> Back to properties
                </Button>
              </Link>
            }
          />
        </Card>
      </div>
    )
  }

  const linkedContacts = contacts.rows.filter((c) => c.propertyIds?.includes(property.id))
  const relatedTx = transactions.rows.filter(
    (t) =>
      t.name.toLowerCase().includes(property.name.toLowerCase()) ||
      (t.category === property.category &&
        t.counterparty &&
        linkedContacts.some((c) => c.company === t.counterparty)),
  )
  const relatedActs = activities.rows.filter((a) =>
    a.relatedTo.toLowerCase().includes(property.name.toLowerCase()),
  )

  return (
    <div>
      <Link
        to="/properties"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-secondary hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Properties
      </Link>

      <PageHeader
        title={property.name}
        subtitle={`${property.category} · ${property.location}`}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="no-print"
              onClick={() => window.print()}
            >
              <Printer /> Print fact sheet
            </Button>
            <StatusBadge value={property.status} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            <Field label="Category" value={property.category} />
            <Field label="Location" value={property.location} />
            <Field label="Area" value={`${property.areaSqm.toLocaleString()} m²`} />
            <Field label="Asking value" value={money(property.askingValue)} />
            <Field label="Status" value={<StatusBadge value={property.status} />} />
            <Field label="Added" value={property.addedAt} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4 text-slate-muted" /> Linked contacts
            </CardTitle>
            <CardDescription>People tied to this property.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {linkedContacts.length === 0 ? (
              <EmptyState compact title="No linked contacts" description="Link owners, tenants or buyers from the Contacts page." />
            ) : (
              <ul className="divide-y divide-line">
                {linkedContacts.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{c.name}</p>
                      <p className="truncate text-[12px] text-slate-muted">{c.company}</p>
                    </div>
                    <StatusBadge value={c.type} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="size-4 text-slate-muted" /> Related deals
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {relatedTx.length === 0 ? (
              <EmptyState compact title="No related deals" />
            ) : (
              <ul className="divide-y divide-line">
                {relatedTx.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{t.name}</p>
                      <p className="text-[12px] text-slate-muted">{t.counterparty}</p>
                    </div>
                    <span className="text-[13px] font-medium">{money(t.value)}</span>
                    <StatusBadge value={t.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4 text-slate-muted" /> Related activities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {relatedActs.length === 0 ? (
              <EmptyState compact title="No related activities" />
            ) : (
              <ul className="divide-y divide-line">
                {relatedActs.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{a.title}</p>
                      <p className="text-[12px] text-slate-muted">{a.relatedTo}</p>
                    </div>
                    <StatusBadge value={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
