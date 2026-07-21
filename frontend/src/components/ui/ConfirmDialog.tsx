import Modal from './Modal'
import Button from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  /** Hiện spinner trên nút xác nhận khi đang xử lý (vd đang gọi API xoá). */
  loading?: boolean
  /** Nút xác nhận màu đỏ (dùng cho hành động nguy hiểm như xoá). */
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
}

/** Hộp thoại xác nhận dùng chung (xoá, hành động nguy hiểm...). */
const ConfirmDialog = ({
  open,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Huỷ',
  loading = false,
  danger = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      layout="compact"
      tone={danger ? 'danger' : 'brand'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">{message}</p>
    </Modal>
  )
}

export default ConfirmDialog
