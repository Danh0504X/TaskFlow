import { useQuery } from '@tanstack/react-query'
import { aiApi } from '../ai.api'
import { aiKeys } from '../ai.keys'

/** Lịch sử các lượt sinh của 1 project (danh sách bên cạnh form tạo mới). */
export const useGenerations = (projectId: string | null) => {
  return useQuery({
    queryKey: aiKeys.generations(projectId ?? ''),
    queryFn: () => aiApi.getGenerations(projectId as string),
    enabled: !!projectId,
  })
}
