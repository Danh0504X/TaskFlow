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
      {/* Làm mờ item gốc khi đang kéo thay vì thay bằng khung placeholder chiều cao cố định
       * -> tự khớp đúng chiều cao thật của item (card Board cao, dòng Backlog thấp), tránh
       * các item khác bị đẩy lên/xuống một khoảng lớn do lệch chiều cao giả với chiều cao thật. */}
      <div className={isDragging ? 'opacity-30 pointer-events-none' : undefined}>{children}</div>
    </div>
  )
}
