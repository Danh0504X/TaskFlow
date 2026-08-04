import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'motion/react'
import { X, Send, Plus } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Spinner from '@/components/ui/Spinner'
import IssueTypeIcon from '@/components/ui/IssueTypeIcon'
import { useAuthStore } from '@/features/auth/authStore'
import { useProject } from '@/features/projects/hooks/useProject'
import { useUpdateIssue, useUpdateIssueStatus, useCreateIssue } from '../hooks/useIssueMutations'
import { useProjectIssues } from '../hooks/useIssues'
import { issueKeys } from '../issue.keys'
import StatusPicker from './StatusPicker'
import PriorityPicker from './PriorityPicker'
import AssigneePicker from './AssigneePicker'
import EpicPicker from './EpicPicker'
import { ISSUE_TYPE, type Issue, type IssueStatus, type IssuePriority } from '../issue.types'

interface Comment {
  id: string
  authorName: string
  authorAvatar: string | null
  time: string
  text: string
}

interface IssueDetailPanelProps {
  /** Issue đã được resolve sẵn từ danh sách đang có trong cache (Board/List/Backlog/MyTasks). */
  issue: Issue | null | undefined
  projectId: string
  isLoading?: boolean
  onClose: () => void
  /** Mở panel này cho 1 issue khác theo key — dùng để "đi vào" 1 subtask từ danh sách việc con. */
  onSelectIssue: (key: string) => void
}

/** `parentIssueId` là object đã populate ({_id, title, type}) khi có, hoặc string thô lúc gửi lên. */
const getParentId = (issue: Pick<Issue, 'parentIssueId'>): string | null => {
  if (!issue.parentIssueId) return null
  return typeof issue.parentIssueId === 'string' ? issue.parentIssueId : issue.parentIssueId._id
}

interface SubtaskQuickAddProps {
  onSubmit: (title: string) => void
  pending: boolean
}

