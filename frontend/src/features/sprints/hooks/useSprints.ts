import { useQuery } from '@tanstack/react-query'
import { sprintApi } from '../sprint.api'
import { sprintKeys } from '../sprint.keys'

/** Danh sách sprint của 1 project (dùng để tìm sprint ACTIVE và liệt kê sprint PLANNED ở Backlog). */
export const useSprints = (projectId: string | undefined) => {
  return useQuery({
    queryKey: sprintKeys.list(projectId ?? ''),
    queryFn: () => sprintApi.getByProject(projectId as string),
    enabled: !!projectId,
  })
}

/** Chi tiết 1 sprint theo id. */
export const useSprint = (
  projectId: string | undefined,
  sprintId: string | undefined,
) => {
  return useQuery({
    queryKey: sprintKeys.detail(projectId ?? '', sprintId ?? ''),
    queryFn: () => sprintApi.getById(projectId as string, sprintId as string),
    enabled: !!projectId && !!sprintId,
  })
}
