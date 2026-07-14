import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CornerDownRight, ChevronDown, ChevronRight, Trash2, Plus } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import SearchInput from '@/components/ui/SearchInput'
import Spinner from '@/components/ui/Spinner'
import IssueTypeIcon from '@/components/ui/IssueTypeIcon'
import IssuePriorityBadge from '@/components/ui/IssuePriorityBadge'
import IssueStatusBadge from '@/components/ui/IssueStatusBadge'
import { useProjectIssues } from '@/features/issues/hooks/useIssues'
import { useIssueSearch } from '@/features/issues/hooks/useIssueSearch'
import { useCreateIssue, useDeleteIssue } from '@/features/issues/hooks/useIssueMutations'
import { ISSUE_TYPE, type Issue, type IssueType } from '@/features/issues/issue.types'

interface ProjectListTabProps {
  projectId: string
  onSelectIssue: (issueKey: string) => void
}

interface IssueNode {
  issue: Issue
  children: IssueNode[]
}

// Backend không chuẩn hoá parentIssueId về id thô khi đã populate -> có thể là
// object { _id, title, type } (xem issue.types.ts). Rút id ra để so khớp cha-con.
const getParentId = (parent: Issue['parentIssueId']): string | null => {
  if (!parent) return null
  return typeof parent === 'string' ? parent : parent._id
}

/**
 * Dựng cây phân cấp Epic -> Task/Bug -> Subtask theo parentIssueId (đệ quy, không giới hạn
 * ở 2 cấp như trước). Issue không phải Epic và không tìm được issue cha hợp lệ trong danh
 * sách hiện có (vd Task độc lập không thuộc Epic nào) vẫn được coi là gốc hiển thị ở cấp 0,
 * nhưng vẫn giữ nguyên các con (nếu có) của chính nó.
 */
const buildIssueTree = (issues: Issue[]) => {
  const nodeById = new Map<string, IssueNode>(
    issues.map((issue) => [issue._id, { issue, children: [] }]),
  )
  const roots: IssueNode[] = []
  const ungrouped: IssueNode[] = []

  for (const issue of issues) {
    const node = nodeById.get(issue._id)!
    if (issue.type === ISSUE_TYPE.EPIC) {
      roots.push(node)
      continue
    }
    const parentNode = nodeById.get(getParentId(issue.parentIssueId) ?? '')
    if (parentNode) {
      parentNode.children.push(node)
    } else {
      ungrouped.push(node)
    }
  }

  return { roots, ungrouped }
}

// Cỡ chữ/màu giảm dần theo cấp -> phân biệt rõ Epic (đậm, có nền nhấn) / Task (bình thường)
// / Subtask trở xuống (nhẹ, mờ hơn) mà không cần đọc icon loại issue.
const getTitleIndentClass = (depth: number) => {
  if (depth <= 0) return ''
  if (depth === 1) return 'pl-10'
  return 'pl-16'
}

const getCornerMarginClass = (depth: number) => (depth <= 1 ? 'ml-2' : 'ml-6')

interface IssueRowProps {
  issue: Issue
  depth: number
  onSelectIssue: (issueKey: string) => void
  onDeleteIssue: (issue: Issue) => void
  onAddChild?: () => void
  toggle?: { collapsed: boolean; onToggle: () => void; childCount: number }
}

const IssueRow = ({ issue, depth, onSelectIssue, onDeleteIssue, onAddChild, toggle }: IssueRowProps) => {
  const isEpic = issue.type === ISSUE_TYPE.EPIC
  const isDeep = depth >= 2 // Subtask (hoặc sâu hơn) -> chữ nhẹ hơn, mờ hơn Task.

  return (
    <tr
      onClick={() => onSelectIssue(issue.key)}
      className={`transition-colors cursor-pointer group ${
        isEpic ? 'bg-brand/5 hover:bg-brand/10' : 'hover:bg-slate-50/60'
      }`}
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
            aria-label={toggle.collapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            {toggle.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>
        ) : (
          depth > 0 && <CornerDownRight size={13} className={`text-subtle ${getCornerMarginClass(depth)}`} />
        )}
      </td>
      <td className={`px-4 py-3.5 max-w-md truncate ${getTitleIndentClass(depth)}`}>
        <div className="flex items-center gap-2.5">
          <IssueTypeIcon type={issue.type} size={isEpic ? 15 : isDeep ? 13 : 14} />
          <span className={`font-bold shrink-0 ${isDeep ? 'text-subtle text-[10px]' : 'text-brand text-xs'}`}>
            {issue.key}
          </span>
          <span
            className={
              issue.status === 'DONE'
                ? 'line-through text-subtle font-medium'
                : isEpic
                  ? 'font-extrabold text-ink text-[13px]'
                  : isDeep
                    ? 'font-medium text-muted text-[11px]'
                    : 'font-semibold text-ink'
            }
          >
            {issue.title}
          </span>
          {toggle && toggle.childCount > 0 && (
            <span className="text-[10px] text-subtle font-bold shrink-0">({toggle.childCount})</span>
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
        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onAddChild && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onAddChild()
              }}
              className="p-1.5 rounded-lg text-subtle hover:bg-brand/10 hover:text-brand transition-all"
              aria-label={`Thêm việc con cho ${issue.key}`}
              title="Thêm việc con"
            >
              <Plus size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDeleteIssue(issue)
            }}
            className="p-1.5 rounded-lg text-subtle hover:bg-red-50 hover:text-red-500 transition-all"
            aria-label={`Xoá ${issue.key}`}
            title="Xoá issue"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}

