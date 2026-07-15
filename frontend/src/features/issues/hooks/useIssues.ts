import { useQuery } from '@tanstack/react-query'
import { issueApi } from '../issue.api'
import { issueKeys } from '../issue.keys'
import type { GetIssuesFilter } from '../issue.types'

/**
 * Danh sách issue của 1 project (dùng cho tab Summary/List/Board/Backlog).
 * Truyền `filter` để lọc phía server (vd Board của Scrum chỉ lấy issue thuộc sprint active).
 */
export const useProjectIssues = (
  projectId: string | undefined,
  filter?: GetIssuesFilter,
) => {
  return useQuery({
    queryKey: issueKeys.list(projectId ?? '', filter),
    queryFn: () => issueApi.getByProject(projectId as string, filter),
    enabled: !!projectId,
  })
}

/** Danh sách issue thuộc 1 sprint cụ thể (Board của Scrum khi đã có sprint active). */
export const useSprintIssues = (
  projectId: string | undefined,
  sprintId: string | undefined,
) => {
  return useQuery({
    queryKey: issueKeys.bySprint(projectId ?? '', sprintId ?? ''),
    queryFn: () => issueApi.getBySprint(projectId as string, sprintId as string),
    enabled: !!projectId && !!sprintId,
  })
}

/** Chi tiết 1 issue theo id. */
export const useIssue = (
  projectId: string | undefined,
  issueId: string | undefined,
) => {
  return useQuery({
    queryKey: issueKeys.detail(projectId ?? '', issueId ?? ''),
    queryFn: () => issueApi.getById(projectId as string, issueId as string),
    enabled: !!projectId && !!issueId,
  })
}
