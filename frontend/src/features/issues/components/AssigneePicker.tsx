import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, UserPlus, X } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import { useAuthStore } from '@/features/auth/authStore'
import { useProject } from '@/features/projects/hooks/useProject'

interface AssigneePickerProps {
  projectId: string
  /** userId đang được gán, hoặc null = chưa gán. */
  value: string | null
  onChange: (userId: string | null) => void
  size?: number
  /** Báo cho component cha biết dropdown đang mở/đóng — cần thiết vì dropdown render qua
   * Portal nên các cách kiểm tra dựa trên DOM containment (vd blur/relatedTarget) không
   * nhận diện đúng lúc đang tương tác với nó (xem QuickAddIssue.tsx). */
  onOpenChange?: (open: boolean) => void
}

const DROPDOWN_WIDTH = 224 // khớp w-56
const ESTIMATED_HEIGHT = 260 // ước lượng để quyết định mở lên/xuống, khớp max-h-64 + padding

/**
 * Nút chọn người được gán — dùng chung cho quick-add issue, List, Board, Backlog... Danh
 * sách hiển thị là các thành viên ACTIVE của project (luôn có ít nhất bản thân); KHÔNG có
 * lựa chọn "Automatic". Nếu project chưa mời ai khác, danh sách chỉ còn đúng 1 dòng — chính
 * người dùng hiện tại — tự nhiên thoả yêu cầu "không ai thì chỉ gán được cho bản thân".
 *
 * Dropdown render qua Portal ra `document.body`, định vị theo toạ độ thật (fixed) của nút
 * bấm -> không bị cắt bởi `overflow-hidden/auto` của khung chứa (vd cột Board cuộn dọc).
 */
const AssigneePicker = ({ projectId, value, onChange, size = 24, onOpenChange }: AssigneePickerProps) => {
  const currentUser = useAuthStore((state) => state.user)
  const { data: project } = useProject(projectId)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Luôn đi qua đây để đóng/mở -> component cha (vd QuickAddIssue) luôn được báo đúng lúc.
  // useCallback vì effect bên dưới cần 1 reference ổn định để đưa vào dependency array.
  const updateOpen = useCallback(
    (next: boolean) => {
      setOpen(next)
      onOpenChange?.(next)
    },
    [onOpenChange],
  )

  const openDropdown = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom
      const openUpward = spaceBelow < ESTIMATED_HEIGHT && rect.top > ESTIMATED_HEIGHT
      setCoords({
        top: openUpward ? rect.top - ESTIMATED_HEIGHT - 6 : rect.bottom + 6,
        left: Math.min(rect.left, window.innerWidth - DROPDOWN_WIDTH - 8),
      })
    }
    updateOpen(true)
  }

  useEffect(() => {
    if (!open) return
    // Dropdown ở portal (không phải con DOM của trigger) -> phải check cả 2 ref riêng.
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (!triggerRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        updateOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open, updateOpen])

  const members = (project?.members ?? []).filter((m) => m.status === 'ACTIVE')
  const selected = members.find((m) => m.userId === value)

  const handleSelect = (userId: string | null) => {
    onChange(userId)
    updateOpen(false)
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          if (open) {
            updateOpen(false)
          } else {
            openDropdown()
          }
        }}
        title={selected?.user?.fullName ?? 'Chưa gán — bấm để chọn người thực hiện'}
        className="rounded-full transition-all hover:ring-2 hover:ring-brand/30 shrink-0"
      >
        {selected?.user ? (
          <Avatar src={selected.user.avatarUrl} name={selected.user.fullName} size={size} />
        ) : (
          <div
            style={{ width: size, height: size }}
            className="rounded-full border border-dashed border-line/50 flex items-center justify-center text-subtle hover:border-brand/40 hover:text-brand transition-all"
          >
            <UserPlus size={size * 0.55} />
          </div>
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'fixed', top: coords.top, left: coords.left, width: DROPDOWN_WIDTH }}
            className="z-50 bg-white border border-line/20 rounded-2xl shadow-lg py-1.5 max-h-64 overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-muted hover:bg-slate-50 transition-all"
            >
              <div className="w-6 h-6 rounded-full border border-dashed border-line/50 flex items-center justify-center shrink-0">
                <X size={12} />
              </div>
              <span className="flex-1 text-left">Chưa gán</span>
              {value === null && <Check size={14} className="text-brand" />}
            </button>

            <div className="my-1 border-t border-line/10" />

            {members.map((member) => {
              const isSelf = member.userId === currentUser?._id
              return (
                <button
                  key={member.userId}
                  type="button"
                  onClick={() => handleSelect(member.userId)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-ink hover:bg-slate-50 transition-all"
                >
                  <Avatar src={member.user?.avatarUrl} name={member.user?.fullName ?? '?'} size={24} />
                  <span className="flex-1 text-left truncate">
                    {member.user?.fullName ?? 'Thành viên'}
                    {isSelf && <span className="text-subtle font-medium"> (Bạn)</span>}
                  </span>
                  {value === member.userId && <Check size={14} className="text-brand shrink-0" />}
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </>
  )
}

export default AssigneePicker