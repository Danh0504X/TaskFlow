import { createPortal } from 'react-dom'
import { Eye } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useDropdownPosition } from '@/lib/useDropdownPosition'

interface ScopePreviewPopoverProps {
  lines: string[]
  /** Chữ trên nút kích hoạt — mặc định "Xem (N)" (dùng ở DraftTable), truyền riêng cho ngữ cảnh
   * khác (vd "Phạm vi AI yêu cầu" ở IssueDetailPanel). Bỏ qua khi `compact`. */
  label?: string
  /** Ghi đè style nút kích hoạt — dùng khi cần đặt nhỏ/mờ hơn mặc định (vd 1 dòng nhỏ dưới tiêu đề). */
  triggerClassName?: string
  /** Chỉ hiện icon con mắt, không kèm chữ — dùng ở hàng draft rút gọn (DraftRow) khi cần tiết
   * kiệm chiều ngang; số dòng vẫn đọc được qua tooltip (title) khi rê chuột. */
  compact?: boolean
}

const WIDTH = 280

/** Nút "xem" mở popover liệt kê scopePreview (3–8 dòng phạm vi do AI đề xuất) — chỉ hiển thị,
 * không phải task thật. Dùng chung cơ chế portal + định vị với các dropdown khác trong app. */
const ScopePreviewPopover = ({ lines, label, triggerClassName, compact }: ScopePreviewPopoverProps) => {
  const { open, coords, triggerRef, dropdownRef, toggle } = useDropdownPosition({
    width: WIDTH,
    estimatedHeight: 40 + lines.length * 24,
  })

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        title={compact ? `Phạm vi AI đề xuất (${lines.length} dòng)` : undefined}
        onClick={(e) => {
          e.stopPropagation()
          toggle()
        }}
        className={cn(
          'inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-brand transition-colors',
          triggerClassName,
        )}
      >
        <Eye size={compact ? 12 : 13} />
        {!compact && (label ?? `Xem (${lines.length})`)}
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ position: 'fixed', top: coords.top, left: coords.left, width: WIDTH }}
            className="z-50 rounded-lg border border-hairline bg-surface p-3 shadow-lg"
          >
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-subtle">
              Phạm vi đề xuất
            </p>
            <ul className="space-y-1">
              {lines.map((line, idx) => (
                <li key={idx} className="text-xs text-ink leading-snug">
                  • {line}
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </>
  )
}

export default ScopePreviewPopover
