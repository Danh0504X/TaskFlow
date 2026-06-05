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

/** Trả về từ /auth/sign-up (chưa set cookie, user cần đăng nhập sau). */
export interface SignUpResponse {
  message: string
  data: {
    userInfo: UserInfo
  }
}
