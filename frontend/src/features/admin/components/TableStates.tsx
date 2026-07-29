import type { CSSProperties, ReactNode } from 'react'
import { AlertCircle, Inbox } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'

/** Trạng thái đang tải dùng chung cho mọi bảng trong khu Admin. */
export const TableLoading = ({ label = 'Đang tải dữ liệu...' }: { label?: string }) => (
  <div className="flex flex-col items-center justify-center gap-2.5 py-16 text-muted">
    <Spinner className="h-5 w-5" />
    <span className="text-xs font-medium">{label}</span>
  </div>
)

/** Trạng thái rỗng dùng chung — khác nội dung tuỳ ngữ cảnh (không tìm thấy / chưa có dữ liệu). */
export const TableEmpty = ({ title, description }: { title: string; description?: string }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
    <Inbox size={28} className="text-subtle" />
    <p className="text-sm font-semibold text-ink">{title}</p>
    {description && <p className="text-xs text-subtle max-w-sm">{description}</p>}
  </div>
)

/** Trạng thái lỗi dùng chung — dữ liệu mock hiếm khi lỗi, nhưng vẫn cần giao diện cho lúc backend
 * thật trả lỗi (network, 500...). */
export const TableError = ({ message = 'Không tải được dữ liệu. Vui lòng thử lại.' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
    <AlertCircle size={28} className="text-red-500" />
    <p className="text-sm font-semibold text-ink">{message}</p>
  </div>
)

export const SectionCard = ({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) => <div className={`bg-surface border border-hairline rounded-xl ${className ?? ''}`} style={style}>{children}</div>
