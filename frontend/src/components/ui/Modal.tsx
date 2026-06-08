import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Vùng nút hành động ở chân modal (vd Huỷ / Lưu). */
  footer?: ReactNode
  className?: string
}

/**
 * Modal dùng chung: backdrop mờ, đóng bằng Escape / click nền,
 * và khoá cuộn body khi mở. Dùng cho form thêm/sửa, xác nhận...
 */
const Modal = ({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: ModalProps) => {
  // Đóng bằng phím Escape + khoá cuộn nền khi modal mở.
  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Nền mờ — click ra ngoài để đóng. */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Khung nội dung. */}
      <div
        className={cn(
          'relative z-10 w-full max-w-lg rounded-xl bg-white shadow-xl',
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-800">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 transition hover:text-slate-600"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>
        )}

        <div className="px-6 py-5">{children}</div>

        {footer && (
          <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
