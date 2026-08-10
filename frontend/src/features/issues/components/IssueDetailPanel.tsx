import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'motion/react'
import { X, Send, Plus, XCircle, AlertTriangle, History, Sparkles } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Spinner from '@/components/ui/Spinner'
import IssueTypeIcon from '@/components/ui/IssueTypeIcon'
import { useAuthStore } from '@/features/auth/authStore'
import { useAiModalStore } from '@/features/ai-lab/aiModalStore'
import { useProject } from '@/features/projects/hooks/useProject'
import { useUpdateIssue, useUpdateIssueStatus, useCreateIssue, useRejectIssue } from '../hooks/useIssueMutations'
import { useIssueComments, useCreateComment, useUpdateComment, useDeleteComment } from '../hooks/useComments'
import { useProjectIssues } from '../hooks/useIssues'
import { issueKeys } from '../issue.keys'
import StatusPicker from './StatusPicker'
import PriorityPicker from './PriorityPicker'
import AssigneePicker from './AssigneePicker'
import EpicPicker from './EpicPicker'
import RejectIssueModal from './RejectIssueModal'
import { CommentItem } from './CommentItem'
import { MentionInput } from './MentionInput'
import { ISSUE_TYPE, type Issue, type IssueStatus, type IssuePriority } from '../issue.types'

