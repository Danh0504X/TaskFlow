import { useCallback } from 'react'
import { authApi } from '../auth.api'
import { useAuthStore } from '../authStore'
import type { SignInPayload, SignUpPayload } from '../auth.types'

// Hook tiện ích gói các action auth + trạng thái user.
// Component chỉ cần gọi hook này, không cần biết chi tiết api/store.
export const useAuth = () => {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const clearUser = useAuthStore((state) => state.clearUser)

  const signIn = useCallback(
    async (payload: SignInPayload) => {
      const res = await authApi.signIn(payload)
      setUser(res.data.userInfo)
      return res
    },
    [setUser],
  )

  // Backend signUp không set cookie -> đăng ký xong tự đăng nhập luôn cho mượt.
  const signUp = useCallback(
    async (payload: SignUpPayload) => {
      await authApi.signUp(payload)
      return signIn({ email: payload.email, password: payload.password })
    },
    [signIn],
  )

  const googleSignIn = useCallback(
    async (accessToken: string) => {
      const res = await authApi.googleSignIn(accessToken)
      setUser(res.data.userInfo)
      return res
    },
    [setUser],
  )

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
    signIn,
    signUp,
    googleSignIn,
    signOut,
  }
}
