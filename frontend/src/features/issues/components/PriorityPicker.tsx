import { createPortal } from 'react-dom'
import { Check } from 'lucide-react'
import IssuePriorityBadge from '@/components/ui/IssuePriorityBadge'
import { useDropdownPosition } from '@/lib/useDropdownPosition'
import { ISSUE_PRIORITY, type IssuePriority } from '../issue.types'

interface PriorityPickerProps {
  value: IssuePriority
  onChange: (priority: IssuePriority) => void
  onOpenChange?: (open: boolean) => void
  /** Chỉ hiển thị badge, không cho bấm đổi. */
  readOnly?: boolean
}

const OPTIONS: IssuePriority[] = [ISSUE_PRIORITY.URGENT, ISSUE_PRIORITY.HIGH, ISSUE_PRIORITY.MEDIUM, ISSUE_PRIORITY.LOW]
const DROPDOWN_WIDTH = 176

/** Badge độ ưu tiên có thể bấm để đổi ngay tại chỗ — dropdown qua Portal, cùng cơ chế với AssigneePicker. */
const PriorityPicker = ({ value, onChange, onOpenChange, readOnly = false }: PriorityPickerProps) => {
  const { open, coords, triggerRef, dropdownRef, toggle, close } = useDropdownPosition({
    width: DROPDOWN_WIDTH,
    estimatedHeight: 190,
    onOpenChange,
  })

  if (readOnly) {
    return <IssuePriorityBadge priority={value} showIcon={false} />
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          toggle()
        }}
        className="rounded-md transition-all hover:ring-2 hover:ring-brand/20 shrink-0"
      >
        <IssuePriorityBadge priority={value} showIcon={false} />
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'fixed', top: coords.top, left: coords.left, width: DROPDOWN_WIDTH }}
            className="z-50 bg-white border border-line/20 rounded-2xl shadow-lg py-1.5"
          >
            {OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt)
                  close()
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-slate-50 transition-all"
              >
                <IssuePriorityBadge priority={opt} showIcon />
                {value === opt && <Check size={14} className="text-brand shrink-0" />}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}

export default PriorityPicker