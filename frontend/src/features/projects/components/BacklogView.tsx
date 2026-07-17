import { useState } from 'react'
import { Calendar, ChevronDown, ChevronRight, Plus } from 'lucide-react'
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import Avatar from '@/components/ui/Avatar'
import Spinner from '@/components/ui/Spinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import IssueTypeIcon from '@/components/ui/IssueTypeIcon'
import IssuePriorityBadge from '@/components/ui/IssuePriorityBadge'
import { DroppableContainer } from '@/components/ui/dnd/DroppableContainer'
import { SortableItem } from '@/components/ui/dnd/SortableItem'
import { useAuthStore } from '@/features/auth/authStore'
import { useProjectIssues } from '@/features/issues/hooks/useIssues'
import { useUpdateIssue } from '@/features/issues/hooks/useIssueMutations'
import { calculateNewOrderIndex } from '@/lib/dndHelpers'
import { formatDate, toDateInputValue } from '@/lib/format'
import type { Issue, UpdateIssuePayload } from '@/features/issues/issue.types'
import { useProject } from '../hooks/useProject'
import { useSprints } from '@/features/sprints/hooks/useSprints'
import { useCreateSprint, useDeleteSprint, useStartSprint } from '@/features/sprints/hooks/useSprintMutations'
import { SPRINT_STATUS, type Sprint } from '@/features/sprints/sprint.types'
import PlannedSprintCardHeader from '@/features/sprints/components/PlannedSprintCardHeader'

interface BacklogViewProps {
  projectId: string
  onSelectIssue: (issueKey: string) => void
  /** Chuyển sang tab Board trong cùng trang (dùng ở nút "Xem trên Board" của sprint đang chạy). */
  onGoToBoard: () => void
}

const BACKLOG_CONTAINER_ID = 'backlog'

/** 1 dòng issue trong Backlog/sprint container — dùng chung cho mọi container. */
const IssueRow = ({ issue, onSelectIssue }: { issue: Issue; onSelectIssue: (key: string) => void }) => (
  <div
    onClick={() => onSelectIssue(issue.key)}
    className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-white border border-line/15 rounded-2xl hover:bg-slate-50/50 transition-all cursor-pointer select-none"
  >
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <IssueTypeIcon type={issue.type} size={14} />
      <span className="text-xs font-bold text-brand flex-shrink-0">{issue.key}</span>
      <p className="text-xs font-semibold text-ink truncate flex-grow max-w-lg">{issue.title}</p>
      {issue.epicName && (
        <span className="px-2 py-0.5 bg-brand/5 border border-brand/10 text-brand rounded text-[9px] font-bold uppercase tracking-wider flex-shrink-0">
          {issue.epicName}
        </span>
      )}
    </div>
    <div className="flex items-center gap-3.5">
      <IssuePriorityBadge priority={issue.priority} showIcon={false} />
      {issue.assignee ? (
        <Avatar src={issue.assignee.avatarUrl} name={issue.assignee.fullName} size={24} />
      ) : (
        <div className="w-6 h-6 rounded-full bg-slate-100 border border-dashed flex items-center justify-center text-subtle text-[8px] font-bold">
          --
        </div>
      )}
    </div>
  </div>
)

/**
 * Backlog thật (thay ProjectBacklogTab.tsx cũ — nơi từng giả lập theo `status` issue thay
 * vì dùng Sprint thật). Gồm: 1 khối "Sprint đang chạy" (read-only, pin nổi bật) nếu có,
 * N khối sprint PLANNED (sửa/xóa/start), và 1 khối Backlog. Kéo-thả giữa Backlog <-> sprint
 * PLANNED chỉ đổi `sprintId`/`orderIndex`, KHÔNG đụng `status` (giữ nguyên trạng thái —
 * Jira-style). Chỉ OWNER được thao tác (tạo/sửa/xóa/start sprint, kéo-thả); MEMBER chỉ xem.
 */
