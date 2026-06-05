import api from '@/lib/api'
import type {
  SignInPayload,
  SignInResponse,
  SignUpPayload,
  SignUpResponse,
} from './auth.types'

// Lớp gọi API cho auth. Mọi endpoint nằm dưới prefix /auth (xem VITE_API_BASE_URL).
export const authApi = {
  signUp: async (payload: SignUpPayload): Promise<SignUpResponse> => {
    const res = await api.post<SignUpResponse>('/auth/sign-up', payload)
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
