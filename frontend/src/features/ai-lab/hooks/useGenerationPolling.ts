import { useQuery } from '@tanstack/react-query'
import { aiApi } from '../ai.api'
import { aiKeys } from '../ai.keys'
import { AI_GENERATION_STATUS } from '../ai.types'

const ACTIVE_STATUSES: string[] = [AI_GENERATION_STATUS.PENDING, AI_GENERATION_STATUS.PROCESSING]

/** Poll GET /generations/:genId mỗi 1.5s tới khi COMPLETED/FAILED thì tự dừng poll. */
export const useGenerationPolling = (projectId: string | null, generationId: string | null) => {
  return useQuery({
    queryKey: aiKeys.generation(projectId ?? '', generationId ?? ''),
    queryFn: () => aiApi.getGeneration(projectId as string, generationId as string),
    enabled: !!projectId && !!generationId,
    refetchInterval: (query) => (ACTIVE_STATUSES.includes(query.state.data?.status ?? '') ? 1500 : false),
  })
}
