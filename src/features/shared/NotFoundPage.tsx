import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-[28px] font-semibold text-ink">404</p>
          <p className="text-[13px] text-ink-secondary">This page does not exist.</p>
          <Button onClick={() => window.history.back()} variant="outline" size="sm">
            Go back
          </Button>
          <Link to="/dashboard" className="text-[13px] font-medium text-teal hover:underline">
            Back to dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
