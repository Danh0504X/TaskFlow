import type { Issue, IssueStatus } from '@/features/issues/issue.types'
import IssueCard from './IssueCard'

interface BoardColumnProps {
  title: string
  status: IssueStatus
  issues: Issue[]
  onSelectIssue: (issueKey: string) => void
}

const BoardColumn = ({ title, issues, onSelectIssue }: BoardColumnProps) => {
  return (
    <div className="bg-slate-50/70 border border-line/15 rounded-3xl p-4 flex flex-col h-[640px] w-72 flex-shrink-0">
      <div className="flex items-center gap-2 mb-4 px-1">
        <h3 className="text-xs font-extrabold text-ink uppercase tracking-wider">{title}</h3>
        <span className="w-5 h-5 rounded-full bg-white border border-line/20 flex items-center justify-center text-[10px] font-bold text-muted shadow-sm">
          {issues.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin">
        {issues.map((issue) => (
          <IssueCard key={issue._id} issue={issue} onClick={() => onSelectIssue(issue.key)} />
        ))}

        {issues.length === 0 && (
          <div className="border border-dashed border-line/35 rounded-2xl py-8 text-center text-subtle text-xs font-medium">
            Không có công việc
          </div>
        )}
      </div>
    </div>
  )
}

export default BoardColumn
