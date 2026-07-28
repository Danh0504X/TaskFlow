import Modal from '@/components/ui/Modal'
import Avatar from '@/components/ui/Avatar'
import type { ProjectMember } from '../project.types'
import { formatDate } from '@/lib/format'

interface ProjectMembersModalProps {
  open: boolean
  onClose: () => void
  members: ProjectMember[]
}

const ProjectMembersModal = ({ open, onClose, members }: ProjectMembersModalProps) => {
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

  return (
    <Modal open={open} onClose={onClose} title="Thành viên dự án" size="md">
      <div className="max-h-[60vh] overflow-y-auto px-1 -mx-1 divide-y divide-line/10">
        {sortedMembers.map((member) => {
          const displayName = member.user?.fullName || 'Thành viên hệ thống'
          const avatarUrl = member.user?.avatarUrl
          const isOwner = member.role === 'OWNER'
          const isPending = member.status === 'PENDING'

          return (
            <div key={member.userId} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <Avatar src={avatarUrl} name={displayName} size={36} />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-ink">{displayName}</span>
                    {isOwner && (
                      <span className="text-[10px] font-extrabold bg-brand/10 text-brand px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Owner
                      </span>
                    )}
                    {isPending && (
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200/50 px-2 py-0.5 rounded-full">
                        Chờ xác nhận
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted mt-0.5">
                    Tham gia ngày {formatDate(member.joinedAt)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

export default ProjectMembersModal
