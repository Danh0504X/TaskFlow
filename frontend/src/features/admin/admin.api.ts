import api from '@/lib/api'
import type { ApiResponse } from '@/lib/http'
import type {
  AdminOverview,
  AdminUserItem,
  AiLeaderboardRow,
  AiOverviewStats,
  GetUsersQuery,
  GetUsersResponse,
  QuotaTimeframe,
  UpdateUserPayload,
} from './admin.types'

export const adminApi = {
  /** GET /admin/overview — Tổng quan hệ thống: người dùng, doanh thu SePay, cảnh báo AI (dữ liệu thật). */
  getOverview: async (): Promise<AdminOverview> => {
    const res = await api.get<ApiResponse<AdminOverview>>('/admin/overview')
    return res.data.data
  },

  /** GET /admin/users — Lấy danh sách & tìm kiếm tài khoản (U051) */
  getUsers: async (query: GetUsersQuery = {}): Promise<GetUsersResponse> => {
    const params = new URLSearchParams()
    if (query.page) params.append('page', String(query.page))
    if (query.limit) params.append('limit', String(query.limit))
    if (query.search) params.append('search', query.search)
    if (query.role) params.append('role', query.role)
    if (query.status) params.append('status', query.status)
    if (query.sort) params.append('sort', query.sort)

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

  /** GET /admin/ai/overview — Tổng quan giám sát AI (dữ liệu thật). */
  getAiOverview: async (): Promise<AiOverviewStats> => {
    const res = await api.get<ApiResponse<AiOverviewStats>>('/admin/ai/overview')
    return res.data.data
  },

  /** GET /admin/ai/quota — Bảng xếp hạng token/lượt sinh theo user (dữ liệu thật). */
  getAiQuota: async (timeframe: QuotaTimeframe = '30d'): Promise<AiLeaderboardRow[]> => {
    const res = await api.get<ApiResponse<AiLeaderboardRow[]>>(`/admin/ai/quota?timeframe=${timeframe}`)
    return res.data.data
  },
}
