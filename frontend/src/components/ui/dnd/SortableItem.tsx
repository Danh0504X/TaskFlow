import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableItemProps {
  id: string
  children: ReactNode
  disabled?: boolean
}

export const SortableItem = ({ id, children, disabled = false }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    cursor: disabled ? 'default' : 'grab',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {isDragging ? (
        <div className="border-2 border-dashed border-brand/20 bg-brand/5 rounded-2xl h-[126px]" />
      ) : (
        children
      )}
    </div>
  )
}
