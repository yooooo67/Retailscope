import { Construction } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'

interface PlaceholderPageProps {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} subtitle="Module in development" />
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={Construction}
            title={`${title} is coming in a later phase`}
            description={description}
          />
        </CardContent>
      </Card>
    </div>
  )
}
