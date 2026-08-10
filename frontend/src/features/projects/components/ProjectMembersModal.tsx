import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Avatar from '@/components/ui/Avatar'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { Crown, Trash2 } from 'lucide-react'
import type { ProjectMember } from '../project.types'
import { formatDate } from '@/lib/format'
import { useRemoveMember, useTransferOwnership } from '../hooks/useProjectMutations'

interface ProjectMembersModalProps {
  open: boolean
  onClose: () => void
  members: ProjectMember[]
  projectId: string
  isOwner: boolean
}

const ProjectMembersModal = ({ open, onClose, members, projectId, isOwner }: ProjectMembersModalProps) => {
  // Loại bỏ các thành viên đã rời/bị xóa (status === 'REMOVED')
  const activeAndPendingMembers = members.filter((m) => m.status !== 'REMOVED')

  // Sắp xếp: OWNER (Chủ sở hữu) lên đầu, sau đó đến các thành viên còn lại
  const sortedMembers = [...activeAndPendingMembers].sort((a, b) => {
    if (a.role === 'OWNER') return -1
    if (b.role === 'OWNER') return 1
    
    if (a.status === 'ACTIVE' && b.status === 'PENDING') return -1
    if (a.status === 'PENDING' && b.status === 'ACTIVE') return 1
    
    return 0
  })

  const [deletingMember, setDeletingMember] = useState<ProjectMember | null>(null)
  const [transferringMember, setTransferringMember] = useState<ProjectMember | null>(null)

  const removeMutation = useRemoveMember()
  const transferMutation = useTransferOwnership()

  const handleConfirmDelete = () => {
    if (!deletingMember) return
    removeMutation.mutate(
      { projectId, userId: deletingMember.userId },
      {
        onSuccess: () => {
          setDeletingMember(null)
        },
      }
    )
  }

  const handleConfirmTransfer = () => {
    if (!transferringMember) return
    transferMutation.mutate(
      { projectId, newOwnerId: transferringMember.userId },
      {
        onSuccess: () => {
          setTransferringMember(null)
          onClose() // Đóng modal danh sách thành viên sau khi chuyển quyền thành công
        },
      }
    )
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Thành viên dự án">
        <div className="max-h-[60vh] overflow-y-auto px-1 -mx-1 divide-y divide-hairline">
          {sortedMembers.map((member) => {
            const displayName = member.user?.fullName || 'Thành viên hệ thống'
            const avatarUrl = member.user?.avatarUrl
            const isOwnerRole = member.role === 'OWNER'
            const isPending = member.status === 'PENDING'
            const isActive = member.status === 'ACTIVE'

            return (
              <div key={member.userId} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar src={avatarUrl} name={displayName} size={36} />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-ink truncate">{displayName}</span>
                      {isOwnerRole && (
                        <span className="text-[10px] font-bold bg-pastel-blue text-pastel-blue-ink px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                          Owner
                        </span>
                      )}
                      {isPending && (
                        <span className="text-[10px] font-semibold bg-pastel-yellow text-pastel-yellow-ink px-2 py-0.5 rounded-full shrink-0">
                          Chờ xác nhận
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted mt-0.5">
                      Tham gia ngày {formatDate(member.joinedAt)}
                    </span>
                  </div>
                </div>

                {isOwner && !isOwnerRole && (
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Nút chuyển quyền sở hữu (chỉ đối với thành viên ACTIVE) */}
                    {isActive && (
                      <button
                        type="button"
                        onClick={() => setTransferringMember(member)}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 rounded-lg text-xs font-bold transition-colors"
                        title="Chuyển quyền Chủ sở hữu dự án cho thành viên này"
                      >
                        <Crown size={13} />
                        <span>Chuyển Owner</span>
                      </button>
                    )}

                    {/* Nút gỡ thành viên khỏi dự án */}
                    <button
                      type="button"
                      onClick={() => setDeletingMember(member)}
                      className="p-1.5 text-muted hover:text-pastel-red-ink rounded-md hover:bg-pastel-red transition-colors shrink-0"
                      title="Gỡ thành viên khỏi dự án"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Modal>

      {/* Modal xác nhận gỡ thành viên */}
      <ConfirmDialog
        open={deletingMember !== null}
        title="Gỡ thành viên khỏi dự án"
        message={`Bạn có chắc chắn muốn gỡ thành viên "${deletingMember?.user?.fullName || 'Thành viên này'}" ra khỏi dự án? Thành viên sẽ mất toàn bộ quyền truy cập và các công việc họ đang phụ trách sẽ tự động trở thành "Cần giao lại".`}
        confirmText="Gỡ khỏi dự án"
        danger
        loading={removeMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingMember(null)}
      />

      {/* Modal xác nhận chuyển quyền Chủ sở hữu dự án */}
      <ConfirmDialog
        open={transferringMember !== null}
        title="Chuyển quyền Chủ sở hữu dự án"
        message={`Bạn có chắc chắn muốn chuyển quyền Chủ sở hữu dự án (OWNER) cho "${transferringMember?.user?.fullName || 'thành viên này'}"? Sau khi chuyển, bạn sẽ trở thành Thành viên (MEMBER) và nhường lại quyền quản trị dự án.`}
        confirmText="Xác nhận chuyển OWNER"
        loading={transferMutation.isPending}
        onConfirm={handleConfirmTransfer}
        onClose={() => setTransferringMember(null)}
      />
    </>
  )
}

export default ProjectMembersModal
