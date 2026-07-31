import { useNavigate } from 'react-router-dom'
import type { NotificationItem } from '../notification.types'
import { useMarkAsRead } from './useNotifications'

export const useNotificationClick = (onCloseDropdown?: () => void) => {
  const navigate = useNavigate()
  const { mutate: markAsRead } = useMarkAsRead()

  const handleNotificationClick = async (notif: NotificationItem) => {
    // 1. Đánh dấu đã đọc nếu chưa đọc
    if (!notif.isRead) {
      markAsRead(notif._id)
    }

    // 2. Đóng dropdown thông báo
    if (onCloseDropdown) {
      onCloseDropdown()
    }

    // 3. Điều hướng dựa theo thực tế loại thực thể
    switch (notif.entityType) {
      case 'PROJECT':
        navigate(`/projects/${notif.entityId}`)
        break

      case 'SPRINT':
        if (notif.projectId) {
          navigate(`/projects/${notif.projectId}`, { state: { initialTab: 'BACKLOG' } })
        } else {
          navigate('/projects')
        }
        break

      case 'ISSUE':
        if (notif.projectId) {
          navigate(`/projects/${notif.projectId}?issueId=${notif.entityId}`, { state: { initialTab: 'BOARD' } })
        } else {
          navigate('/projects')
        }
        break

      default:
        navigate('/')
    }
  }

  return { handleNotificationClick }
}
