import { useState } from 'react'
import { Calendar, Check, ChevronDown, ChevronRight, Pencil, Play, Trash2 } from 'lucide-react'
import { toDateInputValue } from '@/lib/format'
import { useUpdateSprint } from '../hooks/useSprintMutations'
import type { Sprint } from '../sprint.types'

interface PlannedSprintCardHeaderProps {
  projectId: string
  sprint: Sprint
  issueCount: number
  isOwner: boolean
  isOpen: boolean
  onToggleOpen: () => void
  isEditing: boolean
  onToggleEdit: () => void
  hasActiveSprint: boolean
  onStartClick: () => void
  startPending: boolean
  onDeleteClick: () => void
}

const inlineInputClass =
  'bg-slate-50 border border-line/25 rounded-lg px-2.5 py-1 text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none'

/**
 * Header của 1 khung sprint PLANNED — có 2 chế độ:
 * - Xem: tên/mục tiêu/ngày hiển thị dạng text như bình thường.
 * - Sửa (bấm bút chì): các trường trên chuyển thành input ngay tại chỗ, tự lưu khi rời khỏi
 *   ô (name/goal: onBlur; ngày: onChange) — không có modal, không cần nút "Lưu" riêng.
 */
const PlannedSprintCardHeader = ({
  projectId,
  sprint,
  issueCount,
  isOwner,
  isOpen,
  onToggleOpen,
  isEditing,
  onToggleEdit,
  hasActiveSprint,
  onStartClick,
  startPending,
  onDeleteClick,
}: PlannedSprintCardHeaderProps) => {
  const updateMutation = useUpdateSprint(projectId)

  // State cục bộ cho các ô đang gõ dở — đồng bộ lại từ `sprint` mỗi khi nó đổi (vd sau khi
  // autosave field khác thành công), trừ khi field đó khác giá trị đã lưu (đang gõ dở).
  const [name, setName] = useState(sprint.name)
  const [goal, setGoal] = useState(sprint.goal)
  const [startDate, setStartDate] = useState(toDateInputValue(sprint.startDate))
  const [endDate, setEndDate] = useState(toDateInputValue(sprint.endDate))
  const [dateError, setDateError] = useState<string | null>(null)
  const [syncedSprint, setSyncedSprint] = useState(sprint)

  if (sprint !== syncedSprint) {
    setSyncedSprint(sprint)
    setName(sprint.name)
    setGoal(sprint.goal)
    setStartDate(toDateInputValue(sprint.startDate))
    setEndDate(toDateInputValue(sprint.endDate))
    setDateError(null)
  }

  const commitName = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setName(sprint.name) // không cho lưu tên rỗng -> trả lại giá trị cũ
      return
    }
    if (trimmed !== sprint.name) {
      updateMutation.mutate({ sprintId: sprint._id, payload: { name: trimmed } })
    }
  }

  const commitGoal = () => {
    if (goal !== sprint.goal) {
      updateMutation.mutate({ sprintId: sprint._id, payload: { goal } })
    }
  }

  const commitDates = (nextStart: string, nextEnd: string) => {
    if (new Date(nextEnd) <= new Date(nextStart)) {
      setDateError('Ngày kết thúc phải sau ngày bắt đầu')
      return
    }
    setDateError(null)

    const payload: { startDate?: string; endDate?: string } = {}
    if (nextStart !== toDateInputValue(sprint.startDate)) payload.startDate = nextStart
    if (nextEnd !== toDateInputValue(sprint.endDate)) payload.endDate = nextEnd
    if (Object.keys(payload).length > 0) {
      updateMutation.mutate({ sprintId: sprint._id, payload })
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-line/10">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <button
          onClick={onToggleOpen}
          className="p-1 mt-0.5 rounded hover:bg-slate-100 text-muted transition-all shrink-0"
        >
          {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>

        <div className="flex-1 min-w-0 space-y-1.5">
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitName}
              className={`${inlineInputClass} text-sm font-extrabold text-ink w-full max-w-xs`}
              placeholder="Tên sprint"
            />
          ) : (
            <h3 className="text-base font-extrabold text-ink">{sprint.name}</h3>
          )}

          {isEditing ? (
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              onBlur={commitGoal}
              className={`${inlineInputClass} w-full max-w-md`}
              placeholder="Mục tiêu (không bắt buộc)"
            />
          ) : (
            sprint.goal && <p className="text-xs text-muted font-medium">{sprint.goal}</p>
          )}

          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  commitDates(e.target.value, endDate)
                }}
                className={inlineInputClass}
              />
              <span className="text-xs text-muted">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  commitDates(startDate, e.target.value)
                }}
                className={inlineInputClass}
              />
            </div>
          ) : (
            <p className="text-xs text-muted mt-1 font-medium flex items-center gap-1.5">
              <Calendar size={12} />
              <span>
                {toDateInputValue(sprint.startDate)} — {toDateInputValue(sprint.endDate)} · {issueCount} công việc
              </span>
            </p>
          )}

          {dateError && <p className="text-[10px] text-red-500 font-semibold">{dateError}</p>}
        </div>
      </div>

      {isOwner && (
        <div className="flex items-center gap-2 shrink-0">
          {!isEditing && (
            <button
              onClick={onStartClick}
              disabled={hasActiveSprint || startPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[11px] font-bold hover:bg-emerald-100 transition-all disabled:opacity-40 disabled:pointer-events-none"
              title={hasActiveSprint ? 'Dự án đã có sprint đang chạy' : 'Bắt đầu sprint này'}
            >
              <Play size={12} />
              <span>Start</span>
            </button>
          )}
          <button
            onClick={onToggleEdit}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-muted hover:text-ink transition-all"
            aria-label={isEditing ? 'Xong' : 'Sửa sprint'}
          >
            {isEditing ? <Check size={14} /> : <Pencil size={14} />}
          </button>
          {!isEditing && (
            <button
              onClick={onDeleteClick}
              className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-600 transition-all"
              aria-label="Xóa sprint"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default PlannedSprintCardHeader