/** Ô nhập luôn hiển thị ở cuối danh sách việc con — Enter hoặc bấm nút gửi để tạo, không cần mở rộng trước. */
const SubtaskQuickAdd = ({ onSubmit, pending }: SubtaskQuickAddProps) => {
  const [value, setValue] = useState('')

  const commit = () => {
    const trimmed = value.trim()
    if (!trimmed || pending) return
    onSubmit(trimmed)
    setValue('')
  }

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      // Không cho Escape ở đây "leo" lên document và đóng luôn panel chi tiết.
      e.stopPropagation()
      setValue('')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        disabled={pending}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Thêm việc con..."
        className="flex-1 min-w-0 bg-surface border border-hairline rounded-lg px-3 py-2 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-brand/15 focus:border-ink/20 placeholder:text-subtle disabled:opacity-60"
      />
      <button
        type="button"
        onClick={commit}
        disabled={!value.trim() || pending}
        className="p-2 bg-pastel-blue text-pastel-blue-ink hover:bg-ink hover:text-canvas rounded-lg transition-colors shrink-0 disabled:opacity-40 disabled:hover:bg-pastel-blue disabled:hover:text-pastel-blue-ink"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

/**
 * Panel chi tiết issue dạng slide-over. Trạng thái/độ ưu tiên/mô tả chỉnh sửa cục bộ trong lúc mở,
 * lưu thật (PUT /issues/:id) khi đóng panel — không lưu theo từng phím gõ để tránh spam API.
 * Tên, người thực hiện, epic lưu ngay khi đổi (nhất quán với AssigneePicker ở Board/List).
 * Bình luận vẫn là mock cục bộ, chưa có API bình luận ở backend.
 */
const IssueDetailPanel = ({ issue, projectId, isLoading, onClose, onSelectIssue }: IssueDetailPanelProps) => {
  const currentUser = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const { data: project } = useProject(projectId)
  const { data: allIssues } = useProjectIssues(projectId)
  const updateMutation = useUpdateIssue(projectId)
  const silentUpdateMutation = useUpdateIssue(projectId, { silent: true })
  const statusMutation = useUpdateIssueStatus(projectId)
  const createSubtaskMutation = useCreateIssue(projectId, { silent: true })
  const reduceMotion = useReducedMotion()

  const userMemberRecord = project?.members?.find((m) => m.userId === currentUser?._id)
  const isOwner = userMemberRecord?.role === 'OWNER'

  // `useCreateIssue`/`useUpdateIssue`/`useUpdateIssueStatus` (dùng chung toàn app) chỉ
  // `invalidateQueries` sau khi lưu -> UI phải đợi thêm 1 lượt GET nền mới thấy thay đổi,
  // cảm giác trễ khi thêm/sửa liên tục (vd thêm nhiều subtask). Ghi thẳng kết quả trả về
  // vào cache của đúng query mà panel này đang đọc (`useProjectIssues(projectId)`, không
  // filter) để cập nhật UI ngay lập tức; invalidate ở hook dùng chung vẫn chạy song song
  // để đồng bộ lại các query khác (Board/List/Backlog có filter riêng).
  const listQueryKey = issueKeys.list(projectId)
  const upsertIssueInCache = (updated: Issue) => {
    queryClient.setQueryData<Issue[]>(listQueryKey, (old) =>
      old?.map((i) => (i._id === updated._id ? updated : i)),
    )
  }
  const appendIssueToCache = (created: Issue) => {
    queryClient.setQueryData<Issue[]>(listQueryKey, (old) => (old ? [...old, created] : old))
  }

  // Nạp lại state chỉnh sửa cục bộ mỗi khi issue đổi (panel không unmount khi chuyển
  // từ issue này sang issue khác) — theo mẫu "Adjusting state on render" của React,
  // tránh gọi setState trong useEffect (react-hooks/set-state-in-effect).
  const [loadedIssueId, setLoadedIssueId] = useState<string | null>(null)
  const [status, setStatus] = useState<IssueStatus>('TODO')
  const [priority, setPriority] = useState<IssuePriority>('MEDIUM')
  const [description, setDescription] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const titleInputRef = useRef<HTMLInputElement>(null)

  if (issue && issue._id !== loadedIssueId) {
    setLoadedIssueId(issue._id)
    setStatus(issue.status)
    setPriority(issue.priority)
    setDescription(issue.description ?? '')
    setIsEditingTitle(false)
  }

  // Đóng panel (nút X, bấm ra ngoài, phím Escape) đều đi qua đây: chỉ gọi API nếu có
  // thay đổi thật so với issue gốc, rồi đóng ngay — không chặn UI chờ request xong.
  // Nếu CHỈ status đổi -> dùng PATCH .../status (OWNER+MEMBER, nhất quán với kéo-thả ở
  // Board/Backlog, và tự động hưởng cơ chế khóa-Scrum khi dự án là Scrum). Nếu priority/
  // description cũng đổi -> vẫn dùng PUT (OWNER-only, giữ nguyên quyền hiện hành cho 2 field đó).
  const handleClose = () => {
    if (issue) {
      const statusChanged = status !== issue.status
      const otherFieldsChanged =
        priority !== issue.priority || description !== (issue.description ?? '')

      if (otherFieldsChanged) {
        updateMutation.mutate({
          issueId: issue._id,
          payload: { status, priority, description },
        })
      } else if (statusChanged) {
        statusMutation.mutate({
          issueId: issue._id,
          payload: { status },
        })
      }
    }
    onClose()
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issue, status, priority, description])

  const startEditingTitle = () => {
    if (!issue || !isOwner) return
    setTitleDraft(issue.title)
    setIsEditingTitle(true)
  }

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus()
  }, [isEditingTitle])

  const commitTitle = () => {
    if (!issue) return
    const trimmed = titleDraft.trim()
    setIsEditingTitle(false)
    if (trimmed && trimmed !== issue.title) {
      silentUpdateMutation.mutate(
        { issueId: issue._id, payload: { title: trimmed } },
        { onSuccess: upsertIssueInCache },
      )
    }
  }

  const handleTitleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitTitle()
    } else if (e.key === 'Escape') {
      e.stopPropagation()
      setIsEditingTitle(false)
    }
  }

  const handleAssigneeChange = (userId: string | null) => {
    if (!issue) return
    silentUpdateMutation.mutate(
      { issueId: issue._id, payload: { assigneeId: userId } },
      { onSuccess: upsertIssueInCache },
    )
  }

  const handleEpicChange = (epicId: string | null) => {
    if (!issue) return
    silentUpdateMutation.mutate(
      { issueId: issue._id, payload: { parentIssueId: epicId } },
      { onSuccess: upsertIssueInCache },
    )
  }

  const handleCreateSubtask = (title: string) => {
    if (!issue) return
    createSubtaskMutation.mutate(
      { title, type: ISSUE_TYPE.SUBTASK, parentIssueId: issue._id },
      { onSuccess: appendIssueToCache },
    )
  }

  const handleAddComment = (e: FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setComments((prev) => [
      ...prev,
      { id: Date.now().toString(), authorName: 'Bạn', authorAvatar: null, time: 'Vừa xong', text: commentText.trim() },
    ])
    setCommentText('')
  }

  const canHaveEpic = !!issue && (issue.type === ISSUE_TYPE.TASK || issue.type === ISSUE_TYPE.BUG)
  const canHaveSubtasks = canHaveEpic
  const subtasks = issue ? (allIssues ?? []).filter((i) => i.type === ISSUE_TYPE.SUBTASK && getParentId(i) === issue._id) : []
  const doneSubtasks = subtasks.filter((s) => s.status === 'DONE').length
  const subtaskProgress = subtasks.length > 0 ? Math.round((doneSubtasks / subtasks.length) * 100) : 0

  return (
    <>
      <motion.div
        onClick={handleClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      />
      <motion.div
        className="fixed inset-y-0 right-0 w-full sm:w-[480px] md:w-[580px] bg-surface border-l border-hairline shadow-[-24px_0_70px_-20px_rgba(11,28,48,0.35)] z-50 flex flex-col"
        initial={reduceMotion ? false : { x: '100%' }}
        animate={{ x: 0 }}
        exit={reduceMotion ? undefined : { x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      >
        <div className="px-6 py-4 border-b border-hairline flex justify-between items-center bg-canvas shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted">Issue</span>
            <span className="text-xs text-muted">/</span>
            <span className="text-xs font-extrabold text-brand tracking-wider">{issue?.key}</span>
          </div>
          <button onClick={handleClose} className="p-1.5 hover:bg-surface rounded-md text-muted hover:text-ink transition-colors">
            <X size={16} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-muted">
            <Spinner />
          </div>
        ) : !issue ? (
          // Có thể xảy ra khi đi từ 1 subtask sang issue khác không nằm trong danh sách đang
          // cache ở trang hiện tại (vd "Công việc của tôi" chỉ chứa issue được giao cho mình).
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted p-6 text-center">
            <p className="text-xs font-semibold">Không tìm thấy issue này trong danh sách hiện tại.</p>
            <button onClick={onClose} className="text-brand text-xs font-bold hover:underline">
              Đóng
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-pastel-blue text-pastel-blue-ink rounded text-[9px] font-bold uppercase tracking-wider mb-2">
                  <IssueTypeIcon type={issue.type} size={11} />
                  {issue.type}
                </span>
                {isEditingTitle ? (
                  <input
                    ref={titleInputRef}
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={commitTitle}
                    onKeyDown={handleTitleKeyDown}
                    className="w-full text-lg font-semibold text-ink leading-snug bg-surface border border-ink/20 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-brand/15 -mx-3"
                  />
                ) : (
                  <h2
                    onClick={startEditingTitle}
                    className={`text-lg font-semibold text-ink leading-snug rounded-lg px-3 py-1.5 -mx-3 transition-colors ${isOwner ? 'cursor-text hover:bg-canvas' : ''}`}
                    title={isOwner ? 'Bấm để đổi tên' : undefined}
                  >
                    {issue.title}
                  </h2>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 border border-hairline rounded-lg bg-canvas">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Trạng thái</span>
                  <StatusPicker value={status} onChange={setStatus} />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Độ ưu tiên</span>
                  <PriorityPicker value={priority} onChange={setPriority} readOnly={!isOwner} />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Người thực hiện</span>
                  <div className="flex items-center gap-2">
                    <AssigneePicker
                      projectId={projectId}
                      value={issue.assigneeId ?? null}
                      onChange={handleAssigneeChange}
                      size={22}
                      readOnly={!isOwner}
                    />
                    <span className="text-xs font-semibold text-ink truncate">
                      {issue.assignee?.fullName ?? 'Chưa gán'}
                    </span>
                  </div>
                </div>

                {canHaveEpic && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Epic</span>
                    <EpicPicker
                      projectId={projectId}
                      issues={allIssues ?? []}
                      value={getParentId(issue)}
                      onChange={handleEpicChange}
                      excludeIssueId={issue._id}
                      readOnly={!isOwner}
                    />
                  </div>
                )}
              </div>

              {canHaveSubtasks && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink uppercase tracking-wider">Việc con</span>
                    {subtasks.length > 0 && (
                      <span className="text-[10px] font-bold text-muted">
                        {doneSubtasks}/{subtasks.length} hoàn thành
                      </span>
                    )}
                  </div>

                  {subtasks.length > 0 && (
                    <div className="h-1.5 rounded-full bg-canvas overflow-hidden">
                      <div
                        className="h-full bg-pastel-green-ink rounded-full transition-all"
                        style={{ width: `${subtaskProgress}%` }}
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    {subtasks.map((subtask) => (
                      <div
                        key={subtask._id}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-canvas transition-colors group"
                      >
                        <StatusPicker
                          value={subtask.status}
                          onChange={(next) =>
                            statusMutation.mutate(
                              { issueId: subtask._id, payload: { status: next } },
                              { onSuccess: upsertIssueInCache },
                            )
                          }
                          readOnly={!isOwner && subtask.assigneeId !== currentUser?._id}
                        />
                        <button
                          type="button"
                          onClick={() => onSelectIssue(subtask.key)}
                          className="flex-1 min-w-0 text-left text-xs font-semibold text-ink group-hover:text-brand truncate transition-all"
                        >
                          {subtask.title}
                        </button>
                        <AssigneePicker
                          projectId={projectId}
                          value={subtask.assigneeId ?? null}
                          onChange={(userId) =>
                            silentUpdateMutation.mutate(
                              { issueId: subtask._id, payload: { assigneeId: userId } },
                              { onSuccess: upsertIssueInCache },
                            )
                          }
                          size={20}
                          readOnly={!isOwner}
                        />
                      </div>
                    ))}
                  </div>

                  {isOwner && <SubtaskQuickAdd onSubmit={handleCreateSubtask} pending={createSubtaskMutation.isPending} />}
                </div>
              )}

              <div className="space-y-2 pt-4 border-t border-hairline">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block">Mô tả công việc</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-surface border border-hairline rounded-lg px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-brand/15 focus:border-ink/20 outline-none transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-hairline">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block">Thảo luận & Bình luận</label>
                <div className="space-y-3.5 max-h-40 overflow-y-auto pr-1">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3 items-start p-2.5 hover:bg-canvas rounded-lg transition-colors">
                      <Avatar src={c.authorAvatar} name={c.authorName} size={28} />
                      <div className="flex-grow">
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-xs text-ink leading-none">{c.authorName}</span>
                          <span className="text-[10px] text-muted font-medium">{c.time}</span>
                        </div>
                        <p className="text-xs text-muted leading-relaxed mt-1 font-semibold">{c.text}</p>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-xs text-subtle italic">Chưa có bình luận nào.</p>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleAddComment} className="p-4 border-t border-hairline bg-canvas flex gap-2 items-center shrink-0">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Viết phản hồi công việc..."
                className="flex-grow bg-surface border border-hairline rounded-lg px-4 py-2 text-xs font-semibold focus:ring-2 focus:ring-brand/15 focus:border-ink/20 outline-none transition-all placeholder:text-subtle"
              />
              <button
                type="submit"
                className="p-2 bg-ink text-canvas hover:bg-[#e4e4e5] rounded-lg transition-colors shrink-0 active:scale-[0.98]"
              >
                <Send size={14} />
              </button>
            </form>
          </>
        )}
      </motion.div>
    </>
  )
}

export default IssueDetailPanel