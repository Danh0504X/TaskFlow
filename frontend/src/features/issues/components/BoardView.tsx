import { useState, useRef } from 'react'
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  pointerWithin,
} from '@dnd-kit/core'
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core'
import SearchInput from '@/components/ui/SearchInput'
import Spinner from '@/components/ui/Spinner'
import { useIssueSearch } from '../hooks/useIssueSearch'
import BoardColumn from './BoardColumn'
import IssueCard from './IssueCard'
import ConfirmDoneDialog from './ConfirmDoneDialog'
import SubtaskWarningModal from './SubtaskWarningModal'
import { calculateNewOrderIndex } from '@/lib/dndHelpers'
import type { IssueStatus, Issue } from '../issue.types'
import { ISSUE_TYPE } from '../issue.types'

export interface BoardColumnDef {
  status: IssueStatus
  title: string
}

// [NEW] R1.2: Bảng chuyển status hợp lệ cho MEMBER — phía client (guard kéo-thả).
const MEMBER_ALLOWED_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  TODO: ['IN_PROGRESS'],
  IN_PROGRESS: ['IN_REVIEW'],
  IN_REVIEW: [],
  DONE: [],
}

interface BoardViewProps {
  issues: Issue[]
  /** Toàn bộ issues trong project/sprint (dùng để tính subtask stats). */
  allIssues?: Issue[]
  columns: BoardColumnDef[]
  isLoading?: boolean
  /** Khóa board (không cho kéo-thả) — dùng khi Scrum project không có sprint ACTIVE. */
  disabled?: boolean
  onDragEnd: (issueId: string, status: IssueStatus, orderIndex: number) => void
  onSelectIssue: (issueKey: string) => void
  projectId: string
  /** null = Kanban (không có sprint). Có giá trị = Scrum, quick-add tạo thẳng vào sprint
   * đang ACTIVE đó (Board Scrum chỉ hiển thị 1 sprint duy nhất — chính nó). */
  quickAddSprintId: string | null
  /** Chỉ OWNER được tạo issue (khớp quyền tạo issue ở backend) -> ẩn khung quick-add với MEMBER. */
  isOwner: boolean
  /** [NEW] R1.1: ID user hiện tại để kiểm tra quyền kéo-thả (MEMBER chỉ kéo task của mình). */
  currentUserId: string
}

/**
 * Board thuần (dumb component) — không biết gì về methodology/sprint/mutation ngoài những gì
 * được truyền vào qua props, chỉ nhận issues/columns và gọi `onDragEnd` khi kéo-thả xong.
 * Dùng chung cho cả KanbanBoardContainer và ScrumBoardContainer để tránh copy-paste 2 board
 * riêng biệt.
 */
