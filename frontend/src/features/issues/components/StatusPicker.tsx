import { createPortal } from 'react-dom'
import { Check } from 'lucide-react'
import IssueStatusBadge from '@/components/ui/IssueStatusBadge'
import { useDropdownPosition } from '@/lib/useDropdownPosition'
import { ISSUE_STATUS, type IssueStatus } from '../issue.types'

interface StatusPickerProps {
  value: IssueStatus
  onChange: (status: IssueStatus) => void
  onOpenChange?: (open: boolean) => void
  /** Chỉ hiển thị badge, không cho bấm đổi. */
  readOnly?: boolean
}

const OPTIONS: IssueStatus[] = [
  ISSUE_STATUS.TODO,
  ISSUE_STATUS.IN_PROGRESS,
  ISSUE_STATUS.IN_REVIEW,
  ISSUE_STATUS.DONE,
]
const DROPDOWN_WIDTH = 176

/** Badge trạng thái có thể bấm để đổi ngay tại chỗ — dropdown qua Portal, cùng cơ chế với AssigneePicker. */
const StatusPicker = ({ value, onChange, onOpenChange, readOnly = false }: StatusPickerProps) => {
  const { open, coords, triggerRef, dropdownRef, toggle, close } = useDropdownPosition({
    width: DROPDOWN_WIDTH,
    estimatedHeight: 190,
    onOpenChange,
  })

  if (readOnly) {
    return <IssueStatusBadge status={value} />
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
        className="rounded-full transition-all hover:ring-2 hover:ring-brand/20 shrink-0"
      >
        <IssueStatusBadge status={value} />
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
                <IssueStatusBadge status={opt} />
                {value === opt && <Check size={14} className="text-brand shrink-0" />}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}

export default StatusPicker