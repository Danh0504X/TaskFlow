import type { ReactNode } from 'react'
import { useDroppable } from '@dnd-kit/core'

interface DroppableContainerProps {
  id: string
  children: ReactNode
  className?: string
}

export const DroppableContainer = ({ id, children, className }: DroppableContainerProps) => {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'bg-slate-100/50 outline-2 outline-dashed outline-brand/30' : ''} transition-all`}
    >
      {children}
    </div>
  )
}
