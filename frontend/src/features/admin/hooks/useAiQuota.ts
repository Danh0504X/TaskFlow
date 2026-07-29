import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminKeys } from '../admin.keys'
import type { QuotaTimeframe } from '../admin.types'
import { fetchAiQuota, setAiEnabledGlobally, setUserAiDisabled, setUserQuotaLimit } from '../mock/ai.mock'

export const useAiQuota = (timeframe: QuotaTimeframe) => {
  return useQuery({
    queryKey: adminKeys.aiQuota(timeframe),
    queryFn: () => fetchAiQuota(timeframe),
  })
}

export const useSetAiEnabledGlobally = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (enabled: boolean) => setAiEnabledGlobally(enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.ai() }),
  })
}

export const useSetUserQuotaLimit = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, limit }: { userId: string; limit: number }) => setUserQuotaLimit(userId, limit),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.ai() }),
  })
}

export const useSetUserAiDisabled = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, disabled }: { userId: string; disabled: boolean }) => setUserAiDisabled(userId, disabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.ai() }),
  })
}
