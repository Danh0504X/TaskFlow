import type { ReactNode } from 'react'
import { ChevronUp, Minus, ChevronDown, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { IssuePriority } from '@/features/issues/issue.types'

interface IssuePriorityBadgeProps {
  priority: IssuePriority
  showIcon?: boolean
  /** Ẩn chữ, chỉ còn icon trong khung màu — dùng ở nơi cần tiết kiệm chiều ngang (vd hàng draft
   * rút gọn). Màu nền vẫn đủ để phân biệt mức độ, chữ label chuyển sang tooltip. */
  showLabel?: boolean
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

const IssuePriorityBadge = ({ priority, showIcon = true, showLabel = true, className }: IssuePriorityBadgeProps) => {
  const { label, style, icon } = config[priority]
  return (
    <span
      title={!showLabel ? label : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border text-xs font-semibold',
        // Không chữ -> khung vuông 20x20 cố định, khớp đúng kích thước các icon-chip cạnh nó
        // (loại/nguồn) ở hàng draft rút gọn, thay vì để padding tự co theo icon.
        showLabel ? 'px-2 py-0.5' : 'h-5 w-5 justify-center p-0',
        style,
        className,
      )}
    >
      {showIcon && icon}
      {showLabel && <span>{label}</span>}
    </span>
  )
}

export default IssuePriorityBadge
