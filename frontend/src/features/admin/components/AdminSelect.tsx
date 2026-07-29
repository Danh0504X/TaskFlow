import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

interface AdminSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

/** Select mật độ admin dùng chung cho mọi bộ lọc trong khu Admin (Tài khoản, Nhật ký sinh,
 * Nhật ký hệ thống...) — thay cho việc mỗi trang tự viết lại className cho <select> native,
 * giữ giao diện đồng nhất và tinh gọn hơn giữa các trang. */
const AdminSelect = ({ label, className, ...rest }: AdminSelectProps) => (
  <label className="flex flex-col gap-1">
    {label && <span className="text-[10px] font-semibold text-subtle uppercase tracking-wide">{label}</span>}
    <span className="relative inline-flex">
      <select
        className={cn(
          'appearance-none bg-surface border border-hairline rounded-lg py-2 pl-3 pr-8 text-xs font-semibold text-ink focus:ring-2 focus:ring-brand/20 outline-none transition-colors hover:border-ink/20',
          className,
        )}
        {...rest}
      />
      <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-subtle" />
    </span>
  </label>
)

export default AdminSelect