const BacklogView = ({ projectId, onSelectIssue, onGoToBoard }: BacklogViewProps) => {
  const currentUser = useAuthStore((state) => state.user)
  const { data: project } = useProject(projectId)
  const { data: sprints, isLoading: sprintsLoading } = useSprints(projectId)
  const { data: issues, isLoading: issuesLoading } = useProjectIssues(projectId)
  const updateIssueMutation = useUpdateIssue(projectId)
  const createMutation = useCreateSprint(projectId)
  const startMutation = useStartSprint(projectId)
  const deleteMutation = useDeleteSprint(projectId)

  const [openContainers, setOpenContainers] = useState<Record<string, boolean>>({})
  const [editingSprintId, setEditingSprintId] = useState<string | null>(null)
  const [deletingSprint, setDeletingSprint] = useState<Sprint | null>(null)
  const [startWarningSprint, setStartWarningSprint] = useState<Sprint | null>(null)

  const userMemberRecord = project?.members?.find((m) => m.userId === currentUser?._id)
  const isOwner = userMemberRecord?.role === 'OWNER'

  const isOpen = (id: string) => openContainers[id] ?? true
  const toggleOpen = (id: string) => setOpenContainers((prev) => ({ ...prev, [id]: !isOpen(id) }))

  const taskIssues = (issues ?? [])
    .filter((issue) => issue.type !== 'EPIC' && issue.type !== 'SUBTASK')
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))

  const activeSprint = sprints?.find((s) => s.status === SPRINT_STATUS.ACTIVE)
  const plannedSprints = (sprints ?? [])
    .filter((s) => s.status === SPRINT_STATUS.PLANNED)
    .sort((a, b) => a.orderIndex - b.orderIndex)

  const issuesOf = (sprintId: string | null) =>
    taskIssues.filter((i) => (i.sprintId ?? null) === sprintId)

  const backlogIssues = issuesOf(null)
  const activeSprintIssues = activeSprint ? issuesOf(activeSprint._id) : []

  // Container id dùng cho DnD: 'backlog' hoặc sprintId của 1 sprint PLANNED.
  const containerIds = [BACKLOG_CONTAINER_ID, ...plannedSprints.map((s) => s._id)]

  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 5 } })
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  const sensors = useSensors(mouseSensor, touchSensor)
  // Chỉ OWNER được kéo-thả ở Backlog (việc gán issue vào sprint là hoạt động lập kế hoạch);
  // MEMBER xem được nhưng không đăng ký sensor nào -> không thể khởi tạo kéo.
  const activeSensors = isOwner ? sensors : []

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const issueId = active.id as string
    const activeIssue = taskIssues.find((i) => i._id === issueId)
    if (!activeIssue) return

    let targetContainer = over.id as string
    if (!containerIds.includes(targetContainer)) {
      const overIssue = taskIssues.find((i) => i._id === over.id)
      targetContainer = overIssue ? (overIssue.sprintId ?? BACKLOG_CONTAINER_ID) : BACKLOG_CONTAINER_ID
    }

    const currentContainer = activeIssue.sprintId ?? BACKLOG_CONTAINER_ID

    const destIssues = taskIssues
      .filter((i) => (i.sprintId ?? BACKLOG_CONTAINER_ID) === targetContainer && i._id !== issueId)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))

    let targetIndex = destIssues.length
    if (!containerIds.includes(over.id as string)) {
      const overIndex = destIssues.findIndex((i) => i._id === over.id)
      if (overIndex !== -1) targetIndex = overIndex
    }

    const newOrder = calculateNewOrderIndex(destIssues, targetIndex)

    // Chỉ đổi sprintId/orderIndex — KHÔNG đụng status (Jira-style: đổi chỗ không đổi trạng thái).
    const payload: UpdateIssuePayload = { orderIndex: newOrder }
    if (currentContainer !== targetContainer) {
      payload.sprintId = targetContainer === BACKLOG_CONTAINER_ID ? null : targetContainer
    }

    updateIssueMutation.mutate({ issueId, payload })
  }

  const handleStartClick = (sprint: Sprint) => {
    const count = issuesOf(sprint._id).length
    if (count === 0) {
      setStartWarningSprint(sprint)
      return
    }
    startMutation.mutate(sprint._id)
  }

  // Tạo sprint NGAY khi bấm nút — không qua modal. Tên mặc định "Sprint N" theo thứ tự,
  // ngày mặc định bắt đầu hôm nay và kết thúc sau 2 tuần; người dùng chỉnh lại trực tiếp
  // trong khung (tự vào chế độ sửa ngay sau khi tạo xong).
  const handleCreateSprint = () => {
    const start = new Date()
    const end = new Date()
    end.setDate(end.getDate() + 14)

    createMutation.mutate(
      {
        name: `Sprint ${(sprints?.length ?? 0) + 1}`,
        startDate: toDateInputValue(start.toISOString()),
        endDate: toDateInputValue(end.toISOString()),
      },
      { onSuccess: (created) => setEditingSprintId(created._id) },
    )
  }

  if (sprintsLoading || issuesLoading) {
    return (
      <div className="py-12 flex justify-center text-muted">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="flex justify-end">
          <button
            onClick={handleCreateSprint}
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand text-white rounded-xl text-xs font-bold shadow-lg shadow-brand/20 hover:bg-brand-light transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Plus size={15} />
            <span>Tạo sprint</span>
          </button>
        </div>
      )}

      {/* Sprint đang chạy — chỉ xem, thao tác thật ở tab Board. */}
      {activeSprint && (
        <div className="bg-white border-2 border-blue-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-line/10">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-extrabold text-ink">{activeSprint.name}</h3>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  Đang chạy
                </span>
              </div>
              <p className="text-xs text-muted mt-1 font-medium flex items-center gap-1.5">
                <Calendar size={12} />
                <span>
                  {formatDate(activeSprint.startDate)} — {formatDate(activeSprint.endDate)} · {activeSprintIssues.length} công việc
                </span>
              </p>
            </div>
            <button
              onClick={onGoToBoard}
              className="text-xs font-bold text-brand hover:underline shrink-0"
            >
              Xem trên Board →
            </button>
          </div>
          <div className="space-y-2.5">
            {activeSprintIssues.map((issue) => (
              <IssueRow key={issue._id} issue={issue} onSelectIssue={onSelectIssue} />
            ))}
            {activeSprintIssues.length === 0 && (
              <p className="text-xs text-subtle italic py-4 text-center">Sprint chưa có công việc nào.</p>
            )}
          </div>
        </div>
      )}

      <DndContext sensors={activeSensors} onDragEnd={handleDragEnd}>
        {plannedSprints.map((sprint) => {
          const sprintIssues = issuesOf(sprint._id)
          return (
            <DroppableContainer
              key={sprint._id}
              id={sprint._id}
              className="bg-white border border-line/30 rounded-3xl p-6 shadow-sm"
            >
              <PlannedSprintCardHeader
                projectId={projectId}
                sprint={sprint}
                issueCount={sprintIssues.length}
                isOwner={isOwner}
                isOpen={isOpen(sprint._id)}
                onToggleOpen={() => toggleOpen(sprint._id)}
                isEditing={editingSprintId === sprint._id}
                onToggleEdit={() => setEditingSprintId((prev) => (prev === sprint._id ? null : sprint._id))}
                hasActiveSprint={!!activeSprint}
                onStartClick={() => handleStartClick(sprint)}
                startPending={startMutation.isPending}
                onDeleteClick={() => setDeletingSprint(sprint)}
              />

              {isOpen(sprint._id) && (
                <div className="space-y-2.5 min-h-[50px]">
                  <SortableContext items={sprintIssues.map((i) => i._id)} strategy={verticalListSortingStrategy}>
                    {sprintIssues.map((issue) => (
                      <SortableItem key={issue._id} id={issue._id} disabled={!isOwner}>
                        <IssueRow issue={issue} onSelectIssue={onSelectIssue} />
                      </SortableItem>
                    ))}
                  </SortableContext>
                  {sprintIssues.length === 0 && (
                    <p className="text-xs text-subtle italic py-4 text-center">Kéo công việc từ Backlog vào đây.</p>
                  )}
                </div>
              )}
            </DroppableContainer>
          )
        })}

        <DroppableContainer id={BACKLOG_CONTAINER_ID} className="bg-white border border-line/30 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-line/10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleOpen(BACKLOG_CONTAINER_ID)}
                className="p-1 rounded hover:bg-slate-100 text-muted transition-all"
              >
                {isOpen(BACKLOG_CONTAINER_ID) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
              <div>
                <h3 className="text-base font-extrabold text-ink">Bể công việc (Backlog)</h3>
                <p className="text-xs text-muted mt-1 font-medium">{backlogIssues.length} công việc chưa lên kế hoạch</p>
              </div>
            </div>
          </div>

          {isOpen(BACKLOG_CONTAINER_ID) && (
            <div className="space-y-2.5 min-h-[50px]">
              <SortableContext items={backlogIssues.map((i) => i._id)} strategy={verticalListSortingStrategy}>
                {backlogIssues.map((issue) => (
                  <SortableItem key={issue._id} id={issue._id} disabled={!isOwner}>
                    <IssueRow issue={issue} onSelectIssue={onSelectIssue} />
                  </SortableItem>
                ))}
              </SortableContext>
              {backlogIssues.length === 0 && (
                <p className="text-xs text-subtle italic py-4 text-center">Backlog trống.</p>
              )}
            </div>
          )}
        </DroppableContainer>
      </DndContext>

      {plannedSprints.length === 0 && !activeSprint && (
        <p className="text-xs text-subtle italic text-center py-6">
          Chưa có sprint nào. {isOwner && 'Bấm "Tạo sprint" để bắt đầu lập kế hoạch.'}
        </p>
      )}

      <ConfirmDialog
        open={!!deletingSprint}
        title="Xóa sprint"
        message={`Xóa sprint "${deletingSprint?.name}"? Các công việc đang trong sprint này sẽ được đưa về Backlog (giữ nguyên trạng thái).`}
        confirmText="Xóa sprint"
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deletingSprint) return
          deleteMutation.mutate(deletingSprint._id, { onSuccess: () => setDeletingSprint(null) })
        }}
        onClose={() => setDeletingSprint(null)}
      />

      <ConfirmDialog
        open={!!startWarningSprint}
        title="Sprint chưa có công việc nào"
        message={`Sprint "${startWarningSprint?.name}" hiện chưa có công việc nào. Bạn vẫn muốn bắt đầu?`}
        confirmText="Vẫn bắt đầu"
        loading={startMutation.isPending}
        onConfirm={() => {
          if (!startWarningSprint) return
          startMutation.mutate(startWarningSprint._id, { onSuccess: () => setStartWarningSprint(null) })
        }}
        onClose={() => setStartWarningSprint(null)}
      />
    </div>
  )
}

export default BacklogView
