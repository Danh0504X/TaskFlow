import { useMemo } from 'react'
import { useProjectIssues } from '@/features/issues/hooks/useIssues'
import { useUpdateIssueStatus } from '@/features/issues/hooks/useIssueMutations'
import BoardView, { type BoardColumnDef } from '@/features/issues/components/BoardView'
import type { IssueStatus } from '@/features/issues/issue.types'

interface KanbanBoardContainerProps {
  projectId: string
  onSelectIssue: (issueKey: string) => void
}

const COLUMNS: BoardColumnDef[] = [
  { status: 'TODO', title: 'Cần làm' },
  { status: 'IN_PROGRESS', title: 'Đang tiến hành' },
  { status: 'IN_REVIEW', title: 'Đang đánh giá' },
  { status: 'DONE', title: 'Hoàn thành' },
]

/**
 * Board cho project KANBAN — không có khái niệm sprint, luôn mở, kéo-thả tự do.
 * Chỉ lo việc lấy dữ liệu + wire mutation; phần render/DnD nằm trong BoardView (dumb).
 */
const KanbanBoardContainer = ({ projectId, onSelectIssue }: KanbanBoardContainerProps) => {
  // Lấy toàn bộ issues, sau đó lọc ở client để giữ lại TASK và BUG (loại bỏ EPIC, SUBTASK)
  const { data: issues, isLoading } = useProjectIssues(projectId)
  const updateStatusMutation = useUpdateIssueStatus(projectId)

  // useMemo khóa theo `issues` (reference ổn định từ React Query, chỉ đổi khi dữ liệu thật
  // sự mới) -> tránh tạo mảng mới mỗi render khiến BoardView tưởng dữ liệu đổi và reset
  // state kéo-thả cục bộ giữa chừng (gây giật/nhập nhịp khi kéo-thả).
  const taskIssues = useMemo(
    () => (issues ?? []).filter((issue) => issue.type !== 'EPIC' && issue.type !== 'SUBTASK'),
    [issues],
  )

  const handleDragEnd = (issueId: string, status: IssueStatus, orderIndex: number) => {
    // PATCH /status (OWNER+MEMBER) thay vì PUT (OWNER-only) -> MEMBER kéo-thả không còn bị 403.
    updateStatusMutation.mutate({ issueId, payload: { status, orderIndex } })
  }

  return (
    <BoardView
      issues={taskIssues}
      columns={COLUMNS}
      isLoading={isLoading}
      disabled={false}
      onDragEnd={handleDragEnd}
      onSelectIssue={onSelectIssue}
    />
  )
}

export default KanbanBoardContainer
