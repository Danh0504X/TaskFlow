import { useState } from 'react'
import { Check, Mail, X as XIcon } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { formatDate } from '@/lib/format'
import { useProjectInvitations } from '../hooks/useProjects'
import { useAcceptInvitation, useDeclineInvitation } from '../hooks/useProjectMutations'
import ProjectMethodologyBadge from './ProjectMethodologyBadge'

interface ProjectInvitationsModalProps {
  open: boolean
  onClose: () => void
}

/**
 * Modal nhỏ liệt kê các lời mời tham gia dự án đang chờ (status PENDING) của user hiện tại,
 * cho phép chấp nhận/từ chối ngay tại chỗ thay vì phải mở link trong email.
 */
const ProjectInvitationsModal = ({ open, onClose }: ProjectInvitationsModalProps) => {
  const { data: invitations, isLoading } = useProjectInvitations()
  const acceptMutation = useAcceptInvitation()
  const declineMutation = useDeclineInvitation()

  // Theo dõi project đang xử lý (accept/decline) để chỉ disable/loading đúng dòng đó,
  // không khoá cả danh sách khi có nhiều lời mời.
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleAccept = (projectId: string) => {
    setProcessingId(projectId)
    acceptMutation.mutate({ projectId }, { onSettled: () => setProcessingId(null) })
  }

  const handleDecline = (projectId: string) => {
    setProcessingId(projectId)
    declineMutation.mutate({ projectId }, { onSettled: () => setProcessingId(null) })
  }

  return (
    <Modal open={open} onClose={onClose} title="Lời mời tham gia dự án" tone="brand" icon={<Mail size={18} />}>
      <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1 scrollbar-thin">
        {isLoading && (
          <div className="py-10 flex justify-center text-muted">
            <Spinner />
          </div>
        )}

        {!isLoading && (invitations?.length ?? 0) === 0 && (
          <div className="py-10 text-center space-y-1">
            <p className="text-sm font-bold text-ink">Không có lời mời nào</p>
            <p className="text-xs text-subtle">Bạn chưa có lời mời tham gia dự án nào đang chờ xử lý.</p>
          </div>
        )}

        {invitations?.map((invitation) => {
          const isProcessing = processingId === invitation.projectId

          return (
            <div
              key={invitation.projectId}
              className="flex items-center justify-between gap-3 p-3 border border-line/15 rounded-xl bg-slate-50/50"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-sm font-bold text-ink truncate">{invitation.name}</p>
                  <ProjectMethodologyBadge methodology={invitation.methodology} />
                </div>
                <p className="text-xs text-subtle truncate">
                  {invitation.invitedBy ? `Được mời bởi ${invitation.invitedBy.fullName}` : `Mã dự án: ${invitation.key}`}
                  {' · '}
                  {formatDate(invitation.invitedAt)}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  className="!px-2.5"
                  disabled={isProcessing}
                  loading={isProcessing && declineMutation.isPending}
                  onClick={() => handleDecline(invitation.projectId)}
                >
                  <XIcon size={14} />
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isProcessing}
                  loading={isProcessing && acceptMutation.isPending}
                  onClick={() => handleAccept(invitation.projectId)}
                >
                  <Check size={14} />
                  <span>Chấp nhận</span>
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

export default ProjectInvitationsModal
