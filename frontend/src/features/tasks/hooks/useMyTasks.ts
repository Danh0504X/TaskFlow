import { useQuery } from '@tanstack/react-query'
import { MOCK_MY_TASKS } from '@/features/issues/issue.mock'

// "Việc của tôi" là các Issue được giao cho user hiện tại, trải trên nhiều project.
// TODO: thay bằng gọi API thật khi backend có endpoint /issues/assigned-to-me.
export const useMyTasks = () => {
  return useQuery({
    queryKey: ['issues', 'my-tasks'],
    queryFn: () => MOCK_MY_TASKS,
  })
}
