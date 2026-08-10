export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (projectId: string, issueId: string) =>
    [...commentKeys.lists(), projectId, issueId] as const,
}
