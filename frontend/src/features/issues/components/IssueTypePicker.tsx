import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import IssueTypeIcon from '@/components/ui/IssueTypeIcon'
import { useDropdownPosition } from '@/lib/useDropdownPosition'
import { ISSUE_TYPE, type IssueType } from '../issue.types'

interface IssueTypePickerProps {
  /** Chỉ dùng cho quick-add ở gốc cây (Epic hoặc Task) — Subtask/Bug tạo qua luồng riêng. */
  value: IssueType
  onChange: (type: IssueType) => void
  onOpenChange?: (open: boolean) => void
}

const OPTIONS: { value: IssueType; label: string }[] = [
  { value: ISSUE_TYPE.TASK, label: 'Task' },
  { value: ISSUE_TYPE.EPIC, label: 'Epic' },
]
const DROPDOWN_WIDTH = 160

/** Nút chọn loại issue (Epic/Task) cho quick-add ở trang Danh sách — cùng cơ chế portal với AssigneePicker. */
const IssueTypePicker = ({ value, onChange, onOpenChange }: IssueTypePickerProps) => {
  const { open, coords, triggerRef, dropdownRef, toggle, close } = useDropdownPosition({
    width: DROPDOWN_WIDTH,
    estimatedHeight: 120,
    onOpenChange,
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
        title="Chọn loại issue"
        className="flex items-center gap-1.5 px-2.5 py-2.5 border border-hairline rounded-lg bg-canvas hover:border-ink/25 transition-colors shrink-0"
      >
        <IssueTypeIcon type={value} size={14} />
        <ChevronDown size={12} className="text-muted" />
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'fixed', top: coords.top, left: coords.left, width: DROPDOWN_WIDTH }}
            className="z-50 bg-surface border border-hairline rounded-lg shadow-lg py-1.5"
          >
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  close()
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-ink hover:bg-canvas transition-colors"
              >
                <IssueTypeIcon type={opt.value} size={14} />
                <span className="flex-1 text-left">{opt.label}</span>
                {value === opt.value && <Check size={14} className="text-brand shrink-0" />}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}

export default IssueTypePicker