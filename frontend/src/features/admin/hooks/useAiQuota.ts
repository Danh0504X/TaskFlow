import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../admin.api'
import { adminKeys } from '../admin.keys'
import type { QuotaTimeframe } from '../admin.types'

/** Bảng xếp hạng token/lượt sinh theo user — dữ liệu thật từ GET /admin/ai/quota. */
export const useAiQuota = (timeframe: QuotaTimeframe) => {
  return useQuery({
    queryKey: adminKeys.aiQuota(timeframe),
    queryFn: () => adminApi.getAiQuota(timeframe),
  })
}
