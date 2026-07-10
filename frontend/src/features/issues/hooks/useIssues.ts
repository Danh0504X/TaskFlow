import { useQuery } from '@tanstack/react-query'
import { issueApi } from '../issue.api'
import { issueKeys } from '../issue.keys'

/** Danh sách issue của 1 project (dùng cho tab Summary/List/Board/Backlog). */
export const useProjectIssues = (projectId: string | undefined) => {
  return useQuery({
    queryKey: issueKeys.list(projectId ?? ''),
    queryFn: () => issueApi.getByProject(projectId as string),
    enabled: !!projectId,
  })
}
