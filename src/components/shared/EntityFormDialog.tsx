import * as React from 'react'
import { Controller, useForm, type FieldErrors, type Resolver } from 'react-hook-form'
import type { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface FieldConfig {
  name: string
  label: string
  type:
    | 'text'
    | 'email'
    | 'number'
    | 'date'
    | 'datetime-local'
    | 'select'
    | 'multiselect'
    | 'textarea'
  options?: { value: string; label: string }[]
  placeholder?: string
  hint?: string
}

type FormValues = Record<string, unknown>

interface EntityFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  schema: z.ZodTypeAny
  fields: FieldConfig[]
  defaultValues: FormValues
  submitLabel?: string
  onSubmit: (values: FormValues) => void
}

/**
 * Config-driven create dialog with React Hook Form + Zod validation.
 * Values arrive as strings; schemas should coerce (z.coerce.number() etc.).
 */
export function EntityFormDialog({
  open,
  onOpenChange,
  title,
  description,
  schema,
  fields,
  defaultValues,
  submitLabel = 'Save',
  onSubmit,
}: EntityFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    // Minimal resolver: run the Zod schema and map issues to field errors.
    // zodResolver's generics fight zod v4 + Record<string, unknown> forms.
    resolver: (async (values: FormValues) => {
      const result = await schema.safeParseAsync(values)
      if (result.success) return { values: result.data as FormValues, errors: {} }
      const errors: FieldErrors<FormValues> = {}
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? '_root')
        errors[key] = { type: issue.code, message: issue.message }
      }
      return { values: {}, errors }
    }) as Resolver<FormValues>,
    defaultValues,
  })

  React.useEffect(() => {
    if (open) reset(defaultValues)
  }, [open, reset, defaultValues])

  const submit = handleSubmit((values) => {
    onSubmit(values)
    onOpenChange(false)
  })

  const errorFor = (name: string) =>
    (errors as Record<string, { message?: string }>)[name]?.message

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2" noValidate>
          {fields.map((f) => (
            <div
              key={f.name}
              className={cn('space-y-1.5', f.type === 'datetime-local' && 'sm:col-span-2')}
            >
              <Label htmlFor={f.type === 'multiselect' || f.type === 'textarea' ? undefined : `f-${f.name}`}>
                {f.label}
              </Label>
              {f.type === 'multiselect' ? (
                <Controller
                  name={f.name}
                  control={control}
                  render={({ field }) => {
                    const selected: string[] = Array.isArray(field.value) ? field.value : []
                    return (
                      <div
                        className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-line p-2"
                        role="group"
                        aria-label={f.label}
                      >
                        {f.options?.map((o) => {
                          const checked = selected.includes(o.value)
                          return (
                            <label
                              key={o.value}
                              className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-[13px] text-ink hover:bg-navy-50"
                            >
                              <input
                                type="checkbox"
                                className="size-3.5 accent-teal"
                                checked={checked}
                                onChange={() =>
                                  field.onChange(
                                    checked
                                      ? selected.filter((v) => v !== o.value)
                                      : [...selected, o.value],
                                  )
                                }
                              />
                              {o.label}
                            </label>
                          )
                        })}
                      </div>
                    )
                  }}
                />
              ) : f.type === 'textarea' ? (
                <textarea
                  id={`f-${f.name}`}
                  rows={3}
                  placeholder={f.placeholder}
                  className="flex w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-slate-muted focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-teal"
                  {...register(f.name)}
                />
              ) : f.type === 'select' ? (
                <Select id={`f-${f.name}`} {...register(f.name)} aria-invalid={Boolean(errorFor(f.name))}>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  id={`f-${f.name}`}
                  type={f.type}
                  step={f.type === 'number' ? 'any' : undefined}
                  placeholder={f.placeholder}
                  {...register(f.name)}
                  aria-invalid={Boolean(errorFor(f.name))}
                />
              )}
              {f.hint && <p className="text-[12px] text-slate-muted">{f.hint}</p>}
              {errorFor(f.name) && (
                <p className="text-[12px] text-danger">{errorFor(f.name)}</p>
              )}
            </div>
          ))}
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
