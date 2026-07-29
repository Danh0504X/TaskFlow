import { useQuery } from '@tanstack/react-query'
import { tasksApi } from '../tasks.api'

// "Việc của tôi" là các Issue được giao cho user hiện tại, trải trên nhiều project.
export const useMyTasks = () => {
  return useQuery({
    queryKey: ['issues', 'my-tasks'],
    queryFn: tasksApi.getMyTasks,
  })
}
