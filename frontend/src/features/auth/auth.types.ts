// Kiểu dữ liệu cho luồng auth — khớp với response của backend.

export type AuthProvider = 'local' | 'google'

/** Thông tin user trả về từ backend (đã loại bỏ passwordHash). */
export interface UserInfo {
  _id: string
  email: string
  fullName: string
  avatarUrl: string | null
  authProvider: AuthProvider
  isEmailVerified: boolean
  status: string
  role?: string
}

// ----- Payload gửi lên -----

export interface SignInPayload {
  email: string
  password: string
}

export interface SignUpPayload {
  email: string
  password: string
  fullName: string
  inviteToken?: string
}

export interface VerifyEmailPayload {
  email: string
  code: string
  inviteToken?: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  email: string
  token: string
  newPassword: string
  confirmPassword: string
}

// ----- Response nhận về -----

/** Trả về từ /auth/sign-in và /auth/google. Token được set qua httpOnly cookie. */
export interface SignInResponse {
  message: string
  status: string
  data: {
    userInfo: UserInfo
    fullName: string
  }
}

/** Trả về từ /auth/sign-up: chưa đăng nhập, chỉ báo cần nhập mã xác thực. */
export interface SignUpResponse {
  message: string
  data: {
    email: string
    needVerifyEmail?: boolean
  }
}

/** Trả về từ /auth/verify-email: giống sign-in (set cookie + userInfo). */
export type VerifyEmailResponse = SignInResponse

/** Trả về từ /email/forgot-password và /email/reset-password: message chung. */
export interface ForgotPasswordResponse {
  message: string
}

export type ResetPasswordResponse = ForgotPasswordResponse
