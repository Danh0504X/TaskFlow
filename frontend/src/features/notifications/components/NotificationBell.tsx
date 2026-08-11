import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import { NotificationDropdown } from './NotificationDropdown'

interface NotificationBellProps {
  placement?: 'auto' | 'top' | 'bottom'
}

export const NotificationBell = ({ placement = 'auto' }: NotificationBellProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [computedPlacement, setComputedPlacement] = useState<'top' | 'bottom'>('top')
  const [isRightAligned, setIsRightAligned] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Lấy trang đầu tiên, 20 thông báo
  const { data } = useNotifications(1, 20)
  const notifications = data?.notifications ?? []
  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      // Tự động xác định hướng nẩy lên hay xuống dựa trên vị trí nút so với màn hình
      if (placement === 'auto') {
        if (rect.top > window.innerHeight / 2) {
          setComputedPlacement('top')
        } else {
          setComputedPlacement('bottom')
        }
      } else {
        setComputedPlacement(placement)
      }

      // Kiểm tra xem nút có nằm ở nửa bên phải màn hình không
      if (rect.left > window.innerWidth / 2) {
        setIsRightAligned(true)
      } else {
        setIsRightAligned(false)
      }
    }
    setIsOpen(!isOpen)
  }

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
        ref={buttonRef}
        onClick={handleToggle}
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
          placement={computedPlacement}
          isRightAligned={isRightAligned}
        />
      )}
    </div>
  )
}
