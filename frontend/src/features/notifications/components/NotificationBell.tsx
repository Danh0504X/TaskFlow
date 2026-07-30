import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import { NotificationDropdown } from './NotificationDropdown'

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Lấy trang đầu tiên, 20 thông báo
  const { data } = useNotifications(1, 20)
  const notifications = data?.notifications ?? []
  const unreadCount = notifications.filter((n) => !n.isRead).length

  // Xử lý click outside để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg border transition-all relative ${
          isOpen
            ? 'bg-canvas border-ink/10 text-ink'
            : 'text-muted border-transparent hover:bg-canvas hover:text-ink'
        }`}
        title="Thông báo"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand rounded-full text-[9px] font-bold text-canvas flex items-center justify-center border-2 border-surface animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
