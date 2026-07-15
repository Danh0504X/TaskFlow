import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
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
  const reduceMotion = useReducedMotion()

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

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* Nền mờ — click ra ngoài để đóng. */}
          <motion.div
            className="absolute inset-0 bg-ink/30 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />

          {/* Khung nội dung. */}
          <motion.div
            className={cn(
              'relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-[0_24px_70px_-20px_rgba(11,28,48,0.35)] ring-1 ring-ink/5',
              className,
            )}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-line/15 px-6 py-4">
                <h2 className="text-base font-bold text-ink">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-lg text-muted transition-all hover:bg-slate-100 hover:text-ink"
                  aria-label="Đóng"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="px-6 py-5">{children}</div>

            {footer && (
              <div className="flex justify-end gap-2 border-t border-line/15 px-6 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default Modal
