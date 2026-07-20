import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Issue, IssueStatus } from '../issue.types'
import IssueCard from './IssueCard'
import QuickAddIssue from './QuickAddIssue'
import { DroppableContainer } from '@/components/ui/dnd/DroppableContainer'
import { SortableItem } from '@/components/ui/dnd/SortableItem'
import { calculateNewOrderIndex } from '@/lib/dndHelpers'

interface BoardColumnProps {
  title: string
  status: IssueStatus
  issues: Issue[]
  onSelectIssue: (issueKey: string) => void
  projectId: string
  /** null = Kanban (không có sprint). Có giá trị = Scrum, tạo thẳng vào sprint đang ACTIVE đó. */
  quickAddSprintId: string | null
  /** Chỉ OWNER được tạo issue (khớp quyền tạo issue ở backend) -> ẩn khung quick-add với MEMBER. */
  isOwner: boolean
}

const BoardColumn = ({ title, status, issues, onSelectIssue, projectId, quickAddSprintId, isOwner }: BoardColumnProps) => {
  const issueIds = issues.map((i) => i._id)

  return (
    <DroppableContainer
      id={status}
      className="bg-slate-50/70 border border-line/15 rounded-3xl p-4 flex flex-col h-[640px] w-72 flex-shrink-0"
    >
      <div className="flex items-center gap-2 mb-4 px-1">
        <h3 className="text-xs font-extrabold text-ink uppercase tracking-wider">{title}</h3>
        <span className="w-5 h-5 rounded-full bg-white border border-line/20 flex items-center justify-center text-[10px] font-bold text-muted shadow-sm">
          {issues.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin">
        <SortableContext items={issueIds} strategy={verticalListSortingStrategy}>
          {issues.map((issue) => (
            <SortableItem key={issue._id} id={issue._id}>
              <IssueCard issue={issue} projectId={projectId} onClick={() => onSelectIssue(issue.key)} />
            </SortableItem>
          ))}
        </SortableContext>

        {isOwner ? (
          <QuickAddIssue
            projectId={projectId}
            targetSprintId={quickAddSprintId}
            nextOrderIndex={calculateNewOrderIndex(issues, issues.length)}
            status={status}
          />
        ) : (
          issues.length === 0 && (
            <div className="border border-dashed border-line/35 rounded-2xl py-8 text-center text-subtle text-xs font-medium">
              Không có công việc
            </div>
          )
        )}
      </div>
    </DroppableContainer>
  )
}

export default BoardColumn

