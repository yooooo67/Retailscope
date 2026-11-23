import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function LoadingState({ className, rows = 4 }: { className?: string; rows?: number }) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

export { LoadingState }
