import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastState {
  toasts: Toast[]
  /** Thêm toast và tự xoá sau `duration` ms. */
  push: (type: ToastType, message: string, duration?: number) => void
  remove: (id: number) => void
}

// Bộ đếm id tăng dần — đủ để phân biệt toast, không cần random.
let nextId = 1

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (type, message, duration = 3500) => {
    const id = nextId++
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }))
    window.setTimeout(() => get().remove(id), duration)
  },
  remove: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

// API tiện dụng: gọi toast.success(...) / toast.error(...) ở bất cứ đâu,
// kể cả ngoài React component (vd trong hook mutation).
export const toast = {
  success: (message: string) => useToastStore.getState().push('success', message),
  error: (message: string) => useToastStore.getState().push('error', message),
  info: (message: string) => useToastStore.getState().push('info', message),
}
