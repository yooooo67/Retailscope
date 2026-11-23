import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  compact?: boolean
}

function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-2 py-8' : 'gap-3 py-14',
        className,
      )}
    >
      {Icon && (
        <div className="flex size-10 items-center justify-center rounded-lg bg-navy-50 text-slate-muted">
          <Icon className="size-5" />
        </div>
      )}
      <div>
        <p className="text-[14px] font-medium text-ink">{title}</p>
        {description && (
          <p className="mt-1 max-w-sm text-[13px] text-ink-secondary">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

export { EmptyState }