interface IssueDetailPanelProps {
  /** Issue đã được resolve sẵn từ danh sách đang có trong cache (Board/List/Backlog/MyTasks). */
  issue: Issue | null | undefined
  projectId: string
  isLoading?: boolean
  onClose: () => void
  /** Mở panel này cho 1 issue khác theo key — dùng để "đi vào" 1 subtask từ danh sách sub-task. */
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

/** Ô nhập luôn hiển thị ở cuối danh sách sub-task — Enter hoặc bấm nút gửi để tạo, không cần mở rộng trước. */
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
        placeholder="Thêm sub-task..."
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
 * Bình luận dùng API thật (useComments.ts) — không còn là mock cục bộ.
 */
const IssueDetailPanel = ({ issue, projectId, isLoading, onClose, onSelectIssue }: IssueDetailPanelProps) => {
  const currentUser = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const { data: project } = useProject(projectId)
  const { data: allIssues } = useProjectIssues(projectId)
  const updateMutation = useUpdateIssue(projectId)
  const silentUpdateMutation = useUpdateIssue(projectId, { silent: true })
  const statusMutation = useUpdateIssueStatus(projectId)
  const rejectMutation = useRejectIssue(projectId)
  const createSubtaskMutation = useCreateIssue(projectId, { silent: true })
  const reduceMotion = useReducedMotion()

  const userMemberRecord = project?.members?.find((m) => m.userId === currentUser?._id)
  const isOwner = userMemberRecord?.role === 'OWNER'
  const openAiForEpic = useAiModalStore((state) => state.openForEpic)
  const [showRejectModal, setShowRejectModal] = useState(false)

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
  const titleInputRef = useRef<HTMLInputElement>(null)

  const issueId = issue?._id
  const { data: comments = [], isLoading: isLoadingComments } = useIssueComments(projectId, issueId)
  const createCommentMutation = useCreateComment(projectId, issueId ?? '')
  const updateCommentMutation = useUpdateComment(projectId, issueId ?? '')
  const deleteCommentMutation = useDeleteComment(projectId, issueId ?? '')

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
    const trimmed = commentText.trim()
    if (!trimmed || !issueId || createCommentMutation.isPending) return
    createCommentMutation.mutate(
      { content: trimmed },
      {
        onSuccess: () => {
          setCommentText('')
        },
      },
    )
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
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-pastel-blue text-pastel-blue-ink rounded text-[9px] font-bold uppercase tracking-wider">
                    <IssueTypeIcon type={issue.type} size={11} />
                    {issue.type}
                  </span>
                  {/* Beta — AI Lab: chỉ epic mới bóc được thành task, chỉ OWNER dùng được. */}
                  {issue.type === ISSUE_TYPE.EPIC && isOwner && (
                    <button
                      type="button"
                      onClick={() => openAiForEpic(projectId, issue._id, issue.title)}
                      className="flex items-center gap-1 text-[10px] font-bold text-brand hover:underline"
                    >
                      <Sparkles size={11} /> Sinh Task bằng AI
                    </button>
                  )}
                </div>
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

              {/* [NEW] Thanh nút Từ chối dành riêng cho Owner khi task đang ở IN_REVIEW */}
              {isOwner && issue.status === 'IN_REVIEW' && (
                <div className="p-3 bg-pastel-yellow/15 border border-pastel-yellow/30 rounded-lg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                    <Sparkles size={15} className="text-pastel-yellow-ink shrink-0" />
                    <span>Task đang chờ duyệt:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(true)}
                    disabled={rejectMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-pastel-red text-pastel-red-ink hover:bg-pastel-red/70 rounded-lg text-xs font-bold transition-colors shadow-sm"
                    title="Từ chối Task"
                  >
                    <XCircle size={14} />
                    Từ chối
                  </button>
                </div>
              )}

              {/* [NEW] Banner hiển thị Lý do từ chối gần nhất (nếu có) */}
              {issue.rejectionHistory && issue.rejectionHistory.length > 0 && (
                <div className="p-3.5 bg-pastel-red/15 border border-pastel-red/30 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-pastel-red-ink font-bold text-xs">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle size={14} />
                      <span>Lý do từ chối gần nhất</span>
                    </div>
                    <span className="text-[10px] text-muted font-normal">
                      {new Date(issue.rejectionHistory[issue.rejectionHistory.length - 1].rejectedAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-xs text-ink font-medium leading-relaxed italic bg-surface/80 p-2.5 rounded-md border border-pastel-red/20">
                    "{issue.rejectionHistory[issue.rejectionHistory.length - 1].reason}"
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 p-4 border border-hairline rounded-lg bg-canvas">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Trạng thái</span>
                  <StatusPicker
                    value={status}
                    onChange={(nextStatus) => {
                      if (issue.status === 'IN_REVIEW' && nextStatus === 'TODO' && isOwner) {
                        setShowRejectModal(true)
                        return
                      }
                      setStatus(nextStatus)
                    }}
                  />
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
                      value={typeof issue.assigneeId === 'object' && issue.assigneeId !== null ? issue.assigneeId._id : (issue.assigneeId ?? null)}
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
                    <span className="text-xs font-semibold text-ink uppercase tracking-wider">Sub-task</span>
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
                          value={typeof subtask.assigneeId === 'object' && subtask.assigneeId !== null ? subtask.assigneeId._id : (subtask.assigneeId ?? null)}
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

              {/* [NEW] Mục Lịch sử từ chối nếu công việc đã từng bị từ chối duyệt */}
              {issue.rejectionHistory && issue.rejectionHistory.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-hairline">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-ink uppercase tracking-wider">
                    <History size={13} className="text-muted" />
                    <span>Lịch sử từ chối ({issue.rejectionHistory.length})</span>
                  </div>
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                    {[...issue.rejectionHistory].reverse().map((item, idx) => {
                      const authorName = typeof item.rejectedBy === 'object' && item.rejectedBy ? item.rejectedBy.fullName : 'Chủ sở hữu'
                      const authorAvatar = typeof item.rejectedBy === 'object' && item.rejectedBy ? item.rejectedBy.avatarUrl : null
                      return (
                        <div key={item._id || idx} className="p-3 bg-canvas border border-hairline rounded-lg space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar src={authorAvatar} name={authorName} size={20} />
                              <span className="text-xs font-bold text-ink">{authorName}</span>
                            </div>
                            <span className="text-[10px] text-muted font-medium">
                              {new Date(item.rejectedAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-xs text-ink font-semibold leading-relaxed bg-surface p-2.5 rounded border border-hairline">
                            {item.reason}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t border-hairline">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block">Thảo luận & Bình luận</label>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {isLoadingComments ? (
                    <div className="flex justify-center py-4">
                      <Spinner className="h-5 w-5" />
                    </div>
                  ) : comments.length > 0 ? (
                    comments.map((c) => (
                      <CommentItem
                        key={c._id}
                        comment={c}
                        projectId={projectId}
                        currentUserId={currentUser?._id}
                        isProjectOwner={isOwner}
                        onUpdate={async (commentId, content) => {
                          await updateCommentMutation.mutateAsync({ commentId, payload: { content } })
                        }}
                        onDelete={async (commentId) => {
                          await deleteCommentMutation.mutateAsync(commentId)
                        }}
                        isUpdating={updateCommentMutation.isPending}
                        isDeleting={deleteCommentMutation.isPending}
                      />
                    ))
                  ) : (
                    <p className="text-xs text-subtle italic">Chưa có bình luận nào.</p>
                  )}
                </div>
              </div>

            </div>

            <form onSubmit={handleAddComment} className="p-4 border-t border-hairline bg-canvas flex gap-2 items-center shrink-0 w-full">
              <MentionInput
                value={commentText}
                onChange={setCommentText}
                projectId={projectId}
                isSingleLine
                placeholder="Viết phản hồi công việc... (gõ @ để nhắc tên)"
                disabled={createCommentMutation.isPending}
                className="flex-grow bg-surface border border-hairline rounded-lg px-4 py-2 text-xs font-semibold focus:ring-2 focus:ring-brand/15 focus:border-ink/20 outline-none transition-all placeholder:text-subtle disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || createCommentMutation.isPending}
                className="p-2 bg-ink text-canvas hover:bg-[#e4e4e5] rounded-lg transition-colors shrink-0 active:scale-[0.98] disabled:opacity-40"
              >
                {createCommentMutation.isPending ? <Spinner className="h-3.5 w-3.5" /> : <Send size={14} />}
              </button>
            </form>
          </>
        )}
      </motion.div>

      {showRejectModal && issue && (
        <RejectIssueModal
          open={showRejectModal}
          issueTitle={issue.title}
          issueKey={issue.key}
          isPending={rejectMutation.isPending}
          onConfirm={(reason) => {
            rejectMutation.mutate(
              { issueId: issue._id, reason },
              {
                onSuccess: (updated) => {
                  setShowRejectModal(false)
                  setStatus('TODO')
                  upsertIssueInCache(updated)
                },
              },
            )
          }}
          onCancel={() => setShowRejectModal(false)}
        />
      )}
    </>
  )
}

export default IssueDetailPanel