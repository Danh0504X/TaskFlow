import { useMemo, useRef, useState } from 'react'
import { Calendar, ChevronDown, ChevronRight, Plus } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import Spinner from '@/components/ui/Spinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Button from '@/components/ui/Button'
import IssueTypeIcon from '@/components/ui/IssueTypeIcon'
import IssuePriorityBadge from '@/components/ui/IssuePriorityBadge'
import { DroppableContainer } from '@/components/ui/dnd/DroppableContainer'
import { SortableItem } from '@/components/ui/dnd/SortableItem'
import { useAuthStore } from '@/features/auth/authStore'
import { useProjectIssues } from '@/features/issues/hooks/useIssues'
import { useUpdateIssue } from '@/features/issues/hooks/useIssueMutations'
import QuickAddIssue from '@/features/issues/components/QuickAddIssue'
import AssigneePicker from '@/features/issues/components/AssigneePicker'
import { calculateNewOrderIndex } from '@/lib/dndHelpers'
import { formatDate, toDateInputValue } from '@/lib/format'
import type { Issue, UpdateIssuePayload } from '@/features/issues/issue.types'
import { useProject } from '../hooks/useProject'
import { useSprints } from '@/features/sprints/hooks/useSprints'
import { useCreateSprint, useDeleteSprint } from '@/features/sprints/hooks/useSprintMutations'
import { SPRINT_STATUS, type Sprint } from '@/features/sprints/sprint.types'
import PlannedSprintCardHeader from '@/features/sprints/components/PlannedSprintCardHeader'
import SprintFormModal from '@/features/sprints/components/SprintFormModal'

interface BacklogViewProps {
  projectId: string
  onSelectIssue: (issueKey: string) => void
  /** Chuyển sang tab Board trong cùng trang (dùng ở nút "Xem trên Board" của sprint đang chạy). */
  onGoToBoard: () => void
}

const BACKLOG_CONTAINER_ID = 'backlog'

/** 1 dòng issue trong Backlog/sprint container — dùng chung cho mọi container. */
const IssueRow = ({
  issue,
  projectId,
  isOwner,
  onSelectIssue,
}: {
  issue: Issue
  projectId: string
  isOwner: boolean
  onSelectIssue: (key: string) => void
}) => {
  const updateIssueMutation = useUpdateIssue(projectId, { silent: true })

  return (
    <div
      onClick={() => onSelectIssue(issue.key)}
      className="flex flex-wrap items-center justify-between gap-4 p-3 bg-white border border-line/15 rounded-2xl hover:bg-slate-50/50 transition-all cursor-pointer select-none"    >
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
        <AssigneePicker
          projectId={projectId}
          value={issue.assigneeId ?? null}
          onChange={(userId) => updateIssueMutation.mutate({ issueId: issue._id, payload: { assigneeId: userId } })}
          size={24}
          readOnly={!isOwner}
        />
      </div>
    </div>
  )
}

