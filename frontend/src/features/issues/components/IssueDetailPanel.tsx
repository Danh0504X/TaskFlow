import { useState, type FormEvent } from 'react'
import { X, Share2, Eye, MoreHorizontal, Layers, Calendar, Send } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Spinner from '@/components/ui/Spinner'
import { useIssue } from '../hooks/useIssues'
import type { IssueStatus, IssuePriority } from '../issue.types'

interface Comment {
  id: string
  authorName: string
  authorAvatar: string | null
  time: string
  text: string
}

interface IssueDetailPanelProps {
  issueKey: string
  onClose: () => void
}

/** Panel chi tiết issue dạng slide-over. Trạng thái/mô tả/bình luận chỉnh sửa cục bộ (mock, chưa lưu backend). */
const IssueDetailPanel = ({ issueKey, onClose }: IssueDetailPanelProps) => {
  const { data: issue, isLoading } = useIssue(issueKey)

  // Nạp lại state chỉnh sửa cục bộ mỗi khi issue đổi (panel không unmount khi chuyển
  // từ issue này sang issue khác) — theo mẫu "Adjusting state on render" của React,
  // tránh gọi setState trong useEffect (react-hooks/set-state-in-effect).
  const [loadedIssueId, setLoadedIssueId] = useState<string | null>(null)
  const [status, setStatus] = useState<IssueStatus>('TODO')
  const [priority, setPriority] = useState<IssuePriority>('MEDIUM')
  const [description, setDescription] = useState('')
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<Comment[]>([])

  if (issue && issue._id !== loadedIssueId) {
    setLoadedIssueId(issue._id)
    setStatus(issue.status)
    setPriority(issue.priority)
    setDescription(issue.description ?? '')
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

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] md:w-[580px] bg-white border-l border-line/30 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="px-6 py-4 border-b border-line/20 flex justify-between items-center bg-slate-50/50 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted">Issue</span>
          <span className="text-xs text-muted">/</span>
          <span className="text-xs font-extrabold text-brand tracking-wider">{issueKey}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-slate-100 rounded-lg text-muted transition-all">
            <Share2 size={15} />
          </button>
          <button className="p-1.5 hover:bg-slate-100 rounded-lg text-muted transition-all">
            <Eye size={15} />
          </button>
          <button className="p-1.5 hover:bg-slate-100 rounded-lg text-muted transition-all">
            <MoreHorizontal size={15} />
          </button>
          <div className="w-px h-5 bg-line/20 mx-1" />
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-muted hover:text-ink transition-all">
            <X size={16} />
          </button>
        </div>
      </div>

      {isLoading || !issue ? (
        <div className="flex-1 flex items-center justify-center text-muted">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-brand/5 text-brand rounded text-[9px] font-bold uppercase tracking-wider mb-2">
                {issue.type}
              </span>
              <h2 className="text-lg font-extrabold text-ink leading-snug">{issue.summary}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 border border-line/15 rounded-2xl bg-slate-50/50">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Trạng thái</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as IssueStatus)}
                  className="w-full bg-white border border-line/25 rounded-xl px-2.5 py-1.5 text-xs font-bold text-ink focus:ring-2 focus:ring-brand/20 outline-none appearance-none cursor-pointer"
                >
                  <option value="TODO">Cần làm</option>
                  <option value="IN_PROGRESS">Đang làm</option>
                  <option value="IN_REVIEW">Đang đánh giá</option>
                  <option value="DONE">Hoàn thành</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Độ ưu tiên</span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as IssuePriority)}
                  className="w-full bg-white border border-line/25 rounded-xl px-2.5 py-1.5 text-xs font-bold text-ink focus:ring-2 focus:ring-brand/20 outline-none appearance-none cursor-pointer"
                >
                  <option value="LOW">Thấp</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="HIGH">Cao</option>
                  <option value="URGENT">Khẩn cấp</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-line/10">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted">Người thực hiện</span>
                {issue.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar src={issue.assignee.avatarUrl} name={issue.assignee.fullName} size={20} />
                    <span className="text-ink font-bold">{issue.assignee.fullName}</span>
                  </div>
                ) : (
                  <span className="text-subtle">Chưa phân công</span>
                )}
              </div>

              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted">Người báo cáo</span>
                {issue.reporter ? (
                  <div className="flex items-center gap-2">
                    <Avatar src={issue.reporter.avatarUrl} name={issue.reporter.fullName} size={20} />
                    <span className="text-ink font-bold">{issue.reporter.fullName}</span>
                  </div>
                ) : (
                  <span className="text-subtle">—</span>
                )}
              </div>

              {issue.epicName && (
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-muted">Epic</span>
                  <span className="text-ink font-bold flex items-center gap-1.5">
                    <Layers size={12} className="text-brand" />
                    <span>{issue.epicName}</span>
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-muted">Hạn hoàn thành</span>
                <span className="text-ink font-bold flex items-center gap-1.5">
                  <Calendar size={12} className="text-muted" />
                  <span>{issue.dueDate ?? '—'}</span>
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-line/10">
              <label className="text-xs font-extrabold text-ink uppercase tracking-wider block">Mô tả công việc</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-slate-50 border border-line/25 rounded-2xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none transition-all resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-line/10">
              <label className="text-xs font-extrabold text-ink uppercase tracking-wider block">Thảo luận & Bình luận</label>
              <div className="space-y-3.5 max-h-40 overflow-y-auto pr-1">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3 items-start p-2.5 hover:bg-slate-50 rounded-xl transition-all">
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

          <form onSubmit={handleAddComment} className="p-4 border-t border-line/20 bg-slate-50/50 flex gap-2 items-center shrink-0">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Viết phản hồi công việc..."
              className="flex-grow bg-white border border-line/25 rounded-xl px-4 py-2 text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none transition-all placeholder:text-subtle"
            />
            <button
              type="submit"
              className="p-2 bg-brand text-white hover:bg-brand-light rounded-xl shadow-md shadow-brand/10 transition-all shrink-0 active:scale-95"
            >
              <Send size={14} />
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export default IssueDetailPanel
