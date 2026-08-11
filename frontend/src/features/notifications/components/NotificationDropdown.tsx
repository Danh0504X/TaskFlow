import { useState } from 'react'
import type { NotificationItem } from '../notification.types'
import {
  useMarkAllAsRead,
  useDeleteNotification,
  useClearAllNotifications
} from '../hooks/useNotifications'
import { useNotificationClick } from '../hooks/useNotificationClick'
import Avatar from '@/components/ui/Avatar'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { Trash2, CheckCheck, Sparkles, Inbox } from 'lucide-react'


interface NotificationDropdownProps {
  notifications: NotificationItem[]
  onClose: () => void
  placement?: 'top' | 'bottom'
  isRightAligned?: boolean
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  const diffSecs = Math.floor(diffMs / 1000)
  if (diffSecs < 60) return 'Vừa xong'

  const diffMins = Math.floor(diffSecs / 60)
  if (diffMins < 60) return `${diffMins} phút trước`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays} ngày trước`

  return date.toLocaleDateString('vi-VN')
}

export const NotificationDropdown = ({
  notifications,
  onClose,
  placement = 'top',
  isRightAligned = false,
}: NotificationDropdownProps) => {
  const [showConfirm, setShowConfirm] = useState(false)
  const { mutate: markAllAsRead } = useMarkAllAsRead()
  const { mutate: deleteNotification } = useDeleteNotification()
  const { mutate: clearAll } = useClearAllNotifications()
  const { handleNotificationClick } = useNotificationClick(onClose)

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    markAllAsRead()
  }

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowConfirm(true)
  }

  const handleConfirmClearAll = () => {
    clearAll(undefined, {
      onSuccess: () => {
        setShowConfirm(false)
      }
    })
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    deleteNotification(id)
  }

  const positionClasses =
    placement === 'bottom'
      ? `top-full mt-2 ${isRightAligned ? 'right-0' : 'left-0'} slide-in-from-top-2`
      : `bottom-16 ${isRightAligned ? 'right-0' : 'left-0'} slide-in-from-bottom-2`

  return (
    <div
      className={`absolute w-80 max-w-[calc(100vw-32px)] bg-surface border border-hairline rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in duration-150 ${positionClasses}`}
      style={{ maxHeight: '420px' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-canvas/30">
        <span className="text-xs font-bold text-ink">Thông báo</span>
        <div className="flex items-center gap-2">
          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              className="text-[10px] font-bold text-muted hover:text-ink transition-colors flex items-center gap-1"
              title="Đọc tất cả"
            >
              <CheckCheck size={12} />
              Đã đọc tất cả
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-[10px] font-bold text-muted hover:text-pastel-red-ink transition-colors flex items-center gap-1"
              title="Xóa tất cả"
            >
              <Trash2 size={12} />
              Xóa tất cả
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-hairline">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-subtle">
            <Inbox size={28} className="mb-2 text-muted" />
            <p className="text-xs font-medium">Hộp thư thông báo trống</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => handleNotificationClick(notif)}
              className={`flex items-start gap-3 p-3 cursor-pointer transition-colors relative group ${
                notif.isRead ? 'hover:bg-canvas/50' : 'bg-brand/5 hover:bg-brand/10'
              }`}
            >
              {/* Icon/Avatar */}
              <div className="shrink-0 mt-0.5">
                {notif.actorId ? (
                  <Avatar
                    src={notif.actorId.avatarUrl ?? undefined}
                    name={notif.actorId.fullName}
                    size={28}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-brand/15 flex items-center justify-center text-brand">
                    <Sparkles size={14} />
                  </div>
                )}
              </div>

              {/* Nội dung */}
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-xs font-bold text-ink leading-tight truncate">{notif.title}</p>
                <p className="text-[11px] text-muted mt-1 leading-snug break-words">
                  {notif.message}
                </p>
                <span className="text-[9px] text-subtle mt-1.5 block">
                  {formatRelativeTime(notif.createdAt)}
                </span>
              </div>

              {/* Nút hành động nổi bọt */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleDelete(e, notif._id)}
                  className="p-1 hover:bg-canvas rounded text-muted hover:text-pastel-red-ink transition-colors"
                  title="Xóa thông báo"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Chấm chưa đọc */}
              {!notif.isRead && (
                <span className="absolute right-3 top-3 w-1.5 h-1.5 bg-brand rounded-full group-hover:opacity-0 transition-opacity" />
              )}
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Xóa toàn bộ thông báo"
        message="Bạn có chắc chắn muốn xóa toàn bộ thông báo trong hộp thư của mình? Hành động này không thể hoàn tác."
        confirmText="Xóa tất cả"
        cancelText="Hủy"
        danger
        onConfirm={handleConfirmClearAll}
        onClose={() => setShowConfirm(false)}
      />
    </div>
  )
}
