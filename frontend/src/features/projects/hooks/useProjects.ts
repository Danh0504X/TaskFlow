import { useQuery } from '@tanstack/react-query'
import { projectApi } from '../project.api'
import { projectKeys } from '../project.keys'

/**
 * Lấy danh sách project của user hiện tại.
 * React Query tự lo: cache, loading, error, refetch.
 * Component chỉ cần đọc { data, isLoading, isError, ... }.
 */
export const useProjects = () => {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: projectApi.getMyProjects,
  })
}
