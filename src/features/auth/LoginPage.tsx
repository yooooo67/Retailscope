import { zodResolver } from '@hookform/resolvers/zod'
import { BarChart3, FlaskConical } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { demoSignIn } from '@/lib/demo'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { status } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const demoMode = !isSupabaseConfigured
  const { t } = useI18n()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  if (status === 'authenticated') return <Navigate to="/dashboard" replace />
  if (status === 'loading') return null

  const onSubmit = async (values: LoginFormValues) => {
    if (demoMode) {
      // Demo mode: any valid credentials sign in locally. No real auth occurs.
      demoSignIn(values.email)
      toast.success('Signed in (demo mode)')
      navigate('/dashboard', { replace: true })
      return
    }
    if (!supabase) return
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    setSubmitting(false)
    if (error) {
      toast.error(
        error.message === 'Invalid login credentials' ? 'Invalid email or password.' : error.message,
      )
      return
    }
    toast.success('Welcome back')
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-navy-900">
            <BarChart3 className="size-5 text-white" />
          </div>
          <div className="text-center">
            <p className="text-[18px] font-semibold tracking-tight text-ink">RETAILSCOPE</p>
            <p className="text-[13px] text-ink-secondary">Commercial Real Estate Intelligence</p>
          </div>
          {demoMode && (
            <Badge variant="warning" className="gap-1.5">
              <FlaskConical className="size-3" /> Demo mode — fictional data
            </Badge>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('auth.signIn')}</CardTitle>
            <CardDescription>
              {demoMode
                ? 'Explore the interface — any email and password works.'
                : 'Access your agency workspace.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={demoMode ? 'you@example.com' : 'you@agency.com'}
                  {...register('email')}
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email && <p className="text-[12px] text-danger">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  aria-invalid={Boolean(errors.password)}
                />
                {errors.password && (
                  <p className="text-[12px] text-danger">{errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? '…' : t('auth.signIn')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-[12px] text-slate-muted">
          {demoMode
            ? 'Demo mode runs entirely in your browser. Connect Supabase to enable real authentication.'
            : 'Accounts are provisioned by your agency administrator.'}
        </p>
      </div>
    </div>
  )
}
