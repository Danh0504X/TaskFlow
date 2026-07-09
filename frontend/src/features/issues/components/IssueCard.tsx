import Avatar from '@/components/ui/Avatar'
import IssueTypeIcon from '@/components/ui/IssueTypeIcon'
import IssuePriorityBadge from '@/components/ui/IssuePriorityBadge'
import type { Issue } from '../issue.types'

interface IssueCardProps {
  issue: Issue
  onClick?: () => void
}

const IssueCard = ({ issue, onClick }: IssueCardProps) => {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-line/15 hover:border-brand/40 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-1.5">
          <IssueTypeIcon type={issue.type} size={14} />
          <span className="text-[11px] font-bold text-brand uppercase tracking-wider">{issue.key}</span>
        </div>
      </div>

      <h4 className="text-xs font-bold text-ink leading-relaxed mb-3.5 line-clamp-2">{issue.summary}</h4>

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
