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

/** Danh sách lời mời tham gia dự án đang chờ user hiện tại xử lý. */
export const useProjectInvitations = () => {
  return useQuery({
    queryKey: projectKeys.invitations(),
    queryFn: projectApi.getMyInvitations,
  })
}
