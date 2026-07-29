import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeColor = 'green' | 'blue' | 'red' | 'amber' | 'slate'

interface BadgeProps {
  color?: BadgeColor
  children: ReactNode
  className?: string
}

const colorStyles: Record<BadgeColor, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}

/** Nhãn trạng thái nhỏ (pill) dùng chung, vd hiển thị status. */
const Badge = ({ color = 'slate', children, className }: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        colorStyles[color],
        className,
      )}
    >
      {children}
    </span>
  )
}

export default Badge
