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
import { calculateNewOrderIndex } from '@/lib/dndHelpers'
import type { IssueStatus, Issue } from '../issue.types'

export interface BoardColumnDef {
  status: IssueStatus
  title: string
}

interface BoardViewProps {
  issues: Issue[]
  columns: BoardColumnDef[]
  isLoading?: boolean
  /** Khóa board (không cho kéo-thả) — dùng khi Scrum project không có sprint ACTIVE. */
  disabled?: boolean
  onDragEnd: (issueId: string, status: IssueStatus, orderIndex: number) => void
  onSelectIssue: (issueKey: string) => void
}

/**
 * Board thuần (dumb component) — không biết gì về methodology/sprint/mutation, chỉ nhận
 * issues/columns và gọi `onDragEnd` khi kéo-thả xong. Dùng chung cho cả KanbanBoardContainer
 * và ScrumBoardContainer để tránh copy-paste 2 board riêng biệt.
 */
const BoardView = ({ issues, columns, isLoading, disabled = false, onDragEnd, onSelectIssue }: BoardViewProps) => {
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

  const sortedIssues = [...localIssues].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
  const { query, setQuery, filtered } = useIssueSearch(sortedIssues)

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

  const activeIssue = localIssues.find((i) => i._id === activeId)

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center text-muted">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 py-3.5 px-5 bg-white/70 backdrop-blur-md rounded-2xl border border-line/30 shadow-sm">
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
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin">
          {columns.map((col) => (
            <BoardColumn
              key={col.status}
              title={col.title}
              status={col.status}
              issues={filtered.filter((issue) => issue.status === col.status)}
              onSelectIssue={onSelectIssue}
            />
          ))}
        </div>

        <DragOverlay adjustScale={false}>
          {activeId && activeIssue ? (
            <div className="w-[256px] opacity-95 shadow-xl cursor-grabbing select-none pointer-events-none">
              <IssueCard issue={activeIssue} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

export default BoardView
