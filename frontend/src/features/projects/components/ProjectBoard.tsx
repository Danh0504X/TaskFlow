import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import SearchInput from '@/components/ui/SearchInput'
import Spinner from '@/components/ui/Spinner'
import { useProjectIssues } from '@/features/issues/hooks/useIssues'
import { useIssueSearch } from '@/features/issues/hooks/useIssueSearch'
import { useUpdateIssue } from '@/features/issues/hooks/useIssueMutations'
import BoardColumn from '@/features/issues/components/BoardColumn'
import { calculateNewOrderIndex } from '@/lib/dndHelpers'
import type { IssueStatus } from '@/features/issues/issue.types'

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

  const taskIssues = (issues ?? [])
    .filter((issue) => issue.type !== 'EPIC' && issue.type !== 'SUBTASK')
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))

  const { query, setQuery, filtered } = useIssueSearch(taskIssues)

  const mouseSensor = useSensor(MouseSensor)
  const touchSensor = useSensor(TouchSensor)
  const sensors = useSensors(mouseSensor, touchSensor)

  const handleDragStart = (event: any) => {
    console.log('🚀 Drag Started! Active ID:', event.active.id)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    console.log('🚀 Drag Ended! Active ID:', active.id, 'Over ID:', over?.id)
    if (!over) return

    const issueId = active.id as string
    const activeIssue = taskIssues.find((i) => i._id === issueId)
    if (!activeIssue) return

    // ID của container over có thể là tên cột (TODO, IN_PROGRESS...) hoặc ID của một card cụ thể.
    // Dnd-kit trả về over.id. Ta cần xác định cột đích (status).
    let targetStatus: IssueStatus | null = null

    // 1. Kiểm tra xem over.id có phải là một trong các cột (TODO, IN_PROGRESS, IN_REVIEW, DONE)
    const isColumnId = COLUMNS.some((col) => col.status === over.id)
    if (isColumnId) {
      targetStatus = over.id as IssueStatus
    } else {
      // 2. Nếu over.id là ID của một card, ta lấy status của card đó
      const overIssue = taskIssues.find((i) => i._id === over.id)
      if (overIssue) {
        targetStatus = overIssue.status
      }
    }

    if (!targetStatus) return

    // Lấy danh sách các issue đang ở cột đích (loại trừ issue đang kéo) đã sort theo orderIndex
    const destIssues = taskIssues
      .filter((i) => i.status === targetStatus && i._id !== issueId)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))

    let targetIndex = destIssues.length

    // Nếu thả đè lên một card khác trong cột
    if (!isColumnId) {
      const overId = over.id as string
      const overIndex = destIssues.findIndex((i) => i._id === overId)
      if (overIndex !== -1) {
        // Nếu kéo trong cùng cột và kéo từ trên xuống dưới, ta cần chèn sau vị trí overIndex một chút
        // Để đơn giản, ta cứ lấy vị trí của card bị đè lên làm targetIndex.
        targetIndex = overIndex
      }
    }

    const newOrderIndex = calculateNewOrderIndex(destIssues, targetIndex)

    const payload: any = { orderIndex: newOrderIndex }
    if (activeIssue.status !== targetStatus) {
      payload.status = targetStatus
    }

    // Gửi API cập nhật lên server
    updateIssueMutation.mutate({
      issueId,
      payload,
    })
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

      {isLoading ? (
        <div className="py-12 flex justify-center text-muted">
          <Spinner />
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
        </DndContext>
      )}
    </div>
  )
}

export default ProjectBoard

