import Modal from '@/components/ui/Modal'

interface ConfirmDoneDialogProps {
  open: boolean
  incompleteCount: number
  onConfirm: () => void
  onCancel: () => void
}

/**
 * [R2.1] Dialog xác nhận khi OWNER kéo Task sang DONE nhưng còn Sub-task chưa hoàn thành.
 * Dùng lại Modal có sẵn (tone='danger', layout='compact').
 */
const ConfirmDoneDialog = ({ open, incompleteCount, onConfirm, onCancel }: ConfirmDoneDialogProps) => {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Còn Sub-task chưa hoàn thành"
      tone="danger"
      layout="compact"
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-muted hover:bg-canvas hover:text-ink border border-hairline transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-pastel-red text-pastel-red-ink hover:bg-pastel-red/70 transition-colors"
          >
            Vẫn đánh dấu DONE
          </button>
        </>
      }
    >
      <p className="text-sm text-ink leading-relaxed">
        Task này còn{' '}
        <span className="font-bold text-pastel-red-ink">{incompleteCount}</span> Sub-task chưa hoàn thành.
      </p>
      <p className="text-xs text-muted mt-1.5 leading-relaxed">
        Bạn có chắc muốn chuyển task sang <span className="font-semibold text-ink">DONE</span> không?
        Các Sub-task sẽ giữ nguyên trạng thái hiện tại.
      </p>
    </Modal>
  )
}

export default ConfirmDoneDialog
