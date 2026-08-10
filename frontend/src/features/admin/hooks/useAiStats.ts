import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../admin.api'
import { adminKeys } from '../admin.keys'

/** Dữ liệu tab con "Tổng quan" trong Giám sát AI — dữ liệu thật từ GET /admin/ai/overview. */
export const useAiStats = () => {
  return useQuery({
    queryKey: adminKeys.aiOverview(),
    queryFn: () => adminApi.getAiOverview(),
  })
}
