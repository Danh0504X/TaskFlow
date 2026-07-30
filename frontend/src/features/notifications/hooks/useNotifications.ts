import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '../notification.api'

const NOTIF_KEYS = {
  all: ['notifications'] as const,
  list: (page: number) => [...NOTIF_KEYS.all, 'list', page] as const,
}

// Hook lấy danh sách thông báo (Tự động Short Polling)
export const useNotifications = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: NOTIF_KEYS.list(page),
    queryFn: () => notificationApi.getNotifications(page, limit),
    refetchInterval: 30000, // Tự động refetch sau mỗi 30 giây để cập nhật realtime
  })
}

// Hook đánh dấu đã đọc 1 thông báo
export const useMarkAsRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIF_KEYS.all })
    },
  })
}

// Hook đánh dấu đọc tất cả
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIF_KEYS.all })
    },
  })
}

// Hook xóa 1 thông báo
export const useDeleteNotification = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationApi.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIF_KEYS.all })
    },
  })
}

// Hook xóa toàn bộ thông báo (Clear All)
export const useClearAllNotifications = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationApi.clearAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIF_KEYS.all })
    },
  })
}
