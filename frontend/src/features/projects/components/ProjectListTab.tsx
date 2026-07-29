import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, ChevronRight, Pencil, Trash2, Plus } from 'lucide-react'
import SearchInput from '@/components/ui/SearchInput'
import Spinner from '@/components/ui/Spinner'
import IssueTypeIcon from '@/components/ui/IssueTypeIcon'
import { useAuthStore } from '@/features/auth/authStore'
import { useProject } from '../hooks/useProject'
import { useProjectIssues } from '@/features/issues/hooks/useIssues'
import { useIssueSearch } from '@/features/issues/hooks/useIssueSearch'
import { useCreateIssue, useDeleteIssue, useUpdateIssue, useUpdateIssueStatus } from '@/features/issues/hooks/useIssueMutations'
import AssigneePicker from '@/features/issues/components/AssigneePicker'
import PriorityPicker from '@/features/issues/components/PriorityPicker'
import StatusPicker from '@/features/issues/components/StatusPicker'
import QuickAddIssue from '@/features/issues/components/QuickAddIssue'
import { calculateNewOrderIndex } from '@/lib/dndHelpers'
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

// Độ rộng cố định cho các cột bên phải -> Assignee/Priority/Status/Actions luôn thẳng hàng
// giữa các dòng dù Title thụt lề khác nhau theo độ sâu cây phân cấp.
const COL_ASSIGNEE = 'w-10 flex justify-center shrink-0'
const COL_PRIORITY = 'w-32 shrink-0'
const COL_STATUS = 'w-32 shrink-0'
const COL_ACTIONS = 'w-16 flex items-center justify-end gap-1 shrink-0'

interface IssueRowProps {
  issue: Issue
  projectId: string
  isOwner: boolean
  depth: number
  onSelectIssue: (issueKey: string) => void
  onDeleteIssue: (issue: Issue) => void
  onAddChild?: () => void
  toggle?: { collapsed: boolean; onToggle: () => void; childCount: number }
}

