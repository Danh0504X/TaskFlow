import { CornerDownRight, ChevronDown } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import SearchInput from '@/components/ui/SearchInput'
import Spinner from '@/components/ui/Spinner'
import IssueTypeIcon from '@/components/ui/IssueTypeIcon'
import IssuePriorityBadge from '@/components/ui/IssuePriorityBadge'
import IssueStatusBadge from '@/components/ui/IssueStatusBadge'
import { useProjectIssues } from '@/features/issues/hooks/useIssues'
import { useIssueSearch } from '@/features/issues/hooks/useIssueSearch'

interface ProjectListTabProps {
  projectId: string
  onSelectIssue: (issueKey: string) => void
}

const ProjectListTab = ({ projectId, onSelectIssue }: ProjectListTabProps) => {
  const { data: issues, isLoading } = useProjectIssues(projectId)
  const { query, setQuery, filtered } = useIssueSearch(issues)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 py-3.5 px-5 bg-white/70 backdrop-blur-md rounded-2xl border border-line/30 shadow-sm">
        <SearchInput
          containerClassName="max-w-md"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm công việc..."
        />
      </div>

      <div className="bg-white border border-line/30 rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-12 flex justify-center text-muted">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-line/30 bg-slate-50/50 text-[10px] font-bold text-muted uppercase tracking-wider">
                  <th className="px-2 py-4 w-10" />
                  <th className="px-4 py-4 w-28">Mã việc</th>
                  <th className="px-4 py-4 min-w-[280px]">Tiêu đề tóm tắt</th>
                  <th className="px-4 py-4">Người thực hiện</th>
                  <th className="px-4 py-4">Độ ưu tiên</th>
                  <th className="px-5 py-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/10 text-xs font-medium text-ink">
                {filtered.map((issue) => (
                  <tr
                    key={issue._id}
                    onClick={() => onSelectIssue(issue.key)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                  >
                    <td className="px-2 py-3.5 text-center">
                      {issue.type === 'EPIC' ? (
                        <ChevronDown size={14} className="text-muted group-hover:text-brand" />
                      ) : (
                        <CornerDownRight size={14} className="text-subtle ml-2" />
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-brand">{issue.key}</td>
                    <td className="px-4 py-3.5 font-semibold text-ink max-w-sm truncate">
                      <div className="flex items-center gap-2">
                        <IssueTypeIcon type={issue.type} size={14} />
                        <span className={issue.status === 'DONE' ? 'line-through text-subtle font-medium' : ''}>
                          {issue.summary}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {issue.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar src={issue.assignee.avatarUrl} name={issue.assignee.fullName} size={20} />
                          <span className="truncate max-w-[100px]">{issue.assignee.fullName}</span>
                        </div>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <IssuePriorityBadge priority={issue.priority} showIcon={false} />
                    </td>
                    <td className="px-5 py-3.5">
                      <IssueStatusBadge status={issue.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectListTab
