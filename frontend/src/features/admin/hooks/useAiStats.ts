import { useQuery } from '@tanstack/react-query'
import { adminKeys } from '../admin.keys'
import { fetchAiOverview } from '../mock/ai.mock'

/** Dữ liệu tab con "Tổng quan" trong Giám sát AI. */
export const useAiStats = () => {
  return useQuery({
    queryKey: adminKeys.aiOverview(),
    queryFn: fetchAiOverview,
  })
}
