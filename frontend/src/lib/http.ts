import { AxiosError } from 'axios'

// Kiểu response chung của backend: mọi endpoint đều trả { message, data }.
// Dùng làm "khuôn" để khai báo type cho từng API cụ thể, tránh mỗi nơi tự gõ lại.
export interface ApiResponse<T> {
  message: string
  data: T
}

// Thân lỗi backend trả về (xem errorHandlingMiddleware ở backend).
interface ApiErrorBody {
  message?: string
  errors?: Record<string, string>
}

/**
 * Trích message lỗi thân thiện từ một lỗi bất kỳ (thường là AxiosError).
 * Dùng để hiển thị toast/thông báo mà không phải lặp lại logic ở mọi nơi.
 */
export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Đã có lỗi xảy ra, vui lòng thử lại.',
): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorBody | undefined
    if (data?.message) return data.message
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}
