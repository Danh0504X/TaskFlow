// Query key factory cho React Query — cùng pattern với issue.keys.ts/project.keys.ts.
export const aiKeys = {
  all: ['ai-lab'] as const,
  generations: (projectId: string) => [...aiKeys.all, 'generations', projectId] as const,
  generation: (projectId: string, generationId: string) =>
    [...aiKeys.all, 'generation', projectId, generationId] as const,
  /** Không theo project — hạn mức tính theo user (GET /me/ai-quota). */
  myQuota: () => [...aiKeys.all, 'my-quota'] as const,
}
