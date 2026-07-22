import api from '@/lib/api'
import type { ApiResponse } from '@/lib/http'
import type {
  CreateProjectPayload,
  InviteMemberInput,
  InviteMembersResponse,
  Project,
  UpdateProjectPayload,
} from './project.types'

// Lớp gọi API cho project. Mọi endpoint nằm dưới prefix /projects.
// Backend luôn trả { message, data } -> ta bóc lấy `data` trả về cho hook dùng.
export const projectApi = {
  /** GET /projects — danh sách project user tham gia. */
  getMyProjects: async (): Promise<Project[]> => {
    const res = await api.get<ApiResponse<Project[]>>('/projects')
    const backendProjects = res.data.data

    const cachedStr = localStorage.getItem('taskflow_projects')
    const cachedProjects: Project[] = cachedStr ? JSON.parse(cachedStr) : []

    const merged = [...cachedProjects]

    backendProjects.forEach((bp) => {
      const idx = merged.findIndex((cp) => cp._id === bp._id)
      if (idx > -1) {
        merged[idx] = {
          ...merged[idx],
          ...bp,
          isDeleted: merged[idx].isDeleted, // Giữ nguyên trạng thái đã lưu trữ
        }
      } else {
        merged.push({
          ...bp,
          isDeleted: false,
        })
      }
    })

    localStorage.setItem('taskflow_projects', JSON.stringify(merged))
    return merged.filter((p) => !p.isDeleted)
  },

  /** GET /projects/archived — danh sách project đã lưu trữ trong local cache. */
  getArchivedProjects: async (): Promise<Project[]> => {
    const cachedStr = localStorage.getItem('taskflow_projects')
    const cachedProjects: Project[] = cachedStr ? JSON.parse(cachedStr) : []
    return cachedProjects.filter((p) => p.isDeleted)
  },

  /** GET /projects/:id — chi tiết 1 project. */
  getById: async (projectId: string): Promise<Project> => {
    const cachedStr = localStorage.getItem('taskflow_projects')
    const cachedProjects: Project[] = cachedStr ? JSON.parse(cachedStr) : []
    const cached = cachedProjects.find((p) => p._id === projectId)
    
    // Nếu tìm thấy dự án trong cache local (kể cả đã lưu trữ/xóa mềm), ta trả về luôn
    if (cached) {
      return cached
    }

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
    await api.delete<ApiResponse<Project>>(`/projects/${projectId}`)

    const cachedStr = localStorage.getItem('taskflow_projects')
    const cachedProjects: Project[] = cachedStr ? JSON.parse(cachedStr) : []
    const updated = cachedProjects.map((p) => {
      if (p._id === projectId) {
        return { ...p, isDeleted: true }
      }
      return p
    })
    localStorage.setItem('taskflow_projects', JSON.stringify(updated))
    return updated.find((p) => p._id === projectId)!
  },

  /** PATCH /projects/:id/restore — khôi phục project từ trạng thái lưu trữ. */
  restore: async (projectId: string): Promise<Project> => {
    const cachedStr = localStorage.getItem('taskflow_projects')
    const cachedProjects: Project[] = cachedStr ? JSON.parse(cachedStr) : []
    const updated = cachedProjects.map((p) => {
      if (p._id === projectId) {
        return { ...p, isDeleted: false }
      }
      return p
    })
    localStorage.setItem('taskflow_projects', JSON.stringify(updated))
    return updated.find((p) => p._id === projectId)!
  },

  /** DELETE /projects/:id/permanent — xoá vĩnh viễn project khỏi local cache và gọi API BE. */
  deletePermanently: async (projectId: string): Promise<void> => {
    try {
      await api.delete(`/projects/${projectId}`)
    } catch (e) {
      // Bỏ qua nếu BE đã xóa
    }

    const cachedStr = localStorage.getItem('taskflow_projects')
    const cachedProjects: Project[] = cachedStr ? JSON.parse(cachedStr) : []
    const updated = cachedProjects.filter((p) => p._id !== projectId)
    localStorage.setItem('taskflow_projects', JSON.stringify(updated))
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

  /** POST /projects/:id/invitation/accept — chấp nhận lời mời tham gia dự án. */
  acceptInvitation: async (
    projectId: string,
    token: string,
  ): Promise<void> => {
    await api.post(`/projects/${projectId}/invitation/accept`, { token })
  },

  /** POST /projects/:id/invitation/decline — từ chối lời mời tham gia dự án. */
  declineInvitation: async (
    projectId: string,
    token: string,
  ): Promise<void> => {
    await api.post(`/projects/${projectId}/invitation/decline`, { token })
  },
}

