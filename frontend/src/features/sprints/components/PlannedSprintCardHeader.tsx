import { Calendar, ChevronDown, ChevronRight, Pencil, Play, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/format'
import type { Sprint } from '../sprint.types'

interface PlannedSprintCardHeaderProps {
  sprint: Sprint
  issueCount: number
  isOwner: boolean
  isOpen: boolean
  onToggleOpen: () => void
  hasActiveSprint: boolean
  onStartClick: () => void
  startPending: boolean
  onEditClick: () => void
  onDeleteClick: () => void
}

/** Header của 1 khung sprint PLANNED — thuần hiển thị. Sửa tên/ngày/mục tiêu giờ đi qua
 * `SprintFormModal` (bấm bút chì mở modal), không còn chỉnh sửa tại chỗ như trước. */
const PlannedSprintCardHeader = ({
  sprint,
  issueCount,
  isOwner,
  isOpen,
  onToggleOpen,
  hasActiveSprint,
  onStartClick,
  startPending,
  onEditClick,
  onDeleteClick,
}: PlannedSprintCardHeaderProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-line/10">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <button
          onClick={onToggleOpen}
          className="p-1 mt-0.5 rounded hover:bg-canvas text-muted transition-all shrink-0"
        >
          {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>

        <div className="flex-1 min-w-0 space-y-1.5">
          <h3 className="text-base font-extrabold text-ink">{sprint.name}</h3>
          {sprint.goal && <p className="text-xs text-muted font-medium">{sprint.goal}</p>}
          <p className="text-xs text-muted mt-1 font-medium flex items-center gap-1.5">
            <Calendar size={12} />
            <span>
              {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)} · {issueCount} công việc
            </span>
          </p>
        </div>
      </div>

      {isOwner && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onStartClick}
            disabled={hasActiveSprint || startPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-pastel-green text-pastel-green-ink rounded-lg text-[11px] font-bold hover:bg-pastel-green/70 transition-all disabled:opacity-40 disabled:pointer-events-none"
            title={hasActiveSprint ? 'Dự án đã có sprint đang chạy' : 'Bắt đầu sprint này'}
          >
            <Play size={12} />
            <span>Start</span>
          </button>
          <button
            onClick={onEditClick}
            className="p-1.5 rounded-lg hover:bg-canvas text-muted hover:text-ink transition-all"
            aria-label="Sửa sprint"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDeleteClick}
            className="p-1.5 rounded-lg hover:bg-pastel-red text-muted hover:text-pastel-red-ink transition-all"
            aria-label="Xóa sprint"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

export default PlannedSprintCardHeader