import api from '@/lib/api'
import type { ApiResponse } from '@/lib/http'
import type {
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
  SignInPayload,
  SignInResponse,
  SignUpPayload,
  SignUpResponse,
  UserInfo,
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

  /** Gửi email quên mật khẩu (backend luôn trả message chung, không lộ email có tồn tại hay không). */
  forgotPassword: async (
    payload: ForgotPasswordPayload,
  ): Promise<ForgotPasswordResponse> => {
    const res = await api.post<ForgotPasswordResponse>(
      '/email/forgot-password',
      payload,
    )
    return res.data
  },

  /** Đặt lại mật khẩu bằng token lấy từ link trong email. */
  resetPassword: async (
    payload: ResetPasswordPayload,
  ): Promise<ResetPasswordResponse> => {
    const res = await api.post<ResetPasswordResponse>(
      '/email/reset-password',
      payload,
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

  /**
   * Lấy thông tin user hiện tại từ cookie (khôi phục phiên khi tải lại app).
   * skipAuthRedirect: không cho interceptor tự đá về /login khi 401 — đây chỉ
   * là bước "thăm dò" phiên, chưa đăng nhập là chuyện bình thường.
   */
  me: async (): Promise<UserInfo> => {
    const res = await api.get<ApiResponse<{ userInfo: UserInfo }>>('/auth/me', {
      skipAuthRedirect: true,
    })
    return res.data.data.userInfo
  },
}
