import { useQuery } from '@tanstack/react-query'
import { aiApi } from '../ai.api'
import { aiKeys } from '../ai.keys'

/** Hạn mức sinh AI hôm nay của user hiện tại (widget "Hạn mức AI" ở trang Hồ sơ). */
export const useAiQuota = () => {
  return useQuery({
    queryKey: aiKeys.myQuota(),
    queryFn: () => aiApi.getMyQuota(),
  })
}