const BacklogView = ({ projectId, onSelectIssue, onGoToBoard }: BacklogViewProps) => {
  const currentUser = useAuthStore((state) => state.user)
  const { data: project } = useProject(projectId)
  const { data: sprints, isLoading: sprintsLoading } = useSprints(projectId)
  const { data: issues, isLoading: issuesLoading } = useProjectIssues(projectId)
  const updateIssueMutation = useUpdateIssue(projectId, { silent: true })
  const createMutation = useCreateSprint(projectId)
  const deleteMutation = useDeleteSprint(projectId)

  const [openContainers, setOpenContainers] = useState<Record<string, boolean>>({})
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null)
  const [deletingSprint, setDeletingSprint] = useState<Sprint | null>(null)

  const [startingSprint, setStartingSprint] = useState<Sprint | null>(null)
  const userMemberRecord = project?.members?.find((m) => m.userId === currentUser?._id)
  const isOwner = userMemberRecord?.role === 'OWNER'

  const isOpen = (id: string) => openContainers[id] ?? true
  const toggleOpen = (id: string) => setOpenContainers((prev) => ({ ...prev, [id]: !isOpen(id) }))

  // useMemo khóa theo `issues` (reference ổn định từ React Query) -> tránh tạo mảng mới
  // mỗi render, cần thiết vì `localIssues` bên dưới đồng bộ lại dựa trên so sánh reference.
  const taskIssues = useMemo(
    () =>
      (issues ?? [])
        .filter((issue) => issue.type !== 'EPIC' && issue.type !== 'SUBTASK')
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)),
    [issues],
  )

  // State local để kéo-thả mượt (di chuyển ngay lúc đang kéo, không đợi API) — đồng bộ lại
  // mỗi khi `taskIssues` đổi thật (adjust state during render, không dùng useEffect).
  const [localIssues, setLocalIssues] = useState<Issue[]>(taskIssues)
  const [syncedIssues, setSyncedIssues] = useState<Issue[]>(taskIssues)
  if (taskIssues !== syncedIssues) {
    setSyncedIssues(taskIssues)
    setLocalIssues(taskIssues)
  }

  const [activeId, setActiveId] = useState<string | null>(null)
  // Chiều rộng thật của dòng đang kéo (đo lúc bắt đầu kéo) -> áp cho DragOverlay bên dưới.
  const [activeWidth, setActiveWidth] = useState<number | null>(null)
  const lastOverId = useRef<string | null>(null)

  const activeSprint = sprints?.find((s) => s.status === SPRINT_STATUS.ACTIVE)
  const plannedSprints = (sprints ?? [])
    .filter((s) => s.status === SPRINT_STATUS.PLANNED)
    .sort((a, b) => a.orderIndex - b.orderIndex)

  // Danh sách hiển thị/kéo-thả lấy từ `localIssues` (phản ánh vị trí đang kéo dở);
  // `taskIssues` chỉ dùng làm mốc gốc từ server (đồng bộ + so sánh lúc thả).
  const issuesOf = (sprintId: string | null) =>
    localIssues.filter((i) => (i.sprintId ?? null) === sprintId)

  const backlogIssues = issuesOf(null)
  const activeSprintIssues = activeSprint ? issuesOf(activeSprint._id) : []

  // Container id dùng cho DnD: 'backlog', sprintId của sprint đang ACTIVE (nếu có), hoặc
  // sprintId của 1 sprint PLANNED. Sprint ACTIVE tham gia được cả kéo ra lẫn kéo vào.
  const containerIds = [
    BACKLOG_CONTAINER_ID,
    ...(activeSprint ? [activeSprint._id] : []),
    ...plannedSprints.map((s) => s._id),
  ]

  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 5 } })
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  const sensors = useSensors(mouseSensor, touchSensor)
  // Chỉ OWNER được kéo-thả ở Backlog (việc gán issue vào sprint là hoạt động lập kế hoạch);
  // MEMBER xem được nhưng không đăng ký sensor nào -> không thể khởi tạo kéo.
  const activeSensors = isOwner ? sensors : []

  const resolveTargetContainer = (overId: string): string => {
    if (containerIds.includes(overId)) return overId
    const overIssue = localIssues.find((i) => i._id === overId)
    return overIssue ? (overIssue.sprintId ?? BACKLOG_CONTAINER_ID) : BACKLOG_CONTAINER_ID
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    // Lấy đúng chiều rộng thật của dòng đang kéo -> DragOverlay (render ở portal, không kế
    // thừa được chiều rộng của khung chứa) hiển thị khớp kích thước thay vì cố định to/nhỏ hơn.
    setActiveWidth(event.active.rect.current.initial?.width ?? null)
    lastOverId.current = null
  }

  // Di chuyển card ngay khi đang kéo qua container/vị trí khác — cho cảm giác mượt như Board,
  // chưa gọi API, chỉ cập nhật state cục bộ để hiển thị.
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeIdStr = active.id as string
    const overId = over.id as string
    if (activeIdStr === overId) return

    // Tối ưu hóa: tránh re-render liên tục nếu chuột di chuyển nhanh trong cùng 1 card
    if (lastOverId.current === overId) return
    lastOverId.current = overId

    const activeIssue = localIssues.find((i) => i._id === activeIdStr)
    if (!activeIssue) return

    const targetContainer = resolveTargetContainer(overId)

    setLocalIssues((prev) => {
      const destIssues = prev
        .filter((i) => (i.sprintId ?? BACKLOG_CONTAINER_ID) === targetContainer && i._id !== activeIdStr)
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))

      let targetIndex = destIssues.length
      if (!containerIds.includes(overId)) {
        const overIndex = destIssues.findIndex((i) => i._id === overId)
        if (overIndex !== -1) targetIndex = overIndex
      }

      const newOrder = calculateNewOrderIndex(destIssues, targetIndex)

      return prev.map((item) =>
        item._id === activeIdStr
          ? {
            ...item,
            orderIndex: newOrder,
            sprintId: targetContainer === BACKLOG_CONTAINER_ID ? null : targetContainer,
          }
          : item,
      )
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event
    const issueId = active.id as string

    const finalIssue = localIssues.find((i) => i._id === issueId)
    if (finalIssue) {
      const originalIssue = taskIssues.find((i) => i._id === issueId)
      const currentContainer = originalIssue ? (originalIssue.sprintId ?? BACKLOG_CONTAINER_ID) : BACKLOG_CONTAINER_ID
      const finalContainer = finalIssue.sprintId ?? BACKLOG_CONTAINER_ID

      // Chỉ gọi API nếu thực sự có thay đổi về container hoặc vị trí.
      if (originalIssue?.orderIndex !== finalIssue.orderIndex || currentContainer !== finalContainer) {
        // Chỉ đổi sprintId/orderIndex — KHÔNG đụng status (Jira-style: đổi chỗ không đổi trạng thái).
        const payload: UpdateIssuePayload = { orderIndex: finalIssue.orderIndex ?? 0 }
        if (currentContainer !== finalContainer) {
          payload.sprintId = finalContainer === BACKLOG_CONTAINER_ID ? null : finalContainer
        }
        updateIssueMutation.mutate({ issueId, payload })
      }
    }

    setActiveId(null)
    setActiveWidth(null)
    lastOverId.current = null
  }

  const handleDragCancel = () => {
    // Reset lại localIssues nếu kéo bị hủy bỏ (vd nhấn Esc).
    setLocalIssues(taskIssues)
    setActiveId(null)
    setActiveWidth(null)
    lastOverId.current = null
  }

  const activeIssue = localIssues.find((i) => i._id === activeId)

  // Bấm "Bắt đầu" chỉ mở modal xác nhận (SprintFormModal mode="start") — không start thẳng nữa.
  const handleStartClick = (sprint: Sprint) => setStartingSprint(sprint)

  // Tên sprint mới không trùng dù đã xoá sprint ở giữa: lấy số lớn nhất trong các tên dạng
  // "Sprint X" hiện có (kể cả sprint đã ACTIVE/COMPLETED, chỉ loại sprint đã xoá mềm — vốn
  // không còn trong `sprints`) rồi +1; nếu không parse được tên nào thì fallback = tổng số
  // sprint hiện có + 1.
  const nextSprintName = (allSprints: Sprint[]): string => {
    const parsedNumbers = allSprints
      .map((s) => /^Sprint (\d+)$/i.exec(s.name.trim())?.[1])
      .filter((n): n is string => !!n)
      .map(Number)
    if (parsedNumbers.length > 0) {
      return `Sprint ${Math.max(...parsedNumbers) + 1}`
    }
    return `Sprint ${allSprints.length + 1}`
  }

  // Ngày mặc định cho sprint mới: chưa có sprint PLANNED nào -> bắt đầu hôm nay; đã có thì
  // nối tiếp ngay sau sprint PLANNED có endDate muộn nhất (mỗi sprint mặc định 2 tuần).
  const nextSprintDates = (existingPlanned: Sprint[]): { start: Date; end: Date } => {
    if (existingPlanned.length === 0) {
      const start = new Date()
      const end = new Date(start)
      end.setDate(end.getDate() + 14)
      return { start, end }
    }
    const latest = existingPlanned.reduce((acc, s) =>
      new Date(s.endDate).getTime() > new Date(acc.endDate).getTime() ? s : acc,
    )
    const start = new Date(latest.endDate)
    const end = new Date(start)
    end.setDate(end.getDate() + 14)
    return { start, end }
  }

  // Tạo sprint NGAY khi bấm nút — không qua modal, không bước xác nhận, không tự mở gì
  // thêm sau khi tạo xong (sprint mới chỉ đơn giản xuất hiện trong danh sách).
  const handleCreateSprint = () => {
    const { start, end } = nextSprintDates(plannedSprints)

    createMutation.mutate({
      name: nextSprintName(sprints ?? []),
      startDate: toDateInputValue(start.toISOString()),
      endDate: toDateInputValue(end.toISOString()),
    })
  }

  if (sprintsLoading || issuesLoading) {
    return (
      <div className="py-12 flex justify-center text-muted">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <DndContext
        sensors={activeSensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {/* Sprint đang chạy — kéo-thả được (kể cả kéo ra ngoài); sửa/xóa/start vẫn ở Board. */}
        {activeSprint && (
          <DroppableContainer
            id={activeSprint._id}
            className="bg-white border-2 border-blue-200 rounded-3xl p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-line/10">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleOpen(activeSprint._id)}
                  className="p-1 mt-0.5 rounded hover:bg-slate-100 text-muted transition-all shrink-0"
                >
                  {isOpen(activeSprint._id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
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
              </div>
              <button
                onClick={onGoToBoard}
                className="text-xs font-bold text-brand hover:underline shrink-0"
              >
                Xem trên Board →
              </button>
            </div>

            {isOpen(activeSprint._id) && (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                <SortableContext items={activeSprintIssues.map((i) => i._id)} strategy={verticalListSortingStrategy}>
                  {activeSprintIssues.map((issue) => (
                    <SortableItem key={issue._id} id={issue._id} disabled={!isOwner}>
                      <IssueRow issue={issue} projectId={projectId} isOwner={isOwner} onSelectIssue={onSelectIssue} />
                    </SortableItem>
                  ))}
                </SortableContext>
                {activeSprintIssues.length === 0 && (
                  <p className="text-xs text-subtle italic py-4 text-center">Sprint chưa có công việc nào. Kéo công việc vào đây.</p>
                )}
              </div>
            )}
          </DroppableContainer>
        )}

        {plannedSprints.map((sprint) => {
          const sprintIssues = issuesOf(sprint._id)
          return (
            <DroppableContainer
              key={sprint._id}
              id={sprint._id}
              className="bg-white border border-line/30 rounded-3xl p-6 shadow-sm"
            >
              <PlannedSprintCardHeader
                sprint={sprint}
                issueCount={sprintIssues.length}
                isOwner={isOwner}
                isOpen={isOpen(sprint._id)}
                onToggleOpen={() => toggleOpen(sprint._id)}
                hasActiveSprint={!!activeSprint}
                onStartClick={() => handleStartClick(sprint)}
                startPending={!!startingSprint}
                onEditClick={() => setEditingSprint(sprint)}
                onDeleteClick={() => setDeletingSprint(sprint)}
              />

              {isOpen(sprint._id) && (
                <div className="space-y-2.5">
                  <div className="space-y-2.5 min-h-[50px] max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                    <SortableContext items={sprintIssues.map((i) => i._id)} strategy={verticalListSortingStrategy}>
                      {sprintIssues.map((issue) => (
                        <SortableItem key={issue._id} id={issue._id} disabled={!isOwner}>
                          <IssueRow issue={issue} projectId={projectId} isOwner={isOwner} onSelectIssue={onSelectIssue} />
                        </SortableItem>
                      ))}
                    </SortableContext>
                  </div>
                  {isOwner && (
                    <QuickAddIssue
                      projectId={projectId}
                      targetSprintId={sprint._id}
                      nextOrderIndex={calculateNewOrderIndex(sprintIssues, sprintIssues.length)}
                    />
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

            {isOwner && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateSprint}
                loading={createMutation.isPending}
                title="Tạo sprint mới"
              >
                <Plus size={14} />
                <span>Tạo sprint</span>
              </Button>
            )}
          </div>

          {isOpen(BACKLOG_CONTAINER_ID) && (
            <div className="space-y-2.5">
              <div className="space-y-2.5 min-h-[50px] max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                <SortableContext items={backlogIssues.map((i) => i._id)} strategy={verticalListSortingStrategy}>
                  {backlogIssues.map((issue) => (
                    <SortableItem key={issue._id} id={issue._id} disabled={!isOwner}>
                      <IssueRow issue={issue} projectId={projectId} isOwner={isOwner} onSelectIssue={onSelectIssue} />
                    </SortableItem>
                  ))}
                </SortableContext>
              </div>
              {isOwner && (
                <QuickAddIssue
                  projectId={projectId}
                  targetSprintId={null}
                  nextOrderIndex={calculateNewOrderIndex(backlogIssues, backlogIssues.length)}
                />
              )}
            </div>
          )}
        </DroppableContainer>

        <DragOverlay adjustScale={false}>
          {activeId && activeIssue ? (
            <div
              style={activeWidth ? { width: activeWidth } : undefined}
              className="opacity-95 shadow-xl cursor-grabbing select-none pointer-events-none"
            >
              <IssueRow issue={activeIssue} projectId={projectId} isOwner={isOwner} onSelectIssue={() => { }} />
            </div>
          ) : null}
        </DragOverlay>
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

      {startingSprint && (
        <SprintFormModal
          key={`start-${startingSprint._id}`}
          mode="start"
          projectId={projectId}
          sprint={startingSprint}
          onClose={() => setStartingSprint(null)}
        />
      )}

      {editingSprint && (
        <SprintFormModal
          key={`edit-${editingSprint._id}`}
          mode="edit"
          projectId={projectId}
          sprint={editingSprint}
          onClose={() => setEditingSprint(null)}
        />
      )}
    </div>
  )
}

export default BacklogView