const IssueRow = ({ issue, projectId, isOwner, depth, onSelectIssue, onDeleteIssue, onAddChild, toggle }: IssueRowProps) => {
  const isEpic = issue.type === ISSUE_TYPE.EPIC
  const isDeep = depth >= 2 // Subtask (hoặc sâu hơn) -> chữ nhẹ hơn, mờ hơn Task.

  // silent: các cập nhật tại chỗ (assignee/priority/title) không cần toast — chọn/gõ xong
  // thấy đổi ngay trên dòng là đủ phản hồi, toast liên tục sẽ gây phiền.
  const updateMutation = useUpdateIssue(projectId, { silent: true })
  const updateStatusMutation = useUpdateIssueStatus(projectId)

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(issue.title)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus()
  }, [isEditingTitle])

  const commitTitle = () => {
    const trimmed = titleDraft.trim()
    setIsEditingTitle(false)
    if (!trimmed || trimmed === issue.title) {
      setTitleDraft(issue.title)
      return
    }
    updateMutation.mutate({ issueId: issue._id, payload: { title: trimmed } })
  }

  return (
    <div
      onClick={() => onSelectIssue(issue.key)}
      className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${isEpic ? 'bg-pastel-blue/50 hover:bg-pastel-blue' : 'hover:bg-canvas'
        }`}
    >
      <div className="w-6 flex justify-center shrink-0">
        {toggle ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggle.onToggle()
            }}
            disabled={toggle.childCount === 0}
            className="p-0.5 rounded hover:bg-canvas text-muted group-hover:text-ink transition-colors disabled:opacity-25 disabled:pointer-events-none"
            aria-label={toggle.collapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            {toggle.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>
        ) : null}
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-2.5">
        <IssueTypeIcon type={issue.type} size={isEpic ? 15 : isDeep ? 13 : 14} />
        <span
          className={`shrink-0 font-mono font-semibold ${isDeep ? 'text-[10px]' : 'text-xs'} ${
            issue.status === 'DONE' ? 'line-through text-subtle' : isDeep ? 'text-subtle' : 'text-brand'
          }`}
        >
          {issue.key}
        </span>

        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            value={titleDraft}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitTitle()
              } else if (e.key === 'Escape') {
                setTitleDraft(issue.title)
                setIsEditingTitle(false)
              }
            }}
            className="flex-1 min-w-0 bg-surface border border-ink/20 rounded-lg px-2 py-1 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-brand/15"
          />
        ) : (
          <>
            <span
              className={`truncate font-normal ${isEpic ? 'text-[13px]' : isDeep ? 'text-[11px]' : 'text-xs'} ${
                issue.status === 'DONE' ? 'line-through text-subtle' : isEpic ? 'text-ink' : isDeep ? 'text-muted' : 'text-ink'
              }`}
            >
              {issue.title}
            </span>
            {toggle && toggle.childCount > 0 && (
              <span className="text-[10px] text-subtle font-medium shrink-0">({toggle.childCount})</span>
            )}
            {isOwner && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditingTitle(true)
                }}
                className="p-1 rounded opacity-0 group-hover:opacity-100 text-subtle hover:text-ink hover:bg-canvas transition-all shrink-0"
                aria-label="Sửa tên"
                title="Sửa tên"
              >
                <Pencil size={12} />
              </button>
            )}
            {issue.epicName && (
              <span className="px-2 py-0.5 bg-pastel-blue text-pastel-blue-ink rounded text-[9px] font-bold uppercase tracking-wider shrink-0">
                {issue.epicName}
              </span>
            )}
          </>
        )}
      </div>

      <div className={COL_ASSIGNEE}>
        <AssigneePicker
          projectId={projectId}
          value={issue.assigneeId ?? null}
          onChange={(userId) => updateMutation.mutate({ issueId: issue._id, payload: { assigneeId: userId } })}
          size={26}
          readOnly={!isOwner}
        />
      </div>

      <div className={COL_PRIORITY}>
        <PriorityPicker
          value={issue.priority}
          onChange={(priority) => updateMutation.mutate({ issueId: issue._id, payload: { priority } })}
          readOnly={!isOwner}
        />
      </div>

      <div className={COL_STATUS}>
        <StatusPicker
          value={issue.status}
          onChange={(status) => updateStatusMutation.mutate({ issueId: issue._id, payload: { status } })}
        />
      </div>

      <div className={`${COL_ACTIONS} opacity-0 group-hover:opacity-100 transition-opacity`}>
        {onAddChild && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onAddChild()
            }}
            className="p-1.5 rounded-lg text-subtle hover:bg-pastel-blue hover:text-pastel-blue-ink transition-colors"
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
          className="p-1.5 rounded-lg text-subtle hover:bg-pastel-red hover:text-pastel-red-ink transition-colors"
          aria-label={`Xoá ${issue.key}`}
          title="Xoá issue"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

interface InlineAddIssueRowProps {
  childType: IssueType
  onCancel: () => void
  onSubmit: (title: string) => void
}

/**
 * Dòng nhập liệu tạo nhanh issue con: tự focus khi hiện ra. Enter có nội dung -> lưu, xoá
 * trắng rồi focus lại ngay để gõ tiếp liên tục (không đóng dòng, giống Jira) — dòng chỉ thật
 * sự đóng khi rời khỏi hẳn (blur ra ngoài) hoặc nhấn Escape. `closingRef` chặn đóng 2 lần (vd
 * Escape xử lý xong rồi input vẫn kịp bắn thêm sự kiện blur trước khi dòng này unmount).
 */
const InlineAddIssueRow = ({ childType, onCancel, onSubmit }: InlineAddIssueRowProps) => {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const closingRef = useRef(false)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Enter: lưu xong vẫn giữ dòng mở, xoá trắng + focus lại để thêm cái tiếp theo ngay.
  const commitAndContinue = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setValue('')
    inputRef.current?.focus()
  }

  // Rời khỏi dòng (blur ra ngoài) hoặc Escape: lưu nốt nội dung đang gõ dở (nếu có) rồi đóng hẳn.
  const commitAndClose = () => {
    if (closingRef.current) return
    closingRef.current = true
    const trimmed = value.trim()
    if (trimmed) onSubmit(trimmed)
    onCancel()
  }

  return (
    <div className="flex items-center gap-2 py-1.5 px-3">
      <IssueTypeIcon type={childType} size={14} />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commitAndClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commitAndContinue()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            closingRef.current = true
            onCancel()
          }
        }}
        placeholder={childType === ISSUE_TYPE.SUBTASK ? 'Nhập tên việc con rồi Enter...' : 'Nhập tên công việc rồi Enter...'}
        className="w-full bg-surface border border-ink/20 rounded-lg px-3 py-1.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-brand/15 placeholder:text-subtle placeholder:font-medium"
      />
    </div>
  )
}

const ProjectListTab = ({ projectId, onSelectIssue }: ProjectListTabProps) => {
  const currentUser = useAuthStore((state) => state.user)
  const { data: project } = useProject(projectId)
  const { data: issues, isLoading } = useProjectIssues(projectId)
  const { query, setQuery, filtered } = useIssueSearch(issues)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const [addingChildFor, setAddingChildFor] = useState<string | null>(null)
  const deleteMutation = useDeleteIssue(projectId)
  // silent: thêm liên tục nhiều issue con (Enter không đóng dòng) mà cứ toast từng cái sẽ dồn
  // dập gây phiền — issue mới xuất hiện ngay trong cây là đủ phản hồi rồi.
  const createMutation = useCreateIssue(projectId, { silent: true })

  const userMemberRecord = project?.members?.find((m) => m.userId === currentUser?._id)
  const isOwner = userMemberRecord?.role === 'OWNER'

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

  // Không đóng khung thêm-con ở đây nữa (InlineAddIssueRow tự giữ mở sau khi Enter để gõ tiếp
  // liên tục) — chỉ đóng thật khi InlineAddIssueRow gọi onCancel (rời khỏi dòng/Escape).
  const handleCreateChild = (parentIssue: Issue, title: string) => {
    const childType = parentIssue.type === ISSUE_TYPE.EPIC ? ISSUE_TYPE.TASK : ISSUE_TYPE.SUBTASK
    createMutation.mutate({ title, type: childType, parentIssueId: parentIssue._id })
  }

  const isSearching = query.trim().length > 0
  const { roots, ungrouped } = useMemo(() => buildIssueTree(issues ?? []), [issues])

  // Danh sách issue gốc (không nằm trong Epic nào) đã sắp theo orderIndex -> tính vị trí
  // "cuối danh sách" cho issue mới tạo từ quick-add.
  const topLevelIssues = useMemo(
    () => [...roots, ...ungrouped].map((n) => n.issue).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)),
    [roots, ungrouped],
  )

  // Xoá luôn khi bấm, không hỏi xác nhận. Xoá 1 Epic sẽ kéo theo xoá các Task con của nó
  // (xem issueService.deleteIssue ở backend).
  const handleDeleteIssue = (issue: Issue) => deleteMutation.mutate(issue._id)

  const renderNode = (node: IssueNode, depth: number): ReactNode => {
    const isEpic = node.issue.type === ISSUE_TYPE.EPIC
    const hasChildren = node.children.length > 0
    const collapsed = collapsedIds.has(node.issue._id)
    const canAddChild = isEpic || node.issue.type === ISSUE_TYPE.TASK || node.issue.type === ISSUE_TYPE.BUG
    const isAdding = addingChildFor === node.issue._id
    const showChildrenBlock = hasChildren || isAdding

    return (
      <div key={node.issue._id}>
        <IssueRow
          issue={node.issue}
          projectId={projectId}
          isOwner={isOwner}
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
        <AnimatePresence initial={false}>
          {!collapsed && showChildrenBlock && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="overflow-hidden ml-6 border-l border-hairline pl-3"
            >
              {node.children.map((child) => renderNode(child, depth + 1))}
              {isAdding && (
                <InlineAddIssueRow
                  childType={isEpic ? ISSUE_TYPE.TASK : ISSUE_TYPE.SUBTASK}
                  onCancel={() => setAddingChildFor(null)}
                  onSubmit={(title) => handleCreateChild(node.issue, title)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 py-3.5 px-5 bg-surface rounded-lg border border-hairline">
        <SearchInput
          containerClassName="max-w-md"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm công việc..."
        />
      </div>

      <div className="bg-surface border border-hairline rounded-lg p-3">
        {isLoading ? (
          <div className="py-12 flex justify-center text-muted">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="sticky top-0 z-10 flex items-center gap-3 px-3 py-2 text-[10px] font-bold text-muted uppercase tracking-wider bg-surface border-b border-hairline rounded-t-lg">
              <div className="w-6 shrink-0" />
              <div className="flex-1 min-w-0">Công việc</div>
              <div className={COL_ASSIGNEE}>Người thực hiện</div>
              <div className={COL_PRIORITY}>Độ ưu tiên</div>
              <div className={COL_STATUS}>Trạng thái</div>
              <div className={COL_ACTIONS} />
            </div>

            <div className="space-y-0.5">
              {isSearching
                ? filtered.map((issue) => (
                  <IssueRow
                    key={issue._id}
                    issue={issue}
                    projectId={projectId}
                    isOwner={isOwner}
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
            </div>

            {!isSearching && isOwner && (
              <div className="px-1 pt-1.5">
                <QuickAddIssue
                  projectId={projectId}
                  targetSprintId={null}
                  nextOrderIndex={calculateNewOrderIndex(topLevelIssues, topLevelIssues.length)}
                  allowTypeSelection
                />
              </div>
            )}

            {roots.length === 0 && ungrouped.length === 0 && (
              <p className="text-xs text-subtle italic py-10 text-center">Chưa có công việc nào.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ProjectListTab