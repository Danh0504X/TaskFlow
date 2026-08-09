import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'

interface RejectIssueModalProps {
  open: boolean
  issueTitle: string
  issueKey: string
  isPending?: boolean
  onConfirm: (reason: string) => void
  onCancel: () => void
}

/**
 * Modal bắt buộc Owner nhập lý do từ chối một Task đang ở trạng thái IN_REVIEW.
 * Tự động reset và validate lý do trước khi gửi.
 */
const RejectIssueModal = ({
  open,
  issueTitle,
  issueKey,
  isPending = false,
  onConfirm,
  onCancel,
}: RejectIssueModalProps) => {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setReason('')
      setError(null)
    }
  }, [open])

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = reason.trim()
    if (!trimmed) {
      setError('Vui lòng nhập lý do từ chối (không được để trống)')
      return
    }
    setError(null)
    onConfirm(trimmed)
  }

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={`Từ chối công việc ${issueKey}`}
      tone="danger"
      layout="center"
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-muted hover:bg-canvas hover:text-ink border border-hairline transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isPending || !reason.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-pastel-red text-pastel-red-ink hover:bg-pastel-red/70 transition-colors disabled:opacity-50"
          >
            {isPending && <Spinner className="w-3.5 h-3.5" />}
            <span>Xác nhận từ chối</span>
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-xs text-muted mb-1">Công việc:</p>
          <p className="text-sm font-semibold text-ink line-clamp-2 bg-canvas p-2.5 rounded-lg border border-hairline">
            {issueTitle}
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-ink uppercase tracking-wider block">
            Lý do từ chối <span className="text-pastel-red-ink">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              if (error && e.target.value.trim()) setError(null)
            }}
            placeholder="Mô tả cụ thể lý do từ chối để người thực hiện biết cần chỉnh sửa gì..."
            rows={4}
            disabled={isPending}
            className="w-full bg-surface border border-hairline rounded-lg p-3 text-xs font-medium text-ink placeholder:text-subtle focus:ring-2 focus:ring-pastel-red-ink/20 focus:border-pastel-red-ink/40 outline-none transition-all resize-none"
            autoFocus
          />
          {error && (
            <p className="text-[11px] font-semibold text-pastel-red-ink animate-in fade-in duration-150">
              {error}
            </p>
          )}
        </div>
      </form>
    </Modal>
  )
}

export default RejectIssueModal
