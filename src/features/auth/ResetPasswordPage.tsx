import { zodResolver } from '@hookform/resolvers/zod'
import { BarChart3 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingState } from '@/components/shared/LoadingState'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'

const resetSchema = z
  .object({
    password: z.string().min(8, 'min8'),
    confirm: z.string().min(1, 'required'),
  })
  .refine((v) => v.password === v.confirm, { message: 'mismatch', path: ['confirm'] })

type ResetFormValues = z.infer<typeof resetSchema>

export function ResetPasswordPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [sessionState, setSessionState] = useState<'loading' | 'ready' | 'invalid'>('loading')
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({ resolver: zodResolver(resetSchema) })

  useEffect(() => {
    // Supabase JS picks up the recovery token from the URL hash automatically.
    const { data: sub } = supabase!.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setSessionState('ready')
      }
    })
    supabase!.auth.getSession().then(({ data }) => {
      if (data.session) setSessionState('ready')
      else setSessionState('invalid')
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const onSubmit = async (values: ResetFormValues) => {
    setSubmitting(true)
    const { error } = await supabase!.auth.updateUser({ password: values.password })
    setSubmitting(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(t('auth.resetSuccess'))
    navigate('/login', { replace: true })
  }

  const fieldError = (name: keyof ResetFormValues) => {
    const msg = errors[name]?.message
    if (!msg) return null
    if (msg === 'min8') return t('auth.passwordTooShort')
    if (msg === 'mismatch') return t('auth.passwordMismatch')
    if (msg === 'required') return t('auth.password')
    return msg
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-navy-900">
            <BarChart3 className="size-5 text-white" />
          </div>
          <p className="text-[18px] font-semibold tracking-tight text-ink">RETAILSCOPE</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('auth.resetTitle')}</CardTitle>
            <CardDescription>
              {sessionState === 'invalid' ? t('auth.resetInvalid') : 'Choose a new password for your account.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessionState === 'loading' ? (
              <LoadingState rows={2} />
            ) : sessionState === 'invalid' ? (
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  {t('auth.backToSignIn')}
                </Button>
              </Link>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="password">{t('auth.newPassword')}</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    {...register('password')}
                    aria-invalid={Boolean(errors.password)}
                  />
                  {fieldError('password') && (
                    <p className="text-[12px] text-danger">{fieldError('password')}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">{t('auth.confirmPassword')}</Label>
                  <Input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    {...register('confirm')}
                    aria-invalid={Boolean(errors.confirm)}
                  />
                  {fieldError('confirm') && (
                    <p className="text-[12px] text-danger">{fieldError('confirm')}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? '…' : t('auth.updatePassword')}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-[12px]">
          <Link to="/login" className="text-teal hover:underline">
            {t('auth.backToSignIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}
