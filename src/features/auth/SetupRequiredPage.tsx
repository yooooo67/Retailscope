import { Database, KeyRound } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { isSupabaseConfigured } from '@/lib/supabase'

export function SetupRequiredPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-info-bg text-info">
            <Database className="size-5" />
          </div>
          <CardTitle>Backend not connected</CardTitle>
          <CardDescription>
            RETAILSCOPE needs a Supabase project to handle authentication and data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-[13px] text-ink-secondary">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Create a project at{' '}
              <a
                className="font-medium text-teal underline underline-offset-2"
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
              >
                supabase.com
              </a>{' '}
              and run the migrations in <code>supabase/migrations/</code>.
            </li>
            <li>
              Copy <code>.env.example</code> to <code>.env</code> and fill in{' '}
              <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
            </li>
            <li>Restart the dev server.</li>
          </ol>
          <div className="flex items-start gap-2 rounded-md bg-warning-bg p-3 text-[12px] text-warning">
            <KeyRound className="mt-0.5 size-4 shrink-0" />
            <span>
              Configured: <strong>{isSupabaseConfigured ? 'yes' : 'no'}</strong>. Never commit real
              credentials — use environment variables only.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
