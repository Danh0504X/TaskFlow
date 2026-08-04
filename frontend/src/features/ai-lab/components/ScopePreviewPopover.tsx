import { createPortal } from 'react-dom'
import { Eye } from 'lucide-react'
import { useDropdownPosition } from '@/lib/useDropdownPosition'

interface ScopePreviewPopoverProps {
  lines: string[]
}

const WIDTH = 280

/** Nút "xem" mở popover liệt kê scopePreview (3–8 dòng phạm vi do AI đề xuất) — chỉ hiển thị,
 * không phải task thật. Dùng chung cơ chế portal + định vị với các dropdown khác trong app. */
const ScopePreviewPopover = ({ lines }: ScopePreviewPopoverProps) => {
  const { open, coords, triggerRef, dropdownRef, toggle } = useDropdownPosition({
    width: WIDTH,
    estimatedHeight: 40 + lines.length * 24,
  })

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          toggle()
        }}
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-brand transition-colors"
      >
        <Eye size={13} />
        Xem ({lines.length})
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
