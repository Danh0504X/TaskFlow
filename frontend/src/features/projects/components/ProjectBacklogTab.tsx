import { useState } from 'react'
import { Calendar, ChevronDown, ChevronRight } from 'lucide-react'
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
import IssueTypeIcon from '@/components/ui/IssueTypeIcon'
import IssuePriorityBadge from '@/components/ui/IssuePriorityBadge'
import { useProjectIssues } from '@/features/issues/hooks/useIssues'
import { useUpdateIssue } from '@/features/issues/hooks/useIssueMutations'
import { calculateNewOrderIndex } from '@/lib/dndHelpers'
import { DroppableContainer } from '@/components/ui/dnd/DroppableContainer'
import { SortableItem } from '@/components/ui/dnd/SortableItem'
import type { Issue } from '@/features/issues/issue.types'

interface ProjectBacklogTabProps {
  projectId: string
  onSelectIssue: (issueKey: string) => void
}

/** Backlog gộp: issue DONE/IN_REVIEW/IN_PROGRESS xem như "Sprint đang chạy", còn lại là bể Backlog.
 * Chỉ vận hành trên Task -> Epic chỉ là container tổ chức, hiển thị ở tab Danh sách. */
const ProjectBacklogTab = ({ projectId, onSelectIssue }: ProjectBacklogTabProps) => {
  const { data: issues, isLoading } = useProjectIssues(projectId)
  const updateIssueMutation = useUpdateIssue(projectId)
  const [sprintOpen, setSprintOpen] = useState(true)
  const [backlogOpen, setBacklogOpen] = useState(true)

  // Lọc chỉ hiển thị các task/bug, loại trừ Epic và Subtask
  const taskIssues = (issues ?? [])
    .filter((issue) => issue.type !== 'EPIC' && issue.type !== 'SUBTASK')
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))

  const sprintIssues = taskIssues.filter((i) => i.status !== 'TODO')
  const backlogIssues = taskIssues.filter((i) => i.status === 'TODO')

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5, // Chỉ nhận diện kéo thả khi di chuyển chuột > 5px -> click chọn task hoạt động bình thường
    },
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250, // Nhấn giữ 250ms trên điện thoại mới kéo thả
      tolerance: 5,
    },
  })
  const sensors = useSensors(mouseSensor, touchSensor)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    // Tối ưu hóa: Nếu click chuột hoặc thả ngay tại chỗ cũ thì không gọi API cập nhật
    if (active.id === over.id) return

    const issueId = active.id as string
    const activeIssue = taskIssues.find((i) => i._id === issueId)
    if (!activeIssue) return

    // Xác định container đích ("sprint-active" hoặc "backlog")
    let targetContainer = over.id as string
    
    // Nếu over.id là một issue cụ thể, ta tìm container chứa issue đó
    if (over.id !== 'sprint-active' && over.id !== 'backlog') {
      const overIssue = taskIssues.find((i) => i._id === over.id)
      if (overIssue) {
        targetContainer = overIssue.status === 'TODO' ? 'backlog' : 'sprint-active'
      }
    }

    const isTargetSprint = targetContainer === 'sprint-active'
    
    // Lấy danh sách issue ở container đích
    const destIssues = (isTargetSprint ? sprintIssues : backlogIssues)
      .filter((i) => i._id !== issueId)

    let targetIndex = destIssues.length

    // Nếu thả đè lên một dòng issue cụ thể
    if (over.id !== 'sprint-active' && over.id !== 'backlog') {
      const overId = over.id as string
      const overIndex = destIssues.findIndex((i) => i._id === overId)
      if (overIndex !== -1) {
        targetIndex = overIndex
      }
    }

    const newOrder = calculateNewOrderIndex(destIssues, targetIndex)

    const payload: any = { orderIndex: newOrder }

    // Kiểm tra xem có chuyển đổi container không
    const currentIsSprint = activeIssue.status !== 'TODO'
    if (currentIsSprint !== isTargetSprint) {
      // Nếu từ Backlog lên Sprint, set status mặc định là IN_PROGRESS
      // Nếu từ Sprint xuống Backlog, set status là TODO
      payload.status = isTargetSprint ? 'IN_PROGRESS' : 'TODO'
    }

    // Chỉ gọi API cập nhật nếu thực sự có sự thay đổi (đổi cột hoặc đổi orderIndex)
    const isPositionChanged = activeIssue.orderIndex !== newOrder
    const isStatusChanged = currentIsSprint !== isTargetSprint

    if (isPositionChanged || isStatusChanged) {
      updateIssueMutation.mutate({ issueId, payload })
    }
  }

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center text-muted">
        <Spinner />
      </div>
    )
  }

  const renderRow = (issue: Issue) => (
    <SortableItem key={issue._id} id={issue._id}>
      <div
        onClick={() => onSelectIssue(issue.key)}
        className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-white border border-line/15 rounded-2xl hover:bg-slate-50/50 transition-all cursor-grab active:cursor-grabbing select-none"
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
    </SortableItem>
  )

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-8">
        {/* Sprint Container */}
        <DroppableContainer
          id="sprint-active"
          className="bg-white border border-line/30 rounded-3xl p-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-line/10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSprintOpen(!sprintOpen)}
                className="p-1 rounded hover:bg-slate-100 text-muted transition-all"
              >
                {sprintOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-extrabold text-ink">Sprint hiện tại</h3>
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    Đang hoạt động
                  </span>
                </div>
                <p className="text-xs text-muted mt-1 font-medium flex items-center gap-1.5">
                  <Calendar size={12} />
                  <span>{sprintIssues.length} công việc</span>
                </p>
              </div>
            </div>
          </div>

          {sprintOpen && (
            <div className="space-y-2.5 min-h-[50px]">
              <SortableContext
                items={sprintIssues.map((i) => i._id)}
                strategy={verticalListSortingStrategy}
              >
                {sprintIssues.map(renderRow)}
              </SortableContext>
              {sprintIssues.length === 0 && (
                <p className="text-xs text-subtle italic py-4 text-center">Sprint chưa có công việc nào.</p>
              )}
            </div>
          )}
        </DroppableContainer>

        {/* Backlog Container */}
        <DroppableContainer
          id="backlog"
          className="bg-white border border-line/30 rounded-3xl p-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-line/10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setBacklogOpen(!backlogOpen)}
                className="p-1 rounded hover:bg-slate-100 text-muted transition-all"
              >
                {backlogOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
              <div>
                <h3 className="text-base font-extrabold text-ink">Bể công việc (Backlog)</h3>
                <p className="text-xs text-muted mt-1 font-medium">{backlogIssues.length} công việc chưa lên kế hoạch</p>
              </div>
            </div>
          </div>

          {backlogOpen && (
            <div className="space-y-2.5 min-h-[50px]">
              <SortableContext
                items={backlogIssues.map((i) => i._id)}
                strategy={verticalListSortingStrategy}
              >
                {backlogIssues.map(renderRow)}
              </SortableContext>
              {backlogIssues.length === 0 && (
                <p className="text-xs text-subtle italic py-4 text-center">Backlog trống.</p>
              )}
            </div>
          )}
        </DroppableContainer>
      </div>
    </DndContext>
  )
}

export default ProjectBacklogTab

