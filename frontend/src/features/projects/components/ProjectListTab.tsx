import { Fragment, useMemo, useState } from 'react'
import { CornerDownRight, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import SearchInput from '@/components/ui/SearchInput'
import Spinner from '@/components/ui/Spinner'
import IssueTypeIcon from '@/components/ui/IssueTypeIcon'
import IssuePriorityBadge from '@/components/ui/IssuePriorityBadge'
import IssueStatusBadge from '@/components/ui/IssueStatusBadge'
import { useProjectIssues } from '@/features/issues/hooks/useIssues'
import { useIssueSearch } from '@/features/issues/hooks/useIssueSearch'
import { useDeleteIssue } from '@/features/issues/hooks/useIssueMutations'
import type { Issue } from '@/features/issues/issue.types'

interface ProjectListTabProps {
  projectId: string
  onSelectIssue: (issueKey: string) => void
}

interface EpicGroup {
  epic: Issue
  children: Issue[]
}

// Backend không chuẩn hoá parentIssueId về id thô khi đã populate -> có thể là
// object { _id, title, type } (xem issue.types.ts). Rút id ra để so khớp cha-con.
const getParentId = (parent: Issue['parentIssueId']): string | null => {
  if (!parent) return null
  return typeof parent === 'string' ? parent : parent._id
}

/**
 * Gom issue thành cây Epic -> Task theo parentIssueId.
 * Task không có Epic cha hợp lệ (hoặc Bug/Subtask lỡ tồn tại) rơi vào nhóm "ungrouped".
 */
const buildIssueTree = (issues: Issue[]) => {
  const epics = issues.filter((issue) => issue.type === 'EPIC')
  const groups = new Map<string, EpicGroup>(
    epics.map((epic) => [epic._id, { epic, children: [] }]),
  )
  const ungrouped: Issue[] = []

  for (const issue of issues) {
    if (issue.type === 'EPIC') continue
    const group = groups.get(getParentId(issue.parentIssueId) ?? '')
    if (group) {
      group.children.push(issue)
    } else {
      ungrouped.push(issue)
    }
  }

  return { groups: Array.from(groups.values()), ungrouped }
}

interface IssueRowProps {
  issue: Issue
  depth: 0 | 1
  onSelectIssue: (issueKey: string) => void
  onDeleteIssue: (issue: Issue) => void
  toggle?: { collapsed: boolean; onToggle: () => void; childCount: number }
}

const IssueRow = ({ issue, depth, onSelectIssue, onDeleteIssue, toggle }: IssueRowProps) => (
  <tr
    onClick={() => onSelectIssue(issue.key)}
    className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
  >
    <td className="px-2 py-3.5 text-center">
      {toggle ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            toggle.onToggle()
          }}
          disabled={toggle.childCount === 0}
          className="p-0.5 rounded hover:bg-slate-200/60 text-muted group-hover:text-brand transition-all disabled:opacity-25 disabled:pointer-events-none"
          aria-label={toggle.collapsed ? 'Mở rộng epic' : 'Thu gọn epic'}
        >
          {toggle.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
      ) : (
        depth === 1 && <CornerDownRight size={14} className="text-subtle ml-2" />
      )}
    </td>
    <td className="px-4 py-3.5 font-bold text-brand">{issue.key}</td>
    <td className={`px-4 py-3.5 font-semibold text-ink max-w-sm truncate ${depth === 1 ? 'pl-10' : ''}`}>
      <div className="flex items-center gap-2">
        <IssueTypeIcon type={issue.type} size={14} />
        <span className={issue.status === 'DONE' ? 'line-through text-subtle font-medium' : ''}>
          {issue.title}
        </span>
        {toggle && toggle.childCount > 0 && (
          <span className="text-[10px] text-subtle font-bold">({toggle.childCount})</span>
        )}
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
    <td className="px-3 py-3.5 text-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDeleteIssue(issue)
        }}
        className="p-1.5 rounded-lg text-subtle hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
        aria-label={`Xoá ${issue.key}`}
        title="Xoá issue"
      >
        <Trash2 size={14} />
      </button>
    </td>
  </tr>
)

const ProjectListTab = ({ projectId, onSelectIssue }: ProjectListTabProps) => {
  const { data: issues, isLoading } = useProjectIssues(projectId)
  const { query, setQuery, filtered } = useIssueSearch(issues)
  const [collapsedEpicIds, setCollapsedEpicIds] = useState<Set<string>>(new Set())
  const deleteMutation = useDeleteIssue(projectId)

  const toggleEpic = (epicId: string) => {
    setCollapsedEpicIds((prev) => {
      const next = new Set(prev)
      if (next.has(epicId)) next.delete(epicId)
      else next.add(epicId)
      return next
    })
  }

  const isSearching = query.trim().length > 0
  const { groups, ungrouped } = useMemo(() => buildIssueTree(issues ?? []), [issues])

  // Xoá luôn khi bấm, không hỏi xác nhận. Xoá 1 Epic sẽ kéo theo xoá các Task con của nó
  // (xem issueService.deleteIssue ở backend).
  const handleDeleteIssue = (issue: Issue) => deleteMutation.mutate(issue._id)

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
                  <th className="px-3 py-4 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line/10 text-xs font-medium text-ink">
                {isSearching
                  ? filtered.map((issue) => (
                      <IssueRow
                        key={issue._id}
                        issue={issue}
                        depth={0}
                        onSelectIssue={onSelectIssue}
                        onDeleteIssue={handleDeleteIssue}
                      />
                    ))
                  : (
                    <>
                      {groups.map((group) => {
                        const collapsed = collapsedEpicIds.has(group.epic._id)
                        return (
                          <Fragment key={group.epic._id}>
                            <IssueRow
                              issue={group.epic}
                              depth={0}
                              onSelectIssue={onSelectIssue}
                              onDeleteIssue={handleDeleteIssue}
                              toggle={{
                                collapsed,
                                onToggle: () => toggleEpic(group.epic._id),
                                childCount: group.children.length,
                              }}
                            />
                            {!collapsed &&
                              group.children.map((child) => (
                                <IssueRow
                                  key={child._id}
                                  issue={child}
                                  depth={1}
                                  onSelectIssue={onSelectIssue}
                                  onDeleteIssue={handleDeleteIssue}
                                />
                              ))}
                          </Fragment>
                        )
                      })}
                      {ungrouped.map((issue) => (
                        <IssueRow
                          key={issue._id}
                          issue={issue}
                          depth={0}
                          onSelectIssue={onSelectIssue}
                          onDeleteIssue={handleDeleteIssue}
                        />
                      ))}
                    </>
                  )}
              </tbody>
            </table>

            {groups.length === 0 && ungrouped.length === 0 && (
              <p className="text-xs text-subtle italic py-10 text-center">Chưa có công việc nào.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectListTab
