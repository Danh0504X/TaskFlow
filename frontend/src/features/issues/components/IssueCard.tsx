import Avatar from '@/components/ui/Avatar'
import IssueTypeIcon from '@/components/ui/IssueTypeIcon'
import IssuePriorityBadge from '@/components/ui/IssuePriorityBadge'
import type { Issue, IssuePriority } from '../issue.types'

interface IssueCardProps {
  issue: Issue
  onClick?: () => void
}

// Thanh màu bên trái theo độ ưu tiên -> quét bảng Kanban nhanh hơn mà không cần đọc badge.
const priorityAccent: Record<IssuePriority, string> = {
  URGENT: 'border-l-red-500',
  HIGH: 'border-l-amber-500',
  MEDIUM: 'border-l-blue-400',
  LOW: 'border-l-line',
}

const IssueCard = ({ issue, onClick }: IssueCardProps) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border-y border-r border-l-4 border-line/15 ${priorityAccent[issue.priority]} hover:border-y-brand/40 hover:border-r-brand/40 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer`}
    >
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-1.5">
          <IssueTypeIcon type={issue.type} size={14} />
          <span className="text-[11px] font-bold text-brand uppercase tracking-wider">{issue.key}</span>
        </div>
      </div>

      <h4 className="text-xs font-bold text-ink leading-relaxed mb-3.5 line-clamp-2">{issue.title}</h4>

      {issue.epicName && (
        <span className="inline-block px-2 py-0.5 bg-brand/5 border border-brand/10 text-brand rounded text-[9px] font-bold uppercase tracking-wider mb-4">
          {issue.epicName}
        </span>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-line/10">
        <IssuePriorityBadge priority={issue.priority} showIcon />

        <div className="flex items-center gap-2">
          {issue.assignee ? (
            <Avatar src={issue.assignee.avatarUrl} name={issue.assignee.fullName} size={20} />
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-100 border border-dashed flex items-center justify-center text-subtle text-[8px] font-bold">
              --
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default IssueCard
