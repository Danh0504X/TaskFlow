import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Avatar from '@/components/ui/Avatar'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { Trash2 } from 'lucide-react'
import type { ProjectMember } from '../project.types'
import { formatDate } from '@/lib/format'
import { useRemoveMember } from '../hooks/useProjectMutations'

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
  const removeMutation = useRemoveMember()

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

  return (
    <>
      <Modal open={open} onClose={onClose} title="Thành viên dự án">
        <div className="max-h-[60vh] overflow-y-auto px-1 -mx-1 divide-y divide-hairline">
          {sortedMembers.map((member) => {
            const displayName = member.user?.fullName || 'Thành viên hệ thống'
            const avatarUrl = member.user?.avatarUrl
            const isOwnerRole = member.role === 'OWNER'
            const isPending = member.status === 'PENDING'

            return (
              <div key={member.userId} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <Avatar src={avatarUrl} name={displayName} size={36} />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ink">{displayName}</span>
                      {isOwnerRole && (
                        <span className="text-[10px] font-bold bg-pastel-blue text-pastel-blue-ink px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Owner
                        </span>
                      )}
                      {isPending && (
                        <span className="text-[10px] font-semibold bg-pastel-yellow text-pastel-yellow-ink px-2 py-0.5 rounded-full">
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
                  <button
                    type="button"
                    onClick={() => setDeletingMember(member)}
                    className="p-1.5 text-muted hover:text-pastel-red-ink rounded-md hover:bg-pastel-red transition-colors shrink-0"
                    title="Xóa thành viên"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </Modal>

      <ConfirmDialog
        open={deletingMember !== null}
        title="Xóa thành viên"
        message={`Bạn có chắc chắn muốn xóa thành viên "${deletingMember?.user?.fullName || 'Thành viên này'}" ra khỏi dự án? Tất cả các công việc đang gán cho họ sẽ trở thành "Chưa phân công".`}
        confirmText="Xóa thành viên"
        danger
        loading={removeMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingMember(null)}
      />
    </>
  )
}

export default ProjectMembersModal
