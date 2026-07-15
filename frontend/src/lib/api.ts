import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { useAuthStore } from '@/features/auth/authStore'

// Cho phép truyền cờ tuỳ chỉnh trên config request.
// skipAuthRedirect: bỏ qua việc tự đá về /login khi gặp 401 (dùng cho /auth/me).
declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuthRedirect?: boolean
  }
}

// Instance axios dùng chung cho toàn app.
// withCredentials: true -> trình duyệt tự gửi kèm httpOnly cookie (accessToken/refreshToken)
// mà backend đã set. Frontend KHÔNG tự lưu/đính token -> chống XSS đánh cắp token.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Đưa user về trang login khi phiên không còn hợp lệ (JWT hết hạn không refresh được nữa,
// hoặc không có phiên). Gắn query param để LoginForm hiển thị lý do bị đăng xuất thay vì
// im lặng đá về — dùng query param (không phải navigate state) vì đây là window.location.replace
// (tải lại toàn trang), state của react-router sẽ mất theo.
const forceLogout = () => {
  useAuthStore.getState().clearUser()
  if (window.location.pathname !== '/login') {
    window.location.replace('/login?reason=session_expired')
  }
}

// ----- Cơ chế tự refresh access token -----
// Backend trả HTTP 410 khi access token hết hạn (cần gọi /auth/refresh-token).
// Khi gặp 410: gọi refresh đúng 1 lần, các request khác xếp hàng đợi rồi retry.
let isRefreshing = false
let pendingQueue: Array<{
  resolve: () => void
  reject: (error: unknown) => void
}> = []

const flushQueue = (error: unknown) => {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve()))
  pendingQueue = []
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status

    // Access token hết hạn -> thử refresh rồi retry request gốc.
    if (status === 410 && original && !original._retry) {
      if (isRefreshing) {
        // Đang refresh: đợi tới khi xong rồi retry.
        return new Promise<void>((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        }).then(() => api(original))
      }

      original._retry = true
      isRefreshing = true

      try {
        await api.post('/auth/refresh-token')
        flushQueue(null)
        return api(original)
      } catch (refreshError) {
        flushQueue(refreshError)
        forceLogout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Không có/không hợp lệ phiên đăng nhập.
    // Bỏ qua nếu request chủ động tắt redirect (vd /auth/me lúc thăm dò phiên).
    if (status === 401 && !original?.skipAuthRedirect) {
      forceLogout()
    }

    return Promise.reject(error)
  },
)

export default api
