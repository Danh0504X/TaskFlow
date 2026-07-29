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
      className={`${className} ${isOver ? 'bg-pastel-blue/40 outline-2 outline-dashed outline-pastel-blue-ink/40' : ''} transition-colors`}
    >
      {children}
    </div>
  )
}
