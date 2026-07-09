import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserInfo } from './auth.types'

interface AuthState {
  /** Thông tin user hiện tại (null nếu chưa đăng nhập). */
  user: UserInfo | null
  setUser: (user: UserInfo) => void
  clearUser: () => void
}

// Chỉ lưu userInfo cho mục đích hiển thị UI và giữ trạng thái khi F5.
// KHÔNG lưu token ở đây — token nằm trong httpOnly cookie do backend quản lý.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'taskflow-auth',
      partialize: (state) => ({ user: state.user }),
    },
  ),
)
