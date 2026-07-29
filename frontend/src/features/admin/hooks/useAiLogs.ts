import { useQuery } from '@tanstack/react-query'
import { adminKeys } from '../admin.keys'
import type { AiLogsQuery } from '../admin.types'
import { fetchAiLogs } from '../mock/ai.mock'

export const useAiLogs = (query: AiLogsQuery) => {
  return useQuery({
    queryKey: adminKeys.aiLogs(query),
    queryFn: () => fetchAiLogs(query),
  })
}
