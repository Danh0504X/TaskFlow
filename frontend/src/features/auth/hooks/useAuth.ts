import { useCallback } from 'react'
import { authApi } from '../auth.api'
import { useAuthStore } from '../authStore'

// Hook cho phần "trạng thái user" + đăng xuất.
// Các thao tác đăng nhập/đăng ký/xác thực dùng các mutation trong
// useAuthMutations.ts (React Query) — xem hooks/useAuthMutations.ts.
export const useAuth = () => {
  const user = useAuthStore((state) => state.user)
  const clearUser = useAuthStore((state) => state.clearUser)

  const signOut = useCallback(async () => {
    try {
      await authApi.signOut()
    } finally {
      // Dù API lỗi vẫn xoá phiên phía client.
      clearUser()
    }
  }, [clearUser])

  return {
    user,
    isAuthenticated: !!user,
    signOut,
  }
}
