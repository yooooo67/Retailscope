import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this data. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-14 text-center', className)}>
      <div className="flex size-10 items-center justify-center rounded-lg bg-danger-bg text-danger">
        <AlertTriangle className="size-5" />
      </div>
      <div>
        <p className="text-[14px] font-medium text-ink">{title}</p>
        <p className="mt-1 max-w-sm text-[13px] text-ink-secondary">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export { ErrorState }
