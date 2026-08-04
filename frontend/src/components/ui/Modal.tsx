import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { AlertTriangle, CheckCircle2, Info, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/cn'

export type ModalTone = 'brand' | 'success' | 'danger' | 'info'
export type ModalLayout = 'center' | 'compact' | 'sheet' | 'wide'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Vùng nút hành động ở chân modal (vd Huỷ / Lưu). */
  footer?: ReactNode
  className?: string
  /** Sắc thái modal — quyết định màu icon ở header. Mặc định 'brand' (form tạo/sửa thông thường, trung tính). */
  tone?: ModalTone
  /** Bố cục: 'center' (mặc định, form thường), 'compact' (xác nhận ngắn gọn), 'sheet' (trượt lên từ đáy),
   * 'wide' (rộng, dùng cho nội dung nhiều cột như modal Sinh AI + lịch sử). */
  layout?: ModalLayout
  /** Icon tuỳ chỉnh ở header, thay cho icon mặc định theo `tone`. Chỉ hiện khi có `title`. */
  icon?: ReactNode
}

// brand = trung tính (form tạo/sửa thông thường, không cần nhấn màu); success/danger/info dùng
// đúng 3 pastel tương ứng trong bộ token chung — khớp với priority/status badge trong app.
const toneConfig: Record<ModalTone, { Icon: typeof Sparkles; chip: string }> = {
  brand: { Icon: Sparkles, chip: 'bg-canvas text-ink' },
  success: { Icon: CheckCircle2, chip: 'bg-pastel-green text-pastel-green-ink' },
  danger: { Icon: AlertTriangle, chip: 'bg-pastel-red text-pastel-red-ink' },
  info: { Icon: Info, chip: 'bg-pastel-blue text-pastel-blue-ink' },
}

const layoutMaxWidth: Record<ModalLayout, string> = {
  center: 'max-w-lg',
  compact: 'max-w-sm',
  sheet: 'max-w-lg',
  wide: 'max-w-7xl',
}

/**
 * Modal dùng chung: backdrop mờ, đóng bằng Escape / click nền, và khoá cuộn body khi mở.
 * Dùng cho form thêm/sửa, xác nhận...
 *
 * `tone` chỉ đổi màu icon-chip ở header (brand = trung tính mặc định, success/danger/info
 * dùng đúng pastel đã dùng cho badge/trạng thái trong app). `layout` đổi kích thước + cách
 * vào màn hình: 'compact' cho xác nhận ngắn, 'sheet' trượt lên từ đáy màn hình (hợp cho nội
 * dung dài trên mobile). Cả 2 đều thuần visual — không đổi hành vi đóng/mở.
*/
const Modal = ({
  open,
  onClose,
  title,
  children,
  footer,
  className,
  tone = 'brand',
  layout = 'center',
  icon,
}: ModalProps) => {
  const reduceMotion = useReducedMotion()
  const { Icon, chip } = toneConfig[tone]
  const isSheet = layout === 'sheet'

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
          className={cn('fixed inset-0 z-50 flex justify-center p-4', isSheet ? 'items-end pb-0' : 'items-center')}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* Nền mờ — click ra ngoài để đóng. */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />

          {/* Khung nội dung. */}
          <motion.div
            className={cn(
              'relative z-10 w-full rounded-lg bg-surface border border-hairline',
              layoutMaxWidth[layout],
              isSheet && 'rounded-b-none',
              className,
            )}
            initial={
              reduceMotion
                ? false
                : isSheet
                  ? { opacity: 0, y: 48 }
                  : { opacity: 0, scale: 0.96, y: 8 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              reduceMotion
                ? undefined
                : isSheet
                  ? { opacity: 0, y: 32, transition: { duration: 0.16 } }
                  : { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.16 } }
            }
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            {title && (
              <div className="relative flex items-start justify-between gap-3 border-b border-hairline px-6 py-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', chip)}>
                    {icon ?? <Icon size={18} />}
                  </div>
                  <h2 className="pt-1.5 text-base font-semibold text-ink">{title}</h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-canvas hover:text-ink"
                  aria-label="Đóng"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="relative px-6 py-5">{children}</div>

            {footer && <div className="relative flex justify-end gap-2 border-t border-hairline px-6 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default Modal
