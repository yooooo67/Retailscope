import { Check } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface DropdownMenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right'
  width?: string
}

/**
 * Lightweight accessible dropdown menu. Closes on Escape, outside click,
 * and item selection.
 */
function DropdownMenu({ trigger, children, align = 'right', width = 'w-56' }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute top-full z-40 mt-1.5 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-lg',
            width,
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          <MenuCloseContext.Provider value={() => setOpen(false)}>{children}</MenuCloseContext.Provider>
        </div>
      )}
    </div>
  )
}

const MenuCloseContext = React.createContext<() => void>(() => {})

function DropdownMenuItem({
  className,
  onSelect,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const close = React.useContext(MenuCloseContext)
  return (
    <button
      role="menuitem"
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink hover:bg-navy-50',
        className,
      )}
      onClick={(e) => {
        onSelect?.(e)
        close()
      }}
      {...props}
    >
      {children}
    </button>
  )
}

function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-3 py-1.5 text-[12px] font-medium uppercase tracking-wide text-slate-muted', className)}
      {...props}
    />
  )
}

function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('my-1 border-t border-line', className)} {...props} />
}

function DropdownMenuCheckboxItem({
  checked,
  onCheckedChange,
  children,
  className,
}: {
  checked: boolean
  onCheckedChange: (v: boolean) => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      role="menuitemcheckbox"
      aria-checked={checked}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink hover:bg-navy-50',
        className,
      )}
      onClick={() => onCheckedChange(!checked)}
    >
      <span
        className={cn(
          'flex size-4 items-center justify-center rounded border',
          checked ? 'border-teal bg-teal text-white' : 'border-line bg-surface',
        )}
      >
        {checked && <Check className="size-3" />}
      </span>
      {children}
    </button>
  )
}

export {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  Button as DropdownTrigger,
}
