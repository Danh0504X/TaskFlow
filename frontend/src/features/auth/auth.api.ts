import api from '@/lib/api'
import type {
  SignInPayload,
  SignInResponse,
  SignUpPayload,
  SignUpResponse,
  VerifyEmailPayload,
  VerifyEmailResponse,
} from './auth.types'

// Lớp gọi API cho auth. Mọi endpoint nằm dưới prefix /auth (xem VITE_API_BASE_URL).
export const authApi = {
  signUp: async (payload: SignUpPayload): Promise<SignUpResponse> => {
    const res = await api.post<SignUpResponse>('/auth/sign-up', payload)
    return res.data
  },

  /** Kiểm tra email đã được sử dụng chưa (trước khi sang bước nhập mật khẩu). */
  checkEmail: async (
    email: string,
  ): Promise<{ email: string; available: boolean }> => {
    const res = await api.post<{ email: string; available: boolean }>(
      '/auth/check-email',
      { email },
    )
    return res.data
  },

  /** Xác thực mã email sau khi đăng ký -> backend set cookie & trả userInfo. */
  verifyEmail: async (
    payload: VerifyEmailPayload,
  ): Promise<VerifyEmailResponse> => {
    const res = await api.post<VerifyEmailResponse>(
      '/auth/verify-email',
      payload,
    )
    return res.data
  },

  /** Gửi lại mã xác thực email. */
  resendVerifyCode: async (email: string): Promise<{ message: string }> => {
    const res = await api.post<{ message: string }>(
      '/email/send-verify-code',
      { email },
    )
    return res.data
  },

  signIn: async (payload: SignInPayload): Promise<SignInResponse> => {
    const res = await api.post<SignInResponse>('/auth/sign-in', payload)
    return res.data
  },

  /** Đăng nhập Google: gửi access_token lấy từ Google OAuth lên backend. */
  googleSignIn: async (accessToken: string): Promise<SignInResponse> => {
    const res = await api.post<SignInResponse>('/auth/google', { accessToken })
    return res.data
  },

  signOut: async (): Promise<void> => {
    await api.post('/auth/sign-out')
  },
}
