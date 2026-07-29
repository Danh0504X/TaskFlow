import api from '@/lib/api'
import type { ApiResponse } from '@/lib/http'
import type { Issue } from '@/features/issues/issue.types'

// Lớp gọi API cho "Việc của tôi" — gộp issue từ NHIỀU project (khác issue.api.ts,
// vốn luôn nested dưới 1 project cụ thể).
export const tasksApi = {
  /** GET /me/tasks — issue được giao cho user hiện tại, trải trên mọi project. */
  getMyTasks: async (): Promise<Issue[]> => {
    const res = await api.get<ApiResponse<Issue[]>>('/me/tasks')
    return res.data.data
  },
}
