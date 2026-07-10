// Query key factory cho React Query — cùng pattern với project.keys.ts.
export const issueKeys = {
  all: ['issues'] as const,
  lists: () => [...issueKeys.all, 'list'] as const,
  list: (projectId: string) => [...issueKeys.lists(), projectId] as const,
}
