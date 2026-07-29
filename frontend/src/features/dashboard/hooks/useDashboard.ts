import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../dashboard.api'

// Sprint đang chạy sắp hết hạn, trải trên mọi project — widget "Sprint sắp kết thúc".
export const useUpcomingSprints = () => {
  return useQuery({
    queryKey: ['dashboard', 'upcoming-sprints'],
    queryFn: dashboardApi.getUpcomingSprints,
  })
}
