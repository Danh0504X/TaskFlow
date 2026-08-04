import Modal from '@/components/ui/Modal'
import { useState } from 'react'
import type { IssueStatus } from '../issue.types'

interface SubtaskWarningModalProps {
  open: boolean
  incompleteCount: number
  subtasks: { _id: string; title: string; status: IssueStatus }[]
  onClose: () => void
}

/**
 * [R2.4] Cảnh báo (không chặn) khi MEMBER kéo Task sang IN_REVIEW mà còn subtask chưa DONE.
 * Dùng lại Modal có sẵn (tone='info', layout='compact'). Chỉ có nút Đã hiểu.
 */
const SubtaskWarningModal = ({ open, incompleteCount, subtasks, onClose }: SubtaskWarningModalProps) => {
  const [expanded, setExpanded] = useState(false)
  const incompleteSubtasks = subtasks.filter((subtask) => subtask.status !== 'DONE')
  const doneSubtasks = subtasks.filter((subtask) => subtask.status === 'DONE')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Còn Sub-task chưa hoàn thành"
      tone="info"
      layout="compact"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-pastel-blue text-pastel-blue-ink hover:bg-pastel-blue/70 transition-colors"
        >
          Đã hiểu
        </button>
      }
    >
      <p className="text-sm text-ink leading-relaxed">
        Task này còn{' '}
        <span className="font-bold text-pastel-blue-ink">{incompleteCount}</span> Sub-task chưa hoàn thành.
      </p>
      <p className="text-xs text-muted mt-1.5 leading-relaxed">
        Task vẫn được chuyển sang <span className="font-semibold text-ink">IN_REVIEW</span>.
        Hãy nhắc nhở thành viên hoàn thành các Sub-task trước khi được duyệt.
      </p>

      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="mt-4 flex w-full items-center justify-between rounded-lg border border-hairline bg-canvas px-3 py-2 text-left text-xs font-semibold text-ink transition-colors hover:bg-surface"
      >
        <span>{expanded ? 'Thu gọn danh sách Sub-task' : 'Xem danh sách Sub-task'}</span>
        <span className="text-pastel-blue-ink">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded ? (
        <div className="mt-3 space-y-3 max-h-40 overflow-y-auto rounded-lg border border-hairline bg-surface p-3 text-xs text-ink">
          {subtasks.length === 0 ? (
            <p className="text-muted">Không có Sub-task nào.</p>
          ) : (
            <>
              {incompleteSubtasks.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-muted">Sub-task chưa hoàn thành</div>
                  {incompleteSubtasks.map((subtask) => (
                    <div key={subtask._id} className="rounded-md bg-pastel-red/10 px-2 py-1">
                      {subtask.title}
                    </div>
                  ))}
                </div>
              )}
              {doneSubtasks.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-muted">Sub-task đã hoàn thành</div>
                  {doneSubtasks.map((subtask) => (
                    <div key={subtask._id} className="rounded-md bg-pastel-green/10 px-2 py-1">
                      {subtask.title}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : null}
    </Modal>
  )
}

export default SubtaskWarningModal
