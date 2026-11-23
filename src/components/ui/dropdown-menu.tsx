import { Check } from 'lucide-react'
import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface DropdownMenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right'
  width?: string
}

const WIDTH_PX: Record<string, number> = {
  'w-36': 144,
  'w-44': 176,
  'w-48': 192,
  'w-56': 224,
  'w-64': 256,
}

/**
 * Lightweight accessible dropdown menu rendered in a portal so it is never
 * clipped by scrollable ancestors (tables, cards). Closes on Escape, outside
 * click, scroll and item selection.
 */
function DropdownMenu({ trigger, children, align = 'right', width = 'w-56' }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null)
  const ref = React.useRef<HTMLDivElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)

  const updatePos = React.useCallback(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const w = WIDTH_PX[width] ?? 224
    setPos({
      top: rect.bottom + 6,
      left: align === 'right' ? rect.right - w : rect.left,
    })
  }, [align, width])

  React.useEffect(() => {
    if (!open) return
    updatePos()
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const close = () => setOpen(false)
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [open, updatePos])

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: pos.top, left: pos.left }}
            className={cn(
              'fixed z-[60] overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-lg',
              width,
            )}
          >
            <MenuCloseContext.Provider value={() => setOpen(false)}>
              {children}
            </MenuCloseContext.Provider>
          </div>,
          document.body,
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
