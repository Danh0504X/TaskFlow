import api from '@/lib/api'
import type { ApiResponse } from '@/lib/http'
import type {
  CompleteSprintPayload,
  CompleteSprintResult,
  CreateSprintPayload,
  Sprint,
  UpdateSprintPayload,
} from './sprint.types'

// Lớp gọi API cho sprint. Nested dưới project: /projects/:projectId/sprints.
// Chỉ áp dụng cho project SCRUM — backend trả 400 nếu gọi trên project KANBAN.
export const sprintApi = {
  /** GET /projects/:projectId/sprints — danh sách sprint (chưa xóa mềm), sắp theo orderIndex. */
  getByProject: async (projectId: string): Promise<Sprint[]> => {
    const res = await api.get<ApiResponse<Sprint[]>>(`/projects/${projectId}/sprints`)
    return res.data.data
  },

  /** GET /projects/:projectId/sprints/:sprintId — chi tiết 1 sprint. */
  getById: async (projectId: string, sprintId: string): Promise<Sprint> => {
    const res = await api.get<ApiResponse<Sprint>>(
      `/projects/${projectId}/sprints/${sprintId}`,
    )
    return res.data.data
  },

  /** POST /projects/:projectId/sprints — tạo sprint mới (status PLANNED). Chỉ OWNER. */
  create: async (projectId: string, payload: CreateSprintPayload): Promise<Sprint> => {
    const res = await api.post<ApiResponse<Sprint>>(
      `/projects/${projectId}/sprints`,
      payload,
    )
    return res.data.data
  },

  /** PUT /projects/:projectId/sprints/:sprintId — cập nhật sprint. Chỉ OWNER. */
  update: async (
    projectId: string,
    sprintId: string,
    payload: UpdateSprintPayload,
  ): Promise<Sprint> => {
    const res = await api.put<ApiResponse<Sprint>>(
      `/projects/${projectId}/sprints/${sprintId}`,
      payload,
    )
    return res.data.data
  },

  /** DELETE /projects/:projectId/sprints/:sprintId — xoá hẳn sprint (không cho xoá khi đang ACTIVE). Chỉ OWNER. */
  remove: async (projectId: string, sprintId: string): Promise<Sprint> => {
    const res = await api.delete<ApiResponse<Sprint>>(
      `/projects/${projectId}/sprints/${sprintId}`,
    )
    return res.data.data
  },

  /** PATCH /projects/:projectId/sprints/:sprintId/start — chuyển PLANNED -> ACTIVE. Chỉ OWNER. */
  start: async (projectId: string, sprintId: string): Promise<Sprint> => {
    const res = await api.patch<ApiResponse<Sprint>>(
      `/projects/${projectId}/sprints/${sprintId}/start`,
    )
    return res.data.data
  },

  /** PATCH /projects/:projectId/sprints/:sprintId/complete — chuyển ACTIVE -> COMPLETED. Chỉ OWNER.
   * `payload.resolution` bắt buộc nếu sprint còn task chưa DONE. */
  complete: async (
    projectId: string,
    sprintId: string,
    payload: CompleteSprintPayload,
  ): Promise<CompleteSprintResult> => {
    const res = await api.patch<ApiResponse<CompleteSprintResult>>(
      `/projects/${projectId}/sprints/${sprintId}/complete`,
      payload,
    )
    return res.data.data
  },
}