interface InlineAddIssueRowProps {
  depth: number
  childType: IssueType
  onCancel: () => void
  onSubmit: (title: string) => void
}

/**
 * Dòng nhập liệu tạo nhanh issue con: tự focus khi hiện ra, Enter/blur có nội dung -> lưu,
 * blur/Escape khi rỗng -> huỷ không tạo gì. `committedRef` chặn việc commit 2 lần (vd Enter
 * xử lý xong rồi input vẫn kịp bắn thêm sự kiện blur trước khi dòng này unmount).
 */
const InlineAddIssueRow = ({ depth, childType, onCancel, onSubmit }: InlineAddIssueRowProps) => {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const committedRef = useRef(false)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const commit = () => {
    if (committedRef.current) return
    committedRef.current = true
    const trimmed = value.trim()
    if (trimmed) {
      onSubmit(trimmed)
    } else {
      onCancel()
    }
  }

  const cancel = () => {
    if (committedRef.current) return
    committedRef.current = true
    onCancel()
  }

  return (
    <tr>
      <td className="px-2 py-2" />
      <td colSpan={5} className={`py-1.5 pr-4 ${depth <= 1 ? 'pl-10' : 'pl-16'}`}>
        <div className="flex items-center gap-2">
          <IssueTypeIcon type={childType} size={14} />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commit()
              } else if (e.key === 'Escape') {
                cancel()
              }
            }}
            placeholder={childType === ISSUE_TYPE.SUBTASK ? 'Nhập tên việc con rồi Enter...' : 'Nhập tên công việc rồi Enter...'}
            className="w-full bg-white border border-brand/30 rounded-lg px-3 py-1.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-brand/20 placeholder:text-subtle placeholder:font-medium"
          />
        </div>
      </td>
    </tr>
  )
}

const ProjectListTab = ({ projectId, onSelectIssue }: ProjectListTabProps) => {
  const { data: issues, isLoading } = useProjectIssues(projectId)
  const { query, setQuery, filtered } = useIssueSearch(issues)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const [addingChildFor, setAddingChildFor] = useState<string | null>(null)
  const deleteMutation = useDeleteIssue(projectId)
  const createMutation = useCreateIssue(projectId)

  const toggleCollapsed = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Mở "thêm việc con" cho 1 issue: đảm bảo issue đó đang mở rộng (nếu đang thu gọn) để
  // ô nhập liệu + item vừa tạo hiển thị được ngay, không bị ẩn sau chevron đang đóng.
  const handleStartAddChild = (issueId: string) => {
    setCollapsedIds((prev) => {
      if (!prev.has(issueId)) return prev
      const next = new Set(prev)
      next.delete(issueId)
      return next
    })
    setAddingChildFor(issueId)
  }

  const handleCreateChild = (parentIssue: Issue, title: string) => {
    const childType = parentIssue.type === ISSUE_TYPE.EPIC ? ISSUE_TYPE.TASK : ISSUE_TYPE.SUBTASK
    createMutation.mutate({ title, type: childType, parentIssueId: parentIssue._id })
    setAddingChildFor(null)
  }

  const isSearching = query.trim().length > 0
  const { roots, ungrouped } = useMemo(() => buildIssueTree(issues ?? []), [issues])

  // Xoá luôn khi bấm, không hỏi xác nhận. Xoá 1 Epic sẽ kéo theo xoá các Task con của nó
  // (xem issueService.deleteIssue ở backend).
  const handleDeleteIssue = (issue: Issue) => deleteMutation.mutate(issue._id)

  const renderNode = (node: IssueNode, depth: number): ReactNode => {
    const isEpic = node.issue.type === ISSUE_TYPE.EPIC
    const hasChildren = node.children.length > 0
    const collapsed = collapsedIds.has(node.issue._id)
    const canAddChild = isEpic || node.issue.type === ISSUE_TYPE.TASK || node.issue.type === ISSUE_TYPE.BUG
    const isAdding = addingChildFor === node.issue._id

    return (
      <Fragment key={node.issue._id}>
        <IssueRow
          issue={node.issue}
          depth={depth}
          onSelectIssue={onSelectIssue}
          onDeleteIssue={handleDeleteIssue}
          onAddChild={canAddChild ? () => handleStartAddChild(node.issue._id) : undefined}
          toggle={
            isEpic || hasChildren
              ? { collapsed, onToggle: () => toggleCollapsed(node.issue._id), childCount: node.children.length }
              : undefined
          }
        />
        {!collapsed && (
          <>
            {node.children.map((child) => renderNode(child, depth + 1))}
            {isAdding && (
              <InlineAddIssueRow
                depth={depth + 1}
                childType={isEpic ? ISSUE_TYPE.TASK : ISSUE_TYPE.SUBTASK}
                onCancel={() => setAddingChildFor(null)}
                onSubmit={(title) => handleCreateChild(node.issue, title)}
              />
            )}
          </>
        )}
      </Fragment>
    )
  }

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
                  <th className="px-4 py-4 min-w-[320px]">Công việc</th>
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
                      {roots.map((root) => renderNode(root, 0))}
                      {ungrouped.map((node) => renderNode(node, 0))}
                    </>
                  )}
              </tbody>
            </table>

            {roots.length === 0 && ungrouped.length === 0 && (
              <p className="text-xs text-subtle italic py-10 text-center">Chưa có công việc nào.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectListTab
