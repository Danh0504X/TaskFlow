import { useCallback } from 'react'
import { authApi } from '../auth.api'
import { useAuthStore } from '../authStore'
import type {
  SignInPayload,
  SignUpPayload,
  VerifyEmailPayload,
} from '../auth.types'

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

  // Đăng ký KHÔNG đăng nhập ngay: backend gửi mã xác thực, user phải nhập mã.
  const signUp = useCallback(
    (payload: SignUpPayload) => authApi.signUp(payload),
    [],
  )

  // Kiểm tra email còn trống hay đã có người dùng (cho bước 1 đăng ký).
  const checkEmail = useCallback(
    (email: string) => authApi.checkEmail(email),
    [],
  )

  // Nhập đúng mã -> backend set cookie & trả userInfo -> lưu user (đã đăng nhập).
  const verifyEmail = useCallback(
    async (payload: VerifyEmailPayload) => {
      const res = await authApi.verifyEmail(payload)
      setUser(res.data.userInfo)
      return res
    },
    [setUser],
  )

  const resendCode = useCallback(
    (email: string) => authApi.resendVerifyCode(email),
    [],
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
    checkEmail,
    verifyEmail,
    resendCode,
    googleSignIn,
    signOut,
  }
}
