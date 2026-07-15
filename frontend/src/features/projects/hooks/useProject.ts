import { useQuery } from '@tanstack/react-query'
import { projectApi } from '../project.api'
import { projectKeys } from '../project.keys'

/**
 * Lấy chi tiết 1 project theo id.
 * `enabled`: chỉ gọi API khi đã có projectId (tránh gọi với id rỗng).
 */
export const useProject = (projectId: string | undefined) => {
  return useQuery({
    queryKey: projectKeys.detail(projectId ?? ''),
    queryFn: () => projectApi.getById(projectId as string),
    enabled: !!projectId,
  })
}
