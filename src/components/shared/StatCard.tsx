import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  hint?: string
  className?: string
}

function StatCard({ label, value, icon: Icon, hint, className }: StatCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-wide text-ink-secondary">
            {label}
          </p>
          <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-ink">
            {value}
          </p>
          {hint && <p className="mt-2 text-[12px] text-slate-muted">{hint}</p>}
        </div>
        {Icon && (
          <div className="flex size-9 items-center justify-center rounded-md bg-navy-50 text-navy-600">
            <Icon className="size-[18px]" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { StatCard }
