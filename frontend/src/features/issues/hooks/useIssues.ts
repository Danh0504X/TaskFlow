import { useQuery } from '@tanstack/react-query'
import { getIssuesForProject, findMockIssueByKey } from '../issue.mock'

// TODO: thay bằng gọi API thật khi backend có endpoint /projects/:id/issues.
// Giữ dạng useQuery ngay từ đầu để sau này chỉ cần đổi queryFn, không đổi chỗ dùng.

/** Danh sách issue của 1 project (dùng cho tab Board/List/Backlog). */
export const useProjectIssues = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['issues', 'project', projectId],
    queryFn: () => getIssuesForProject(projectId as string),
    enabled: !!projectId,
  })
}

/** Chi tiết 1 issue theo key (dùng cho IssueDetailPanel). */
export const useIssue = (issueKey: string | undefined) => {
  return useQuery({
    queryKey: ['issues', 'detail', issueKey],
    queryFn: () => findMockIssueByKey(issueKey as string) ?? null,
    enabled: !!issueKey,
  })
}
