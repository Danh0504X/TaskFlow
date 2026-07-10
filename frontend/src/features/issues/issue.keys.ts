import type { GetIssuesFilter } from './issue.types'

// Query key factory cho React Query — cùng pattern với project.keys.ts.
export const issueKeys = {
  all: ['issues'] as const,
  lists: () => [...issueKeys.all, 'list'] as const,
  list: (projectId: string, filter?: GetIssuesFilter) =>
    [...issueKeys.lists(), projectId, filter ?? {}] as const,
  bySprint: (projectId: string, sprintId: string) =>
    [...issueKeys.lists(), projectId, 'sprint', sprintId] as const,
  details: () => [...issueKeys.all, 'detail'] as const,
  detail: (projectId: string, issueId: string) =>
    [...issueKeys.details(), projectId, issueId] as const,
}
