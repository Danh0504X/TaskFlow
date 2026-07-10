import api from '@/lib/api'
import type { ApiResponse } from '@/lib/http'
import type { Issue } from './issue.types'

// Lớp gọi API cho issue. Nested dưới project: /projects/:projectId/issues.
// Backend luôn trả { message, data } -> ta bóc lấy `data` trả về cho hook dùng.
export const issueApi = {
  /** GET /projects/:projectId/issues — danh sách issue của 1 project. */
  getByProject: async (projectId: string): Promise<Issue[]> => {
    const res = await api.get<ApiResponse<Issue[]>>(`/projects/${projectId}/issues`)
    return res.data.data
  },
}
