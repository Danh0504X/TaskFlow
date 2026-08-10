import { Layers, FileText, Trash2, Pencil, Sparkles, CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/cn'
import IssuePriorityBadge from '@/components/ui/IssuePriorityBadge'
import type { AiDraftIssue } from '../ai.types'
import ScopePreviewPopover from './ScopePreviewPopover'

interface DraftRowProps {
  draft: AiDraftIssue
  checked: boolean
  /** Task con, hiển thị lồng dưới Epic cha trong DraftTable (viền trái + thụt lề, xem đó). */
  nested?: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

const STATUS_STYLE: Record<AiDraftIssue['status'], { label: string; className: string }> = {
  SUGGESTED: { label: 'Chờ duyệt', className: 'bg-pastel-blue text-pastel-blue-ink' },
  ACCEPTED: { label: 'Đã tạo', className: 'bg-pastel-green text-pastel-green-ink' },
  REJECTED: { label: 'Đã từ chối', className: 'bg-pastel-red text-pastel-red-ink' },
}

// Epic dùng token brand, Task dùng pastel-blue — KHÔNG dùng pastel-yellow (trùng màu với
// IssuePriorityBadge mức HIGH sẽ đứng cùng hàng, gây lẫn ý nghĩa giữa "loại" và "độ ưu tiên").
const TYPE_STYLE = {
  EPIC: { label: 'Epic', icon: Layers, className: 'bg-brand/8 text-brand' },
  TASK: { label: 'Task', icon: FileText, className: 'bg-pastel-blue text-pastel-blue-ink' },
} as const

/** 1 draft (Epic gốc hoặc Task con) hiển thị dạng card — Task con truyền `nested` để DraftTable
 * lồng dưới Epic cha bằng viền trái + thụt lề. Bấm BẤT KỲ đâu trên card để chọn (không cần trúng
 * checkbox nhỏ) — nút sửa/xoá tự chặn nổi bọt (stopPropagation) để không bị chọn nhầm khi bấm. */
const DraftRow = ({ draft, checked, nested, onToggle, onEdit, onDelete }: DraftRowProps) => {
  const editable = draft.status === 'SUGGESTED'
  const deletable = draft.status !== 'ACCEPTED'
  const status = STATUS_STYLE[draft.status]
  const type = TYPE_STYLE[draft.type]
  const TypeIcon = type.icon

  return (
    <div
      onClick={editable ? onToggle : undefined}
      role={editable ? 'button' : undefined}
      tabIndex={editable ? 0 : undefined}
      onKeyDown={
        editable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onToggle()
              }
            }
          : undefined
      }
      className={cn(
        'rounded-md border p-2 transition-colors',
        nested ? 'bg-canvas/40' : 'bg-surface',
        checked ? 'border-ink/30 ring-1 ring-ink/10' : 'border-hairline',
        editable ? 'cursor-pointer hover:border-ink/20' : 'cursor-default',
      )}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0">
          {checked ? (
            <CheckCircle2 size={16} className="text-ink" />
          ) : (
            <Circle size={16} className={editable ? 'text-subtle' : 'text-subtle/40'} />
          )}
        </span>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                type.className,
              )}
            >
              <TypeIcon size={10} />
              {type.label}
            </span>
            <IssuePriorityBadge priority={draft.priority} showIcon={false} />
            <span className={cn('inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-semibold', status.className)}>
              {status.label}
            </span>
            <span
              title={draft.origin === 'AI' ? 'AI đề xuất' : 'Thêm thủ công'}
              className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded',
                draft.origin === 'AI' ? 'bg-pastel-blue text-pastel-blue-ink' : 'bg-canvas text-subtle',
              )}
            >
              {draft.origin === 'AI' ? <Sparkles size={9} /> : <span className="text-[8px] font-bold">T</span>}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-xs font-semibold leading-snug text-ink">{draft.title}</p>
            {draft.scopePreview.length > 0 && (
              <div className="shrink-0">
                <ScopePreviewPopover lines={draft.scopePreview} />
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            disabled={!editable}
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="rounded-md p-1 text-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-30"
            aria-label="Sửa draft"
          >
            <Pencil size={12} />
          </button>
          <button
            type="button"
            disabled={!deletable}
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="rounded-md p-1 text-muted transition-colors hover:bg-pastel-red hover:text-pastel-red-ink disabled:opacity-30"
            aria-label="Xoá draft"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default DraftRow
