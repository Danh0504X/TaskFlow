import { CheckCircle2 } from 'lucide-react'
import IssueTypeIcon from '@/components/ui/IssueTypeIcon'
import IssuePriorityBadge from '@/components/ui/IssuePriorityBadge'
import { useUpdateIssue } from '../hooks/useIssueMutations'
import type { Issue, IssuePriority } from '../issue.types'
import AssigneePicker from './AssigneePicker'

interface IssueCardProps {
  issue: Issue
  projectId: string
  onClick?: () => void
  /** Chỉ OWNER được đổi người gán (đi qua PUT /issues/:id, OWNER-only) -> MEMBER chỉ xem. */
  isOwner: boolean
  /**
   * [NEW] R1.1: Có thể kéo không? MEMBER chỉ kéo task của mình.
   * Mặc định `true` (tương thích ngược với DragOverlay không cần guard).
   */
  isDraggable?: boolean
  /** [NEW] R2.3: Tiến độ subtask hiển thị trên card. */
  subtaskStats?: { done: number; total: number }
}

// Thanh màu bên trái theo độ ưu tiên -> quét bảng Kanban nhanh hơn mà không cần đọc badge.
// Khớp đúng 4 pastel dùng cho IssuePriorityBadge để 2 tín hiệu (thanh màu + badge) đồng bộ.
const priorityAccent: Record<IssuePriority, string> = {
  URGENT: 'border-l-pastel-red-ink',
  HIGH: 'border-l-pastel-yellow-ink',
  MEDIUM: 'border-l-pastel-blue-ink',
  LOW: 'border-l-hairline',
}

const IssueCard = ({ issue, projectId, onClick, isOwner, isDraggable = true, subtaskStats }: IssueCardProps) => {
  const updateMutation = useUpdateIssue(projectId, { silent: true })

  return (
    <div
      onClick={onClick}
      className={`bg-surface border-y border-r border-hairline border-l-4 ${priorityAccent[issue.priority]} hover:border-y-ink/15 hover:border-r-ink/15 rounded-lg p-4 transition-colors ${isDraggable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
    >
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-1.5">
          <IssueTypeIcon type={issue.type} size={14} />
          <span className="text-[11px] font-bold text-brand uppercase tracking-wider">{issue.key}</span>
        </div>
      </div>

      <h4 className="text-xs font-semibold text-ink leading-relaxed mb-3.5 line-clamp-2">{issue.title}</h4>

      {issue.epicName && (
        <span className="inline-block px-2 py-0.5 bg-pastel-blue text-pastel-blue-ink rounded text-[9px] font-bold uppercase tracking-wider mb-4">
          {issue.epicName}
        </span>
      )}

      {/* [NEW] R2.3: Subtask progress badge */}
      {subtaskStats && subtaskStats.total > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted mb-3">
          <CheckCircle2 size={10} className={subtaskStats.done === subtaskStats.total ? 'text-pastel-green-ink' : 'text-muted'} />
          <span>
            {subtaskStats.done}/{subtaskStats.total}
          </span>
          <div className="flex-1 h-1 bg-canvas rounded-full overflow-hidden ml-0.5">
            <div
              className="h-full bg-pastel-green-ink rounded-full transition-all"
              style={{ width: `${Math.round((subtaskStats.done / subtaskStats.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-hairline">
        <IssuePriorityBadge priority={issue.priority} showIcon />

      <AssigneePicker
          projectId={projectId}
          value={issue.assigneeId ?? null}
          onChange={(userId) => updateMutation.mutate({ issueId: issue._id, payload: { assigneeId: userId } })}
          size={22}
          readOnly={!isOwner}
        />
      </div>
    </div>
  )
}

export default IssueCard