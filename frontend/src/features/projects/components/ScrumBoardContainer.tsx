import { useState,useMemo } from 'react'
import { CheckCircle2 } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import { useAuthStore } from '@/features/auth/authStore'
import { useSprintIssues } from '@/features/issues/hooks/useIssues'
import { useUpdateIssueStatus } from '@/features/issues/hooks/useIssueMutations'
import BoardView, { type BoardColumnDef } from '@/features/issues/components/BoardView'
import type { IssueStatus } from '@/features/issues/issue.types'
import { formatDate } from '@/lib/format'
import { useProject } from '../hooks/useProject'
import { useSprints } from '@/features/sprints/hooks/useSprints'
import { SPRINT_STATUS } from '@/features/sprints/sprint.types'
import CompleteSprintModal from '@/features/sprints/components/CompleteSprintModal'
import BoardLockedEmptyState from './BoardLockedEmptyState'

interface ScrumBoardContainerProps {
  projectId: string
  onSelectIssue: (issueKey: string) => void
  /** Chuyển sang tab Backlog trong cùng trang (dùng khi board đang khóa vì chưa có sprint ACTIVE). */
  onGoToBacklog: () => void
}

const COLUMNS: BoardColumnDef[] = [
  { status: 'TODO', title: 'Cần làm' },
  { status: 'IN_PROGRESS', title: 'Đang tiến hành' },
  { status: 'IN_REVIEW', title: 'Đang đánh giá' },
  { status: 'DONE', title: 'Hoàn thành' },
]

/**
 * Board cho project SCRUM — chỉ hiển thị issue của sprint đang ACTIVE. Khi không có sprint
 * ACTIVE, board bị khóa (xem BoardLockedEmptyState) — khớp với chốt chặn ở backend
 * (ensureIssueStatusChangeAllowed trong issueService.js) chứ không chỉ là lớp UX.
 */
const ScrumBoardContainer = ({ projectId, onSelectIssue, onGoToBacklog }: ScrumBoardContainerProps) => {
  const currentUser = useAuthStore((state) => state.user)
  const { data: project } = useProject(projectId)
  const { data: sprints, isLoading: sprintsLoading } = useSprints(projectId)
  const [isCompleteOpen, setIsCompleteOpen] = useState(false)

  const activeSprint = sprints?.find((s) => s.status === SPRINT_STATUS.ACTIVE)
  const plannedSprints = (sprints ?? []).filter((s) => s.status === SPRINT_STATUS.PLANNED)

  const { data: sprintIssues, isLoading: issuesLoading } = useSprintIssues(
    projectId,
    activeSprint?._id,
  )
  const updateStatusMutation = useUpdateIssueStatus(projectId)

  const userMemberRecord = project?.members?.find((m) => m.userId === currentUser?._id)
  const isOwner = userMemberRecord?.role === 'OWNER'

    // useMemo khóa theo `sprintIssues` (reference ổn định từ React Query) -> tránh tạo mảng
  // mới mỗi render khiến BoardView tưởng dữ liệu đổi và reset state kéo-thả cục bộ giữa
  // chừng (gây giật/nhập nhịp khi kéo-thả). Phải đặt trước mọi early-return (rules of hooks).
  const taskIssues = useMemo(
    () => (sprintIssues ?? []).filter((issue) => issue.type !== 'EPIC' && issue.type !== 'SUBTASK'),
    [sprintIssues],
  )

  if (sprintsLoading) {
    return (
      <div className="py-24 flex justify-center text-muted">
        <Spinner />
      </div>
    )
  }

  if (!activeSprint) {
    return <BoardLockedEmptyState onGoToBacklog={onGoToBacklog} />
  }

  const doneCount = taskIssues.filter((i) => i.status === 'DONE').length
  const totalCount = taskIssues.length
  const progressPercent = totalCount ? Math.round((doneCount / totalCount) * 100) : 0
  const incompleteCount = totalCount - doneCount

  const handleDragEnd = (issueId: string, status: IssueStatus, orderIndex: number) => {
    updateStatusMutation.mutate({ issueId, payload: { status, orderIndex } })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white border border-line/30 rounded-3xl shadow-sm">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-extrabold text-ink">{activeSprint.name}</h3>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[10px] font-bold uppercase tracking-wider">
              Đang chạy
            </span>
          </div>
          {activeSprint.goal && <p className="text-xs text-muted font-semibold">{activeSprint.goal}</p>}
          <p className="text-[11px] text-subtle font-semibold">
            {formatDate(activeSprint.startDate)} — {formatDate(activeSprint.endDate)}
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-[160px]">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <div className="space-y-1 flex-1">
              <div className="flex justify-between text-[10px] font-bold text-muted">
                <span>{doneCount}/{totalCount} hoàn thành</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>

          {isOwner && (
            <button
              onClick={() => setIsCompleteOpen(true)}
              className="px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all active:scale-95 shrink-0"
            >
              Kết thúc sprint
            </button>
          )}
        </div>
      </div>

      <BoardView
        issues={taskIssues}
        columns={COLUMNS}
        isLoading={issuesLoading}
        disabled={false}
        onDragEnd={handleDragEnd}
        onSelectIssue={onSelectIssue}
      />

      {isOwner && (
        <CompleteSprintModal
          open={isCompleteOpen}
          onClose={() => setIsCompleteOpen(false)}
          projectId={projectId}
          sprint={activeSprint}
          incompleteCount={incompleteCount}
          plannedSprints={plannedSprints}
        />
      )}
    </div>
  )
}

export default ScrumBoardContainer
