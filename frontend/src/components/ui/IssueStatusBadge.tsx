import { cn } from '@/lib/cn'
import type { IssueStatus } from '@/features/issues/issue.types'

// Cùng bộ pastel với priority/methodology badge: TODO trung tính, IN_PROGRESS xanh dương
// (đang chạy), IN_REVIEW vàng (đang chờ duyệt), DONE xanh lá (hoàn tất) — quy ước màu quen
// thuộc thay vì các màu Tailwind rời rạc (cyan/green/slate) trước đây.
const config: Record<IssueStatus, { label: string; style: string }> = {
  TODO: { label: 'Cần làm', style: 'bg-canvas text-subtle border-hairline' },
  IN_PROGRESS: { label: 'Đang làm', style: 'bg-pastel-blue text-pastel-blue-ink border-transparent' },
  IN_REVIEW: { label: 'Đang đánh giá', style: 'bg-pastel-yellow text-pastel-yellow-ink border-transparent' },
  DONE: { label: 'Hoàn thành', style: 'bg-pastel-green text-pastel-green-ink border-transparent' },
}

const IssueStatusBadge = ({ status, className }: { status: IssueStatus; className?: string }) => {
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
