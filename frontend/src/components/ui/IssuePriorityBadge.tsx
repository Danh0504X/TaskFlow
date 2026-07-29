import type { ReactNode } from 'react'
import { ChevronUp, Minus, ChevronDown, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { IssuePriority } from '@/features/issues/issue.types'

interface IssuePriorityBadgeProps {
  priority: IssuePriority
  showIcon?: boolean
  className?: string
}

// Dùng đúng 4 pastel chung của app cho 4 mức ưu tiên — nhất quán với methodology badge và
// status badge, thay vì các màu Tailwind mặc định (red/amber/blue/gray) rời rạc trước đây.
const config: Record<IssuePriority, { label: string; style: string; icon: ReactNode }> = {
  URGENT: {
    label: 'Khẩn cấp',
    style: 'bg-pastel-red text-pastel-red-ink border-transparent',
    icon: <AlertCircle size={14} />,
  },
  HIGH: {
    label: 'Cao',
    style: 'bg-pastel-yellow text-pastel-yellow-ink border-transparent',
    icon: <ChevronUp size={14} />,
  },
  MEDIUM: {
    label: 'Trung bình',
    style: 'bg-pastel-blue text-pastel-blue-ink border-transparent',
    icon: <Minus size={14} />,
  },
  LOW: {
    label: 'Thấp',
    style: 'bg-canvas text-subtle border-hairline',
    icon: <ChevronDown size={14} />,
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
