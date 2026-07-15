import { useState, useEffect, useRef } from 'react'
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
import { useProjectIssues } from '@/features/issues/hooks/useIssues'
import { useIssueSearch } from '@/features/issues/hooks/useIssueSearch'
import { useUpdateIssue } from '@/features/issues/hooks/useIssueMutations'
import BoardColumn from '@/features/issues/components/BoardColumn'
import IssueCard from '@/features/issues/components/IssueCard'
import { calculateNewOrderIndex } from '@/lib/dndHelpers'
import type { IssueStatus, Issue } from '@/features/issues/issue.types'

interface ProjectBoardProps {
  projectId: string
  onSelectIssue: (issueKey: string) => void
}

const COLUMNS = [
  { status: 'TODO', title: 'Cần làm' },
  { status: 'IN_PROGRESS', title: 'Đang tiến hành' },
  { status: 'IN_REVIEW', title: 'Đang đánh giá' },
  { status: 'DONE', title: 'Hoàn thành' },
] as const

const ProjectBoard = ({ projectId, onSelectIssue }: ProjectBoardProps) => {
  // Lấy toàn bộ issues, sau đó lọc ở client để giữ lại TASK và BUG (loại bỏ EPIC, SUBTASK)
  const { data: issues, isLoading } = useProjectIssues(projectId)
  const updateIssueMutation = useUpdateIssue(projectId)

  // State local để quản lý vị trí các issues mượt mà lúc đang kéo (DragOver)
  const [localIssues, setLocalIssues] = useState<Issue[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const lastOverId = useRef<string | null>(null)

  // Đồng bộ local issues khi query data từ server thay đổi
  useEffect(() => {
    if (issues) {
      setLocalIssues(issues)
    }
  }, [issues])

  const taskIssues = localIssues
    .filter((issue) => issue.type !== 'EPIC' && issue.type !== 'SUBTASK')
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))

  const { query, setQuery, filtered } = useIssueSearch(taskIssues)

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
    const isColumnId = COLUMNS.some((col) => col.status === overId)
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
      const activeOriginal = issues?.find((i) => i._id === issueId)
      
      // Chỉ gọi API nếu thực sự có sự thay đổi về cột hoặc vị trí
      if (
        activeOriginal?.status !== finalIssue.status ||
        activeOriginal?.orderIndex !== finalIssue.orderIndex
      ) {
        updateIssueMutation.mutate({
          issueId,
          payload: {
            status: finalIssue.status,
            orderIndex: finalIssue.orderIndex,
          },
        })
      }
    }

    setActiveId(null)
    lastOverId.current = null
  }

  const handleDragCancel = () => {
    // Reset lại mảng localIssues nếu kéo bị hủy bỏ
    if (issues) {
      setLocalIssues(issues)
    }
    setActiveId(null)
    lastOverId.current = null
  }

  const activeIssue = localIssues.find((i) => i._id === activeId)

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

      {isLoading ? (
        <div className="py-12 flex justify-center text-muted">
          <Spinner />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin">
            {COLUMNS.map((col) => (
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
      )}
    </div>
  )
}

export default ProjectBoard

