import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useToastStore, type ToastType } from './toastStore'

// Màu sắc theo loại toast.
const toastStyles: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-line/30 bg-white text-ink',
}

const toastIcons: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

// Chỉ tối đa 3 toast gần nhất hiện rõ theo kiểu chồng thẻ: mới nhất luôn nằm trên cùng/rõ
// nhất, 2 lớp trước đó ló nhẹ ra phía sau (mờ + nhỏ dần). Từ lớp thứ 4 trở đi coi như đã
// tràn khỏi tầm nhìn -> ẩn hẳn (opacity 0), vẫn tồn tại trong store nên vẫn tự biến mất
// đúng hẹn giờ, chỉ là không còn hiện trên màn hình nữa.
const MAX_VISIBLE = 3
const STACK_OFFSET_Y = 12
const STACK_SCALE_STEP = 0.045
const STACK_OPACITY_STEP = 0.32

/**
 * Vùng hiển thị toast, đặt 1 lần ở gốc app (trong AppProviders). Neo góc dưới-trái màn
 * hình, xếp chồng như 1 cọc thẻ thay vì liệt kê thẳng xuống — tránh che nửa màn hình khi
 * có nhiều thông báo dồn dập. Toast đứng trước (mới nhất) mới nhận thao tác đóng bằng tay;
 * các lớp phía sau chỉ mang tính trang trí, chờ đến lượt lên trước mới tương tác được.
 */
const Toaster = () => {
  const toasts = useToastStore((state) => state.toasts)
  const remove = useToastStore((state) => state.remove)

  if (toasts.length === 0) return null

  // Store thêm toast mới vào cuối mảng (cũ -> mới) -> đảo lại để index 0 luôn là toast mới
  // nhất, khớp với cách tính "độ sâu trong cọc" bên dưới.
  const stacked = [...toasts].reverse()

  return (
    <div className="pointer-events-none fixed left-4 bottom-4 z-[100] w-full max-w-sm">
      <AnimatePresence initial={false}>
        {stacked.map((t, depth) => {
          const Icon = toastIcons[t.type]
          const isFront = depth === 0
          const overflowed = depth >= MAX_VISIBLE

          return (
            <motion.div
              key={t.id}
              role="alert"
              initial={{ opacity: 0, y: 28, scale: 0.92 }}
              animate={{
                opacity: overflowed ? 0 : 1 - depth * STACK_OPACITY_STEP,
                y: -depth * STACK_OFFSET_Y,
                scale: 1 - Math.min(depth, MAX_VISIBLE) * STACK_SCALE_STEP,
              }}
              exit={{ opacity: 0, scale: 0.9, y: 10, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              style={{ zIndex: 50 - depth }}
              className={`absolute inset-x-0 bottom-0 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${toastStyles[t.type]
                } ${isFront ? 'pointer-events-auto' : 'pointer-events-none'}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1 font-medium">{t.message}</p>
              {isFront && (
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  className="shrink-0 opacity-60 transition hover:opacity-100"
                  aria-label="Đóng thông báo"
                >
                  <X size={14} />
                </button>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default Toaster