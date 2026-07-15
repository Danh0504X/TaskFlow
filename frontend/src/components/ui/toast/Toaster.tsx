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

/**
 * Vùng hiển thị toast, đặt 1 lần ở gốc app (trong AppProviders).
 * Lắng nghe toastStore và render các thông báo nổi ở góc trên phải.
 */
const Toaster = () => {
  const toasts = useToastStore((state) => state.toasts)
  const remove = useToastStore((state) => state.remove)

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon = toastIcons[t.type]
        return (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-md ${toastStyles[t.type]}`}
          >
            <Icon size={18} className="mt-0.5 shrink-0" />
            <p className="flex-1 font-medium">{t.message}</p>
            <button
              type="button"
              onClick={() => remove(t.id)}
              className="shrink-0 opacity-60 transition hover:opacity-100"
              aria-label="Đóng thông báo"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default Toaster
