import type { ReactNode } from 'react'
import { ChevronUp, Minus, ChevronDown, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { IssuePriority } from '@/features/issues/issue.types'

interface IssuePriorityBadgeProps {
  priority: IssuePriority
  showIcon?: boolean
  className?: string
}

const config: Record<IssuePriority, { label: string; style: string; icon: ReactNode }> = {
  URGENT: {
    label: 'Khẩn cấp',
    style: 'bg-red-50 text-red-700 border-red-100',
    icon: <AlertCircle className="text-red-600" size={14} />,
  },
  HIGH: {
    label: 'Cao',
    style: 'bg-amber-50 text-amber-700 border-amber-100',
    icon: <ChevronUp className="text-amber-600" size={14} />,
  },
  MEDIUM: {
    label: 'Trung bình',
    style: 'bg-blue-50 text-blue-700 border-blue-100',
    icon: <Minus className="text-blue-600" size={14} />,
  },
  LOW: {
    label: 'Thấp',
    style: 'bg-gray-50 text-gray-600 border-gray-100',
    icon: <ChevronDown className="text-gray-500" size={14} />,
  },
}

const IssuePriorityBadge = ({ priority, showIcon = true, className }: IssuePriorityBadgeProps) => {
  const { label, style, icon } = config[priority]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-semibold',
        style,
        className,
      )}
    >
      {showIcon && icon}
      <span>{label}</span>
    </span>
  )
}

export default IssuePriorityBadge
