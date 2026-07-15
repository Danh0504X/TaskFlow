import { cn } from '@/lib/cn'
import type { IssueStatus } from '@/features/issues/issue.types'

interface IssueStatusBadgeProps {
  status: IssueStatus
  className?: string
}

const config: Record<IssueStatus, { label: string; style: string }> = {
  TODO: { label: 'Cần làm', style: 'bg-slate-100 text-brand border-line' },
  IN_PROGRESS: { label: 'Đang làm', style: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
  IN_REVIEW: { label: 'Đang đánh giá', style: 'bg-brand/5 text-brand border-brand/10' },
  DONE: { label: 'Hoàn thành', style: 'bg-green-100 text-green-700 border-green-200' },
}

const IssueStatusBadge = ({ status, className }: IssueStatusBadgeProps) => {
  const { label, style } = config[status]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-bold uppercase tracking-wider',
        style,
        className,
      )}
    >
      {label}
    </span>
  )
}

export default IssueStatusBadge
