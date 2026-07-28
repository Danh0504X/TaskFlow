import api from '@/lib/api'
import type { ApiResponse } from '@/lib/http'
import type {
  CreateProjectPayload,
  InviteMemberInput,
  InviteMembersResponse,
  Project,
  ProjectInvitation,
  UpdateProjectPayload,
} from './project.types'

// Lớp gọi API cho project. Mọi endpoint nằm dưới prefix /projects.
// Backend luôn trả { message, data } -> ta bóc lấy `data` trả về cho hook dùng.
export const projectApi = {
  /** GET /projects — danh sách project user tham gia (backend đã lọc isDeleted: false). */
  getMyProjects: async (): Promise<Project[]> => {
    const res = await api.get<ApiResponse<Project[]>>('/projects')
    return res.data.data
  },

  /** GET /projects/invitations — danh sách lời mời tham gia dự án đang chờ user hiện tại xử lý. */
  getMyInvitations: async (): Promise<ProjectInvitation[]> => {
    const res = await api.get<ApiResponse<ProjectInvitation[]>>('/projects/invitations')
    return res.data.data
  },

  /** GET /projects/archived — danh sách project đã lưu trữ mà user là OWNER. */
  getArchivedProjects: async (): Promise<Project[]> => {
    const res = await api.get<ApiResponse<Project[]>>('/projects/archived')
    return res.data.data
  },

  /** GET /projects/:id — chi tiết 1 project. */
  getById: async (projectId: string): Promise<Project> => {
    const res = await api.get<ApiResponse<Project>>(`/projects/${projectId}`)
    return res.data.data
  },

  /** POST /projects — tạo project mới. */
  create: async (payload: CreateProjectPayload): Promise<Project> => {
    const res = await api.post<ApiResponse<Project>>('/projects', payload)
    return res.data.data
  },

  /** PUT /projects/:id — cập nhật project. */
  update: async (
    projectId: string,
    payload: UpdateProjectPayload,
  ): Promise<Project> => {
    const res = await api.put<ApiResponse<Project>>(
      `/projects/${projectId}`,
      payload,
    )
    return res.data.data
  },

  /** DELETE /projects/:id — xoá mềm (Lưu trữ) project. */
  remove: async (projectId: string): Promise<Project> => {
    const res = await api.delete<ApiResponse<Project>>(`/projects/${projectId}`)
    return res.data.data
  },

  /** PATCH /projects/:id/restore — khôi phục project từ trạng thái lưu trữ. */
  restore: async (projectId: string): Promise<Project> => {
    const res = await api.patch<ApiResponse<Project>>(`/projects/${projectId}/restore`)
    return res.data.data
  },

  /** DELETE /projects/:id/permanent — xoá vĩnh viễn (hard delete) project, không thể hoàn tác. */
  deletePermanently: async (projectId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/permanent`)
  },

  /** POST /projects/:id/members/invite — mời thành viên bằng email. */
  inviteMembers: async (
    projectId: string,
    invites: InviteMemberInput[],
  ): Promise<InviteMembersResponse> => {
    const res = await api.post<ApiResponse<InviteMembersResponse>>(
      `/projects/${projectId}/members/invite`,
      { invites },
    )
    return res.data.data
  },

  /** POST /projects/:id/leave — rời dự án. */
  leave: async (projectId: string): Promise<{ message: string }> => {
    const res = await api.post<{ message: string }>(`/projects/${projectId}/leave`)
    return res.data
  },

  /**
   * POST /projects/:id/invitation/accept — chấp nhận lời mời tham gia dự án.
   * `token` chỉ cần khi chấp nhận qua link email; bỏ trống khi chấp nhận trực tiếp trong app
   * (modal "Lời mời của tôi") vì backend đã xác định user qua phiên đăng nhập.
   */
  acceptInvitation: async (projectId: string, token?: string): Promise<void> => {
    await api.post(`/projects/${projectId}/invitation/accept`, token ? { token } : {})
  },

  /** POST /projects/:id/invitation/decline — từ chối lời mời tham gia dự án. `token` optional, xem acceptInvitation. */
  declineInvitation: async (projectId: string, token?: string): Promise<void> => {
    await api.post(`/projects/${projectId}/invitation/decline`, token ? { token } : {})
  },
}

