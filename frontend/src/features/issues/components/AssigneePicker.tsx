import { createPortal } from 'react-dom'
import { Check, UserPlus, X } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import { useAuthStore } from '@/features/auth/authStore'
import { useProject } from '@/features/projects/hooks/useProject'
import { useDropdownPosition } from '@/lib/useDropdownPosition'

interface AssigneePickerProps {
  projectId: string
  /** userId đang được gán, hoặc null = chưa gán. */
  value: string | null
  onChange: (userId: string | null) => void
  size?: number
  /** Báo cho component cha biết dropdown đang mở/đóng (xem useDropdownPosition). */
  onOpenChange?: (open: boolean) => void
  /** Chỉ hiển thị avatar, không cho bấm đổi — dùng khi người xem không có quyền cập nhật
   * issue (đổi assignee hiện đi qua PUT /issues/:id, chỉ OWNER). */
  readOnly?: boolean
}

const DROPDOWN_WIDTH = 224 // khớp w-56

/**
 * Nút chọn người được gán — dùng chung cho quick-add issue, List, Board, Backlog... Danh
 * sách hiển thị là các thành viên ACTIVE của project (luôn có ít nhất bản thân); KHÔNG có
 * lựa chọn "Automatic". Nếu project chưa mời ai khác, danh sách chỉ còn đúng 1 dòng — chính
 * người dùng hiện tại — tự nhiên thoả yêu cầu "không ai thì chỉ gán được cho bản thân".
 *
 * Dropdown render qua Portal ra `document.body`, định vị theo toạ độ thật (fixed) của nút
 * bấm -> không bị cắt bởi `overflow-hidden/auto` của khung chứa (vd cột Board cuộn dọc).
 */
const AssigneePicker = ({ projectId, value, onChange, size = 24, onOpenChange, readOnly = false }: AssigneePickerProps) => {
  const currentUser = useAuthStore((state) => state.user)
  const { data: project } = useProject(projectId)
  const { open, coords, triggerRef, dropdownRef, toggle, close } = useDropdownPosition({
    width: DROPDOWN_WIDTH,
    onOpenChange,
  })

  const members = (project?.members ?? []).filter((m) => m.status === 'ACTIVE')
  const selected = members.find((m) => m.userId === value)

  const handleSelect = (userId: string | null) => {
    onChange(userId)
    close()
  }

  if (readOnly) {
    return selected?.user ? (
      <Avatar src={selected.user.avatarUrl} name={selected.user.fullName} size={size} />
    ) : (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-canvas border border-dashed border-hairline flex items-center justify-center text-subtle text-[8px] font-bold shrink-0"
      >
        --
      </div>
    )
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          toggle()
        }}
        title={selected?.user?.fullName ?? 'Chưa gán — bấm để chọn người thực hiện'}
        className="rounded-full transition-all hover:ring-2 hover:ring-brand/30 shrink-0"
      >
        {selected?.user ? (
          <Avatar src={selected.user.avatarUrl} name={selected.user.fullName} size={size} />
        ) : (
          <div
            style={{ width: size, height: size }}
            className="rounded-full border border-dashed border-hairline flex items-center justify-center text-subtle hover:border-ink/30 hover:text-ink transition-colors"
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
            className="z-50 bg-surface border border-hairline rounded-lg shadow-lg py-1.5 max-h-64 overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-muted hover:bg-canvas transition-colors"
            >
              <div className="w-6 h-6 rounded-full border border-dashed border-hairline flex items-center justify-center shrink-0">
                <X size={12} />
              </div>
              <span className="flex-1 text-left">Chưa gán</span>
              {value === null && <Check size={14} className="text-brand" />}
            </button>

            <div className="my-1 border-t border-hairline" />

            {members.map((member) => {
              const isSelf = member.userId === currentUser?._id
              return (
                <button
                  key={member.userId}
                  type="button"
                  onClick={() => handleSelect(member.userId)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-ink hover:bg-canvas transition-colors"
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