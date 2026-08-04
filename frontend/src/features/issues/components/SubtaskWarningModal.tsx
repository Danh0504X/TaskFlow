import Modal from '@/components/ui/Modal'

interface SubtaskWarningModalProps {
  open: boolean
  incompleteCount: number
  onClose: () => void
}

/**
 * [R2.4] Cảnh báo (không chặn) khi MEMBER kéo Task sang IN_REVIEW mà còn subtask chưa DONE.
 * Dùng lại Modal có sẵn (tone='info', layout='compact'). Chỉ có nút Đã hiểu.
 */
const SubtaskWarningModal = ({ open, incompleteCount, onClose }: SubtaskWarningModalProps) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Còn việc con chưa xong"
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
        <span className="font-bold text-pastel-blue-ink">{incompleteCount}</span> việc con chưa hoàn thành.
      </p>
      <p className="text-xs text-muted mt-1.5 leading-relaxed">
        Task vẫn được chuyển sang <span className="font-semibold text-ink">IN_REVIEW</span>. Hãy nhắc nhở
        thành viên hoàn thành các việc con trước khi được duyệt.
      </p>
    </Modal>
  )
}

export default SubtaskWarningModal
