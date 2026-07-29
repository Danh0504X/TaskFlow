import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  limit: number
  total: number
  currentCount: number
  onChange: (page: number) => void
}

/** Thanh phân trang mật độ admin, dùng chung cho bảng Tài khoản / Nhật ký sinh / Nhật ký hệ thống. */
const Pagination = ({ page, limit, total, currentCount, onChange }: PaginationProps) => {
  if (total === 0) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-hairline text-[13px] text-muted">
      <div>
        Hiển thị <strong className="text-ink font-semibold">{currentCount}</strong> / <strong className="text-ink font-semibold">{total.toLocaleString('vi-VN')}</strong> dòng
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onChange(Math.max(1, page - 1))}
          className="p-1.5 border border-hairline rounded-md disabled:opacity-40 hover:bg-canvas transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="font-semibold text-ink text-xs">Trang {page}</span>
        <button
          type="button"
          disabled={page * limit >= total}
          onClick={() => onChange(page + 1)}
          className="p-1.5 border border-hairline rounded-md disabled:opacity-40 hover:bg-canvas transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

export default Pagination
