import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FolderKanban, Mail, RotateCcw, ShieldAlert } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { toast } from '@/components/ui/toast/toastStore'
import { getApiErrorMessage } from '@/lib/http'
import { formatDate } from '@/lib/format'
import { useProjectInvitations } from '../hooks/useProjects'
import { useAcceptInvitation, useDeclineInvitation } from '../hooks/useProjectMutations'
import ProjectMethodologyBadge from '../components/ProjectMethodologyBadge'

/**
 * Trang mở từ link mời trong email (/projects/:projectId/invitation).
 * KHÔNG tự động tham gia dự án — chỉ hiển thị 1 modal nhỏ ở giữa màn hình mô tả
 * dự án và cho user chủ động bấm "Tham gia" hoặc "Từ chối". Nếu user đóng modal
 * (bấm X / click ra ngoài) mà chưa chọn, lời mời vẫn giữ nguyên trạng thái PENDING
 * và có thể xử lý lại sau qua nút "Lời mời" ở trang /projects.
 */
const InvitationPage = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)

  const { data: invitations, isLoading, isError, refetch } = useProjectInvitations()
  const acceptMutation = useAcceptInvitation()
  const declineMutation = useDeclineInvitation()

  const invitation = useMemo(
    () => invitations?.find((inv) => inv.projectId === projectId),
    [invitations, projectId],
  )

  // Đóng mà không chọn -> chỉ điều hướng đi, KHÔNG gọi API accept/decline.
  const handleClose = () => {
    setOpen(false)
    navigate('/projects', { replace: true })
  }

  const handleAccept = () => {
    if (!projectId) return
    acceptMutation.mutate(
      { projectId },
      {
        onSuccess: () => {
          toast.success('Chấp nhận lời mời tham gia dự án thành công!')
          navigate(`/projects/${projectId}`, { replace: true })
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    )
  }

  const handleDecline = () => {
    if (!projectId) return
    declineMutation.mutate(
      { projectId },
      {
        onSuccess: () => navigate('/projects', { replace: true }),
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    )
  }

  if (!projectId) return null

  const isProcessing = acceptMutation.isPending || declineMutation.isPending

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Lời mời tham gia dự án"
      tone="brand"
      layout="compact"
      icon={<Mail size={18} />}
    >
      {isLoading ? (
        <div className="py-8 flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-xs text-muted font-medium">Đang tải thông tin lời mời...</p>
        </div>
      ) : isError ? (
        <div className="py-4 flex flex-col items-center gap-3 text-center">
          <p className="text-xs text-red-500 font-medium">Không tải được thông tin lời mời.</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RotateCcw size={14} />
            <span>Thử lại</span>
          </Button>
        </div>
      ) : invitation ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
            <FolderKanban size={26} />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-bold text-muted">Bạn được mời tham gia dự án</p>
            <h2 className="text-lg font-extrabold text-ink">{invitation.name}</h2>
            <div className="flex items-center justify-center gap-2">
              <ProjectMethodologyBadge methodology={invitation.methodology} />
              <span className="text-[10px] font-bold text-subtle uppercase tracking-wider">{invitation.key}</span>
            </div>
            <p className="text-xs text-subtle pt-1">
              {invitation.invitedBy && `Được mời bởi ${invitation.invitedBy.fullName} · `}
              {formatDate(invitation.invitedAt)}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              disabled={isProcessing}
              loading={declineMutation.isPending}
              onClick={handleDecline}
            >
              Từ chối
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              disabled={isProcessing}
              loading={acceptMutation.isPending}
              onClick={handleAccept}
            >
              Tham gia
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-4 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-pastel-red flex items-center justify-center text-pastel-red-ink">
            <ShieldAlert size={22} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-ink">Không tìm thấy lời mời</p>
            <p className="text-xs text-subtle max-w-[220px] mx-auto">
              Lời mời không tồn tại, đã hết hạn hoặc đã được xử lý trước đó.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleClose} className="mt-1">
            Quay lại danh sách dự án
          </Button>
        </div>
      )}
    </Modal>
  )
}

export default InvitationPage
