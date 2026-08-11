// Query key factory cho React Query — cùng pattern với issue.keys.ts/project.keys.ts.
export const aiKeys = {
  all: ['ai-lab'] as const,
  generations: (projectId: string) => [...aiKeys.all, 'generations', projectId] as const,
  generation: (projectId: string, generationId: string) =>
    [...aiKeys.all, 'generation', projectId, generationId] as const,
  /** Task nháp gộp của 1 epic thật (GET .../ai/epics/:epicId/task-drafts) — dùng ở
   * AiQuickGenerateModal thay cho generation() vì chưa chắc đã có generationId (epic chưa từng
   * "Sinh Task" lần nào). */
  epicTaskDrafts: (projectId: string, epicId: string) =>
    [...aiKeys.all, 'epic-task-drafts', projectId, epicId] as const,
  /** Không theo project — hạn mức tính theo user (GET /me/ai-quota). */
  myQuota: () => [...aiKeys.all, 'my-quota'] as const,
}
