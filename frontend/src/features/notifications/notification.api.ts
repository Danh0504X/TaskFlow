import api from '@/lib/api'
import type { ApiResponse } from '@/lib/http'
import type { GetNotificationsResponse, NotificationItem } from './notification.types'

export const notificationApi = {
  getNotifications: async (page = 1, limit = 20): Promise<GetNotificationsResponse> => {
    const res = await api.get<ApiResponse<GetNotificationsResponse>>(
      `/notifications?page=${page}&limit=${limit}`
    )
    return res.data.data
  },

  markAsRead: async (id: string): Promise<NotificationItem> => {
    const res = await api.patch<ApiResponse<NotificationItem>>(`/notifications/${id}/read`)
    return res.data.data
  },

  markAllAsRead: async (): Promise<null> => {
    const res = await api.patch<ApiResponse<null>>('/notifications/read-all')
    return res.data.data
  },

  deleteNotification: async (id: string): Promise<NotificationItem> => {
    const res = await api.delete<ApiResponse<NotificationItem>>(`/notifications/${id}`)
    return res.data.data
  },

  clearAll: async (): Promise<null> => {
    const res = await api.delete<ApiResponse<null>>('/notifications/clear-all')
    return res.data.data
  }
}