const BoardView = ({
  issues,
  allIssues,
  columns,
  isLoading,
  disabled = false,
  onDragEnd,
  onSelectIssue,
  projectId,
  quickAddSprintId,
  isOwner,
  currentUserId,
}: BoardViewProps) => {
  // State local để quản lý vị trí các issues mượt mà lúc đang kéo (DragOver).
  // Đồng bộ lại mỗi khi `issues` từ server đổi reference (refetch) — dùng pattern "adjusting
  // state during render" (so sánh với giá trị đã đồng bộ lần trước) thay vì useEffect, để
  // tránh 1 lượt render thừa mỗi lần đồng bộ (xem react-hooks/set-state-in-effect).
  const [localIssues, setLocalIssues] = useState<Issue[]>(issues)
  const [syncedIssues, setSyncedIssues] = useState<Issue[]>(issues)
  if (issues !== syncedIssues) {
    setSyncedIssues(issues)
    setLocalIssues(issues)
  }

  const [activeId, setActiveId] = useState<string | null>(null)
  const lastOverId = useRef<string | null>(null)

  // [NEW] R2.1: State cho ConfirmDoneDialog (OWNER kéo task sang DONE có subtask chưa xong).
  const [confirmDoneState, setConfirmDoneState] = useState<{
    issueId: string
    status: IssueStatus
    orderIndex: number
    incompleteCount: number
  } | null>(null)

  // [NEW] R2.4: State cho SubtaskWarningModal (MEMBER kéo sang IN_REVIEW có subtask chưa xong).
  const [subtaskWarning, setSubtaskWarning] = useState<{ incompleteCount: number } | null>(null)

  const sortedIssues = [...localIssues].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
  const { query, setQuery, filtered } = useIssueSearch(sortedIssues)

  // [NEW] R1.1: MEMBER chỉ được kéo task được gán cho mình.
  const canDrag = (issue: Issue): boolean => {
    if (isOwner) return true
    return issue.assigneeId === currentUserId
  }

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5, // Chỉ kéo khi di chuyển chuột 5px -> tránh click nhầm bị hiểu là kéo
    },
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250, // Nhấn giữ 250ms trên mobile để bắt đầu kéo -> cuộn trang bình thường
      tolerance: 5,
    },
  })
  const sensors = useSensors(mouseSensor, touchSensor)
  // Khi disabled: không đăng ký sensor nào -> không thể khởi tạo thao tác kéo, board
  // hiển thị read-only mà không cần tách 2 nhánh render riêng.
  const activeSensors = disabled ? [] : sensors

  const handleDragStart = (event: DragStartEvent) => {
    // [NEW] R1.1: Kiểm tra quyền kéo ngay khi bắt đầu drag.
    const issue = localIssues.find((i) => i._id === (event.active.id as string))
    if (issue && !canDrag(issue)) {
      // Không setActiveId -> dnd-kit sẽ không có active item -> drag bị hủy silently.
      return
    }
    setActiveId(event.active.id as string)
    lastOverId.current = null
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    // Tối ưu hóa: Tránh re-render liên tục nếu chuột di chuyển nhanh trong phạm vi cùng một card
    if (lastOverId.current === overId) return
    lastOverId.current = overId

    const activeIssue = localIssues.find((i) => i._id === activeId)
    if (!activeIssue) return

    // Xác định status của container đích
    let targetStatus: IssueStatus | null = null
    const isColumnId = columns.some((col) => col.status === overId)
    if (isColumnId) {
      targetStatus = overId as IssueStatus
    } else {
      const overIssue = localIssues.find((i) => i._id === overId)
      if (overIssue) {
        targetStatus = overIssue.status
      }
    }

    if (!targetStatus) return

    const currentStatus = activeIssue.status

    // [NEW] R1.2: Guard phía client — MEMBER không được kéo sang cột ngoài chiều tiến.
    // Chặn ngay ở handleDragOver để card không "nhảy" vào cột không hợp lệ trong UI.
    if (!isOwner && currentStatus !== targetStatus) {
      const allowed = MEMBER_ALLOWED_TRANSITIONS[currentStatus] ?? []
      if (!allowed.includes(targetStatus)) return
    }

    // Trường hợp 1: Kéo sang cột khác
    if (currentStatus !== targetStatus) {
      setLocalIssues((prev) => {
        return prev.map((item) => {
          if (item._id === activeId) {
            // Tìm các issue đang có ở cột đích (không gồm chính nó) để tính index mới
            const destIssues = prev
              .filter((i) => i.status === targetStatus && i._id !== activeId)
              .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))

            let targetIndex = destIssues.length
            if (!isColumnId) {
              const overIndexInCol = destIssues.findIndex((i) => i._id === overId)
              if (overIndexInCol !== -1) {
                targetIndex = overIndexInCol
              }
            }

            const newOrder = calculateNewOrderIndex(destIssues, targetIndex)
            return { ...item, status: targetStatus, orderIndex: newOrder }
          }
          return item
        })
      })
    } else {
      // Trường hợp 2: Kéo trong cùng một cột nhưng đổi vị trí
      setLocalIssues((prev) => {
        const destIssues = prev
          .filter((i) => i.status === targetStatus && i._id !== activeId)
          .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))

        const overIndexInCol = destIssues.findIndex((i) => i._id === overId)
        if (overIndexInCol === -1) return prev

        const newOrder = calculateNewOrderIndex(destIssues, overIndexInCol)

        return prev.map((item) => {
          if (item._id === activeId) {
            return { ...item, orderIndex: newOrder }
          }
          return item
        })
      })
    }
  }

  // Đếm subtask chưa DONE của 1 task dựa trên allIssues.
  const countIncompleteSubtasks = (taskId: string): number => {
    if (!allIssues) return 0
    return allIssues.filter(
      (i) =>
        i.type === ISSUE_TYPE.SUBTASK &&
        (typeof i.parentIssueId === 'string' ? i.parentIssueId : i.parentIssueId?._id) === taskId &&
        i.status !== 'DONE',
    ).length
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event
    const issueId = active.id as string

    // Tìm trạng thái sau khi kéo thả của issue để cập nhật API
    const finalIssue = localIssues.find((i) => i._id === issueId)
    if (finalIssue) {
      const originalIssue = issues.find((i) => i._id === issueId)

      // Chỉ gọi API nếu thực sự có sự thay đổi về cột hoặc vị trí
      if (
        originalIssue?.status !== finalIssue.status ||
        originalIssue?.orderIndex !== finalIssue.orderIndex
      ) {
        const incompleteCount = countIncompleteSubtasks(issueId)

        // [NEW] R2.1: OWNER kéo sang DONE + có subtask chưa xong -> hiện ConfirmDoneDialog.
        if (isOwner && finalIssue.status === 'DONE' && incompleteCount > 0) {
          setConfirmDoneState({
            issueId,
            status: finalIssue.status,
            orderIndex: finalIssue.orderIndex ?? 0,
            incompleteCount,
          })
          setActiveId(null)
          lastOverId.current = null
          return
        }

        // [NEW] R2.4: MEMBER kéo sang IN_REVIEW + có subtask chưa xong -> hiện cảnh báo (không chặn).
        if (!isOwner && finalIssue.status === 'IN_REVIEW' && incompleteCount > 0) {
          setSubtaskWarning({ incompleteCount })
          // Vẫn cho phép drag end bình thường (gọi API tiếp tục bên dưới).
        }

        onDragEnd(issueId, finalIssue.status, finalIssue.orderIndex ?? 0)
      }
    }

    setActiveId(null)
    lastOverId.current = null
  }

  const handleDragCancel = () => {
    // Reset lại mảng localIssues nếu kéo bị hủy bỏ
    setLocalIssues(issues)
    setActiveId(null)
    lastOverId.current = null
  }

  // [NEW] R2.1: OWNER xác nhận DONE dù còn subtask chưa xong.
  const handleConfirmDone = () => {
    if (confirmDoneState) {
      onDragEnd(confirmDoneState.issueId, confirmDoneState.status, confirmDoneState.orderIndex)
    }
    setConfirmDoneState(null)
  }

  // [NEW] R2.1: OWNER hủy -> hoàn tác UI về trạng thái ban đầu.
  const handleCancelDone = () => {
    setLocalIssues(issues)
    setConfirmDoneState(null)
  }

  const activeIssue = localIssues.find((i) => i._id === activeId)

  // Tính subtask stats cho từng task (dùng ở IssueCard - R2.3).
  const getSubtaskStats = (taskId: string) => {
    if (!allIssues) return undefined
    const subtasks = allIssues.filter(
      (i) =>
        i.type === ISSUE_TYPE.SUBTASK &&
        (typeof i.parentIssueId === 'string' ? i.parentIssueId : i.parentIssueId?._id) === taskId,
    )
    if (subtasks.length === 0) return undefined
    return { done: subtasks.filter((s) => s.status === 'DONE').length, total: subtasks.length }
  }

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center text-muted">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-4 bg-surface rounded-lg border border-hairline">
        <SearchInput
          containerClassName="max-w-md"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm trên bảng..."
        />
      </div>

      <DndContext
        sensors={activeSensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => (
            <BoardColumn
              key={col.status}
              title={col.title}
              status={col.status}
              issues={filtered.filter((issue) => issue.status === col.status)}
              onSelectIssue={onSelectIssue}
              projectId={projectId}
              quickAddSprintId={quickAddSprintId}
              isOwner={isOwner}
              currentUserId={currentUserId}
              getSubtaskStats={getSubtaskStats}
            />
          ))}
        </div>

        <DragOverlay adjustScale={false}>
          {activeId && activeIssue ? (
            <div className="w-[256px] opacity-95 shadow-xl cursor-grabbing select-none pointer-events-none">
              <IssueCard
                issue={activeIssue}
                projectId={projectId}
                isOwner={isOwner}
                subtaskStats={getSubtaskStats(activeIssue._id)}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* [NEW] R2.1: Dialog xác nhận DONE khi còn subtask chưa xong (OWNER). */}
      <ConfirmDoneDialog
        open={confirmDoneState !== null}
        incompleteCount={confirmDoneState?.incompleteCount ?? 0}
        onConfirm={handleConfirmDone}
        onCancel={handleCancelDone}
      />

      {/* [NEW] R2.4: Modal cảnh báo subtask chưa xong khi MEMBER kéo sang IN_REVIEW. */}
      <SubtaskWarningModal
        open={subtaskWarning !== null}
        incompleteCount={subtaskWarning?.incompleteCount ?? 0}
        onClose={() => setSubtaskWarning(null)}
      />
    </div>
  )
}

export default BoardView