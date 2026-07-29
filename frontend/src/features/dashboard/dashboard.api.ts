import api from '@/lib/api'
import type { ApiResponse } from '@/lib/http'
import type { UpcomingSprint } from './dashboard.types'

export const dashboardApi = {
  /** GET /me/upcoming-sprints — sprint đang chạy sắp hết hạn, trải trên mọi project. */
  getUpcomingSprints: async (): Promise<UpcomingSprint[]> => {
    const res = await api.get<ApiResponse<UpcomingSprint[]>>('/me/upcoming-sprints')
    return res.data.data
  },
}
