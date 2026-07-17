// Query key factory cho React Query — cùng pattern với project.keys.ts/issue.keys.ts.
export const sprintKeys = {
  all: ['sprints'] as const,
  lists: () => [...sprintKeys.all, 'list'] as const,
  list: (projectId: string) => [...sprintKeys.lists(), projectId] as const,
  details: () => [...sprintKeys.all, 'detail'] as const,
  detail: (projectId: string, sprintId: string) =>
    [...sprintKeys.details(), projectId, sprintId] as const,
}
