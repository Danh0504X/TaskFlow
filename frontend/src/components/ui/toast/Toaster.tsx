import { useToastStore, type ToastType } from './toastStore'

// Màu sắc theo loại toast.
const toastStyles: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-slate-200 bg-white text-slate-800',
}

const toastIcons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
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
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-md ${toastStyles[t.type]}`}
        >
          <span className="mt-0.5 font-bold">{toastIcons[t.type]}</span>
          <p className="flex-1">{t.message}</p>
          <button
            type="button"
            onClick={() => remove(t.id)}
            className="text-current/60 transition hover:opacity-100"
            aria-label="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

export default Toaster
