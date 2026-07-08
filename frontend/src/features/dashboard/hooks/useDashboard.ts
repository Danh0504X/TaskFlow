import { useQuery } from '@tanstack/react-query'
import { MOCK_ASSIGNED_TASKS, MOCK_DASHBOARD_STATS, MOCK_UPCOMING_EVENTS } from '../dashboard.mock'

// TODO: thay bằng API thật khi backend có endpoint dashboard/summary.
export const useDashboardOverview = () => {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => ({
      stats: MOCK_DASHBOARD_STATS,
      assignedTasks: MOCK_ASSIGNED_TASKS,
      upcomingEvents: MOCK_UPCOMING_EVENTS,
    }),
  })
}
