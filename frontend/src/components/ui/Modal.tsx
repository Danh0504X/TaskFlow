import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { AlertTriangle, CheckCircle2, Info, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/cn'

export type ModalTone = 'brand' | 'success' | 'danger' | 'info'
export type ModalLayout = 'center' | 'compact' | 'sheet'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Vùng nút hành động ở chân modal (vd Huỷ / Lưu). */
  footer?: ReactNode
  className?: string
  /** Sắc thái modal — quyết định màu icon/glow/shadow. Mặc định 'brand' (form tạo/sửa thông thường). */
  tone?: ModalTone
  /** Bố cục: 'center' (mặc định, form thường), 'compact' (xác nhận ngắn gọn), 'sheet' (trượt lên từ đáy). */
  layout?: ModalLayout
  /** Icon tuỳ chỉnh ở header, thay cho icon mặc định theo `tone`. Chỉ hiện khi có `title`. */
  icon?: ReactNode
}

const toneConfig: Record<ModalTone, { Icon: typeof Sparkles; chip: string; glow: string; shadow: string }> = {
  brand: { Icon: Sparkles, chip: 'bg-brand/10 text-brand', glow: 'bg-brand/35', shadow: 'shadow-brand/20' },
  success: {
    Icon: CheckCircle2,
    chip: 'bg-emerald-100 text-emerald-600',
    glow: 'bg-emerald-400/30',
    shadow: 'shadow-emerald-500/20',
  },
  danger: {
    Icon: AlertTriangle,
    chip: 'bg-red-100 text-red-600',
    glow: 'bg-red-400/30',
    shadow: 'shadow-red-500/20',
  },
  info: { Icon: Info, chip: 'bg-blue-100 text-blue-600', glow: 'bg-blue-400/30', shadow: 'shadow-blue-500/20' },
}

const layoutMaxWidth: Record<ModalLayout, string> = {
  center: 'max-w-lg',
  compact: 'max-w-sm',
  sheet: 'max-w-lg',
}

/**
 * Modal dùng chung: backdrop mờ, đóng bằng Escape / click nền, và khoá cuộn body khi mở.
 * Dùng cho form thêm/sửa, xác nhận...
 *
 * `tone` tô màu icon/glow/shadow theo ngữ cảnh (brand = mặc định, success/danger/info dùng
 * đúng màu đã có sẵn trong app — vd nút Start màu emerald, nút Xoá màu đỏ). `layout` đổi
 * kích thước + cách vào màn hình: 'compact' cho xác nhận ngắn, 'sheet' trượt lên từ đáy màn
 * hình (hợp cho nội dung dài trên mobile). Cả 2 đều thuần visual — không đổi hành vi đóng/mở.
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
  const { Icon, chip, glow, shadow } = toneConfig[tone]
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
            className="absolute inset-0 bg-ink/35 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />

          {/* Khung nội dung. */}
          <motion.div
            className={cn(
              'relative z-10 w-full rounded-2xl bg-white shadow-2xl ring-1 ring-ink/5',
              shadow,
              layoutMaxWidth[layout],
              isSheet && 'rounded-b-none',
              className,
            )}
            initial={
              reduceMotion
                ? false
                : isSheet
                  ? { opacity: 0, y: 48 }
                  : { opacity: 0, scale: 0.94, y: 12 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              reduceMotion
                ? undefined
                : isSheet
                  ? { opacity: 0, y: 32, transition: { duration: 0.16 } }
                  : { opacity: 0, scale: 0.94, y: 12, transition: { duration: 0.16 } }
            }
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            {/* Glow màu theo tone, thuần trang trí phía sau header — không chặn thao tác. */}
            <div
              className={cn(
                'absolute -top-8 left-1/2 h-24 w-56 -translate-x-1/2 rounded-full opacity-60 blur-3xl pointer-events-none',
                glow,
              )}
            />

            {title && (
              <div className="relative flex items-start justify-between gap-3 border-b border-line/15 px-6 py-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', chip)}>
                    {icon ?? <Icon size={18} />}
                  </div>
                  <h2 className="pt-1.5 text-base font-bold text-ink">{title}</h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-lg p-1 text-muted transition-all hover:bg-slate-100 hover:text-ink"
                  aria-label="Đóng"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="relative px-6 py-5">{children}</div>


            {footer && <div className="relative flex justify-end gap-2 border-t border-line/15 px-6 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default Modal