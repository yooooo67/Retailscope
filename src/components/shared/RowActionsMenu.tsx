import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

interface RowActionsMenuProps {
  onEdit: () => void
  onDelete: () => void
  /** accessible label, e.g. "Actions for Cedar Street Showroom" */
  label?: string
}

export function RowActionsMenu({ onEdit, onDelete, label = 'Row actions' }: RowActionsMenuProps) {
  return (
    <DropdownMenu
      align="right"
      width="w-36"
      trigger={
        <Button variant="ghost" size="icon" aria-label={label} className="size-8">
          <MoreHorizontal className="size-4" />
        </Button>
      }
    >
      <DropdownMenuItem onSelect={onEdit}>
        <Pencil className="size-4" /> Edit
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={onDelete} className="text-danger hover:bg-danger-bg">
        <Trash2 className="size-4" /> Delete
      </DropdownMenuItem>
    </DropdownMenu>
  )
}
