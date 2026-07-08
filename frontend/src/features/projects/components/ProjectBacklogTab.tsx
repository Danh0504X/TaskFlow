import { useState } from 'react'
import { Calendar, ChevronDown, ChevronRight } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Spinner from '@/components/ui/Spinner'
import IssueTypeIcon from '@/components/ui/IssueTypeIcon'
import IssuePriorityBadge from '@/components/ui/IssuePriorityBadge'
import { useProjectIssues } from '@/features/issues/hooks/useIssues'

interface ProjectBacklogTabProps {
  projectId: string
  onSelectIssue: (issueKey: string) => void
}

/** Backlog gộp: issue DONE/IN_REVIEW/IN_PROGRESS xem như "Sprint đang chạy", còn lại là bể Backlog. */
const ProjectBacklogTab = ({ projectId, onSelectIssue }: ProjectBacklogTabProps) => {
  const { data: issues, isLoading } = useProjectIssues(projectId)
  const [sprintOpen, setSprintOpen] = useState(true)
  const [backlogOpen, setBacklogOpen] = useState(true)

  const sprintIssues = (issues ?? []).filter((i) => i.status !== 'TODO')
  const backlogIssues = (issues ?? []).filter((i) => i.status === 'TODO')

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center text-muted">
        <Spinner />
      </div>
    )
  }

  const renderRow = (issue: (typeof sprintIssues)[number]) => (
    <div
      key={issue._id}
      onClick={() => onSelectIssue(issue.key)}
      className="flex flex-wrap items-center justify-between gap-4 p-3.5 border border-line/15 rounded-2xl hover:bg-slate-50/50 transition-all cursor-pointer"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <IssueTypeIcon type={issue.type} size={14} />
        <span className="text-xs font-bold text-brand flex-shrink-0">{issue.key}</span>
        <p className="text-xs font-semibold text-ink truncate flex-grow max-w-lg">{issue.summary}</p>
        {issue.epicName && (
          <span className="px-2 py-0.5 bg-brand/5 border border-brand/10 text-brand rounded text-[9px] font-bold uppercase tracking-wider flex-shrink-0">
            {issue.epicName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3.5">
        {issue.storyPoints !== undefined && (
          <div className="w-6 h-6 rounded-full bg-slate-100 border border-line/20 flex items-center justify-center text-[10px] font-extrabold text-muted">
            {issue.storyPoints}
          </div>
        )}
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
  )

  return (
    <div className="space-y-8">
      <div className="bg-white border border-line/30 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-line/10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSprintOpen(!sprintOpen)} className="p-1 rounded hover:bg-slate-100 text-muted transition-all">
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
          <div className="space-y-2.5">
            {sprintIssues.map(renderRow)}
            {sprintIssues.length === 0 && (
              <p className="text-xs text-subtle italic py-4 text-center">Sprint chưa có công việc nào.</p>
            )}
          </div>
        )}
      </div>

      <div className="bg-white border border-line/30 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-line/10">
          <div className="flex items-center gap-3">
            <button onClick={() => setBacklogOpen(!backlogOpen)} className="p-1 rounded hover:bg-slate-100 text-muted transition-all">
              {backlogOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
            <div>
              <h3 className="text-base font-extrabold text-ink">Bể công việc (Backlog)</h3>
              <p className="text-xs text-muted mt-1 font-medium">{backlogIssues.length} công việc chưa lên kế hoạch</p>
            </div>
          </div>
        </div>

        {backlogOpen && (
          <div className="space-y-2.5">
            {backlogIssues.map(renderRow)}
            {backlogIssues.length === 0 && (
              <p className="text-xs text-subtle italic py-4 text-center">Backlog trống.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectBacklogTab
