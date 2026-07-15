import api from '@/lib/api'
import type { ApiResponse } from '@/lib/http'
import type {
  CreateIssuePayload,
  GetIssuesFilter,
  Issue,
  UpdateIssuePayload,
  UpdateIssueStatusPayload,
} from './issue.types'

// Lớp gọi API cho issue. Nested dưới project: /projects/:projectId/issues.
// Backend luôn trả { message, data } -> ta bóc lấy `data` trả về cho hook dùng.
export const issueApi = {
  /** GET /projects/:projectId/issues — danh sách issue của 1 project, hỗ trợ lọc qua query. */
  getByProject: async (
    projectId: string,
    filter?: GetIssuesFilter,
  ): Promise<Issue[]> => {
    const res = await api.get<ApiResponse<Issue[]>>(
      `/projects/${projectId}/issues`,
      { params: filter },
    )
    return res.data.data
  },

  /** GET /projects/:projectId/issues/sprint/:sprintId — issue thuộc 1 sprint (Board của Scrum). */
  getBySprint: async (projectId: string, sprintId: string): Promise<Issue[]> => {
    const res = await api.get<ApiResponse<Issue[]>>(
      `/projects/${projectId}/issues/sprint/${sprintId}`,
    )
    return res.data.data
  },

  /** GET /projects/:projectId/issues/:issueId — chi tiết 1 issue. */
  getById: async (projectId: string, issueId: string): Promise<Issue> => {
    const res = await api.get<ApiResponse<Issue>>(
      `/projects/${projectId}/issues/${issueId}`,
    )
    return res.data.data
  },

  /** POST /projects/:projectId/issues — tạo issue mới. */
  create: async (
    projectId: string,
    payload: CreateIssuePayload,
  ): Promise<Issue> => {
    const res = await api.post<ApiResponse<Issue>>(
      `/projects/${projectId}/issues`,
      payload,
    )
    return res.data.data
  },

  /** PUT /projects/:projectId/issues/:issueId — cập nhật issue (chỉ OWNER). */
  update: async (
    projectId: string,
    issueId: string,
    payload: UpdateIssuePayload,
  ): Promise<Issue> => {
    const res = await api.put<ApiResponse<Issue>>(
      `/projects/${projectId}/issues/${issueId}`,
      payload,
    )
    return res.data.data
  },

  /** PATCH /projects/:projectId/issues/:issueId/status — chỉ đổi status (OWNER, MEMBER; dùng cho kéo-thả Board). */
  updateStatus: async (
    projectId: string,
    issueId: string,
    payload: UpdateIssueStatusPayload,
  ): Promise<Issue> => {
    const res = await api.patch<ApiResponse<Issue>>(
      `/projects/${projectId}/issues/${issueId}/status`,
      payload,
    )
    return res.data.data
  },

  /** DELETE /projects/:projectId/issues/:issueId — xoá mềm issue (kèm xoá mềm subtask con). */
  remove: async (projectId: string, issueId: string): Promise<Issue> => {
    const res = await api.delete<ApiResponse<Issue>>(
      `/projects/${projectId}/issues/${issueId}`,
    )
    return res.data.data
  },
}
