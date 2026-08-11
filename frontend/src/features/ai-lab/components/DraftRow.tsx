import { Layers, FileText, Trash2, Pencil, Sparkles, ListTree, ChevronUp, ChevronDown, CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/cn'
import Spinner from '@/components/ui/Spinner'
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
  /** Sinh Task bằng AI ngay từ epic NHÁP này — chỉ áp dụng khi draft.type==='EPIC', bỏ qua ở
   * task con (DraftTable không truyền cho hàng con). */
  onGenerateTasks?: () => void
  /** Đang có 1 turn "Sinh Task" chạy cho ĐÚNG epic này — vô hiệu nút, đổi icon thành spinner. */
  generatingTasks?: boolean
  /** Số task con đang có (chỉ epic mới có ý nghĩa) — 0/undefined thì không hiện mũi tên thu gọn. */
  childCount?: number
  /** Đang thu gọn (ẩn task con) — chỉ áp dụng khi có childCount > 0. */
  collapsed?: boolean
  onToggleCollapse?: () => void
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

/** 1 draft (Epic gốc hoặc Task con) hiển thị dạng HÀNG GỌN (1 dòng, không xếp chồng 2 dòng như
 * trước) — Task con truyền `nested` để DraftTable lồng dưới Epic cha bằng viền trái + thụt lề.
 * Bấm BẤT KỲ đâu trên hàng để chọn (không cần trúng checkbox nhỏ) — nút sửa/xoá tự chặn nổi bọt
 * (stopPropagation) để không bị chọn nhầm khi bấm.
 *
 * Rút gọn còn ~36px/hàng (trước ~64px) bằng cách: gộp mọi thông tin phụ (loại, ưu tiên, trạng
 * thái, phạm vi, nguồn) thành các icon nhỏ có tooltip thay vì badge có chữ xếp riêng 1 dòng; nút
 * sửa/xoá chỉ hiện khi rê chuột/focus (group-hover) để hàng mặc định không rối mắt — cũng là chỗ
 * trống sẵn để thêm hành động khác sau này mà không phải nới lại chiều cao hàng.
 *
 * Nút "Sinh Task bằng AI" đặt HẲN RA NGOÀI khung thẻ (sibling, không nằm trong border) — icon
 * `ListTree` (khác hẳn `Sparkles` của badge "nguồn AI" ngay trong thẻ, tránh 2 icon giống nhau
 * đứng cạnh nhau gây nhầm ý nghĩa) — luôn hiện rõ (không chờ hover) vì đây là 1 hành động chủ
 * động, khác với sửa/xoá vốn chỉ cần khi cần tới.
 *
 * Mũi tên thu gọn (trước icon loại) chỉ hiện ở epic đang có task con — bấm để ẩn/hiện tạm thời
 * task bên trong (DraftTable giữ state, KHÔNG xoá/từ chối gì), tránh danh sách dài rối mắt khi
 * 1 epic có nhiều task. */
const DraftRow = ({
  draft,
  checked,
  nested,
  onToggle,
  onEdit,
  onDelete,
  onGenerateTasks,
  generatingTasks,
  childCount,
  collapsed,
  onToggleCollapse,
}: DraftRowProps) => {
  const editable = draft.status === 'SUGGESTED'
  const deletable = draft.status !== 'ACCEPTED'
  const canGenerateTasks = draft.type === 'EPIC' && draft.status === 'SUGGESTED' && !!onGenerateTasks
  const canCollapse = draft.type === 'EPIC' && !!childCount && childCount > 0 && !!onToggleCollapse
  const status = STATUS_STYLE[draft.status]
  const type = TYPE_STYLE[draft.type]
  const TypeIcon = type.icon

  return (
    <div className="flex items-center gap-1.5">
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
          'group flex min-w-0 flex-1 items-center gap-1.5 rounded-md border pl-2 pr-1.5 py-1.5 transition-colors',
          nested ? 'bg-canvas/40' : 'bg-surface',
          checked ? 'border-ink/30 ring-1 ring-ink/10' : 'border-hairline',
          editable ? 'cursor-pointer hover:border-ink/20' : 'cursor-default',
        )}
      >
        <span className="shrink-0">
          {checked ? (
            <CheckCircle2 size={15} className="text-ink" />
          ) : (
            <Circle size={15} className={editable ? 'text-subtle' : 'text-subtle/40'} />
          )}
        </span>

        {canCollapse ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleCollapse?.()
            }}
            className="flex h-5 w-4 shrink-0 items-center justify-center rounded text-subtle transition-colors hover:bg-canvas hover:text-ink"
            aria-label={collapsed ? `Hiện ${childCount} task con` : 'Ẩn task con'}
            title={collapsed ? `Hiện ${childCount} task con` : 'Ẩn task con'}
          >
            {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <span
          title={type.label}
          className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded', type.className)}
        >
          <TypeIcon size={11} />
        </span>

        <p className="min-w-0 flex-1 truncate text-xs font-semibold leading-snug text-ink">{draft.title}</p>

        <div className="flex shrink-0 items-center gap-1">
          <IssuePriorityBadge priority={draft.priority} showLabel={false} />

          <span
            title={status.label}
            className={cn(
              'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
              status.className,
            )}
          >
            {status.label}
          </span>

          {draft.scopePreview.length > 0 && <ScopePreviewPopover lines={draft.scopePreview} compact />}

          <span
            title={draft.origin === 'AI' ? 'AI đề xuất' : 'Thêm thủ công'}
            className={cn(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded',
              draft.origin === 'AI' ? 'bg-pastel-blue text-pastel-blue-ink' : 'bg-canvas text-subtle',
            )}
          >
            {draft.origin === 'AI' ? <Sparkles size={10} /> : <span className="text-[9px] font-bold">T</span>}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 opacity-40 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
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

      {canGenerateTasks && (
        <button
          type="button"
          disabled={generatingTasks}
          onClick={() => onGenerateTasks?.()}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors',
            generatingTasks
              ? 'cursor-not-allowed border-hairline text-subtle'
              : 'border-brand/30 text-brand hover:bg-brand/10',
          )}
          aria-label="Sinh Task bằng AI cho epic này"
          title="Sinh Task bằng AI cho epic này"
        >
          {generatingTasks ? <Spinner className="h-3.5 w-3.5" /> : <ListTree size={15} />}
        </button>
      )}
    </div>
  )
}

export default DraftRow
