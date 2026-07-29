import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface PageHeaderButtonProps {
  icon: LucideIcon
  children: ReactNode
  onClick: () => void
  /** primary: nền đen, dùng cho hành động chính (tối đa 1 nút/trang). secondary: viền mảnh, nền trắng. */
  variant?: 'primary' | 'secondary'
  /** Số hiển thị dạng chấm tròn góc trên-phải (vd số lời mời chưa đọc). Ẩn khi <= 0. */
  badge?: number
}

/** Nút hành động gọn dùng trong PageHeader — cùng 1 kiểu cho mọi trang (Tổng quan/Dự án/Việc của tôi),
 * chỉ khác icon + nhãn truyền vào theo từng trang. */
const PageHeaderButton = ({ icon: Icon, children, onClick, variant = 'secondary', badge }: PageHeaderButtonProps) => {
  const isPrimary = variant === 'primary'
  return (
    <button
      onClick={onClick}
      className={
        isPrimary
          ? 'flex items-center gap-1.5 px-2.5 py-1.5 bg-ink text-white rounded-md text-xs font-semibold hover:bg-[#333333] transition-colors active:scale-[0.98]'
          : 'relative flex items-center gap-1.5 px-2.5 py-1.5 bg-white text-ink border border-hairline rounded-md text-xs font-semibold hover:border-ink/20 transition-colors'
      }
    >
      <Icon size={13} className={isPrimary ? undefined : 'text-muted'} />
      <span>{children}</span>
      {!!badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[9px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  )
}

export default PageHeaderButton
