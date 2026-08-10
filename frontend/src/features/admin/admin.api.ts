import api from '@/lib/api'
import type { ApiResponse } from '@/lib/http'
import type {
  AdminUserItem,
  GetUsersQuery,
  GetUsersResponse,
  UpdateUserPayload,
} from './admin.types'

export const adminApi = {
  /** GET /admin/users — Lấy danh sách & tìm kiếm tài khoản (U051) */
  getUsers: async (query: GetUsersQuery = {}): Promise<GetUsersResponse> => {
    const params = new URLSearchParams()
    if (query.page) params.append('page', String(query.page))
    if (query.limit) params.append('limit', String(query.limit))
    if (query.search) params.append('search', query.search)
    if (query.role) params.append('role', query.role)
    if (query.status) params.append('status', query.status)

    const res = await api.get<ApiResponse<GetUsersResponse>>(`/admin/users?${params.toString()}`)
    return res.data.data
  },

  /** GET /admin/users/:userId — Lấy chi tiết tài khoản (U052) */
  getUserById: async (userId: string): Promise<AdminUserItem> => {
    const res = await api.get<ApiResponse<AdminUserItem>>(`/admin/users/${userId}`)
    return res.data.data
  },

  /** PUT /admin/users/:userId — Cập nhật / Khóa / Mở khóa tài khoản (U053) */
  updateUser: async (userId: string, payload: UpdateUserPayload): Promise<AdminUserItem> => {
    const res = await api.put<ApiResponse<AdminUserItem>>(`/admin/users/${userId}`, payload)
    return res.data.data
  },

  /** DELETE /admin/users/:userId — Xóa tài khoản */
  deleteUser: async (userId: string): Promise<{ _id: string }> => {
    const res = await api.delete<ApiResponse<{ _id: string }>>(`/admin/users/${userId}`)
    return res.data.data
  },

  /** GET /admin/audit — Lấy danh sách Nhật ký hệ thống từ MongoDB */
  getAuditLogs: async (query: any = {}): Promise<any> => {
    const res = await api.get('/admin/audit', { params: query })
    return res.data.data
  },

  /** POST /admin/audit — Ghi 1 dòng Nhật ký hệ thống vào MongoDB */
  createAuditLog: async (payload: any): Promise<any> => {
    const res = await api.post('/admin/audit', payload)
    return res.data.data
  },
}
