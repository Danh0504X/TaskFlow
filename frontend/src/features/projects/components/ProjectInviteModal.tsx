import { useState, type FormEvent } from 'react'
import { Mail, UserPlus, X } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { toast } from '@/components/ui/toast/toastStore'
import { getApiErrorMessage } from '@/lib/http'
import { useCheckEmail } from '@/features/auth/hooks/useAuthMutations'
import { useInviteMembers } from '../hooks/useProjectMutations'

interface ProjectInviteModalProps {
  open: boolean
  onClose: () => void
  projectId: string
}

interface TeamInvite {
  email: string
}

const ProjectInviteModal = ({ open, onClose, projectId }: ProjectInviteModalProps) => {
  const [email, setEmail] = useState('')
  const [invites, setInvites] = useState<TeamInvite[]>([])
  
  const checkEmailMutation = useCheckEmail()
  const inviteMembersMutation = useInviteMembers()

  const handleAddInvite = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return

    if (invites.some((inv) => inv.email === trimmed)) {
      toast.error('Email này đã được thêm vào danh sách mời.')
      return
    }

    try {
      const { available } = await checkEmailMutation.mutateAsync(trimmed)
      if (available) {
        toast.info(`Email ${trimmed} chưa đăng ký tài khoản. Hệ thống sẽ gửi email mời đăng ký.`)
      }
      setInvites([...invites, { email: trimmed }])
      setEmail('')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không kiểm tra được email, vui lòng thử lại.'))
    }
  }

  const handleRemoveInvite = (index: number) => {
    setInvites(invites.filter((_, i) => i !== index))
  }

  const handleSendInvites = () => {
    if (invites.length === 0) return

    inviteMembersMutation.mutate(
      {
        projectId,
        invites,
      },
      {
        onSuccess: () => {
          setInvites([])
          setEmail('')
          onClose()
        },
      }
    )
  }

  const isPending = checkEmailMutation.isPending || inviteMembersMutation.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mời thành viên"
      tone="brand"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleSendInvites}
            loading={inviteMembersMutation.isPending}
            disabled={invites.length === 0 || isPending}
          >
            Gửi lời mời
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <form onSubmit={handleAddInvite} className="flex gap-2 items-end">
          <div className="flex-grow space-y-1.5">
            <label className="text-[10px] font-extrabold text-ink uppercase tracking-wider">
              Địa chỉ email thành viên
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={14} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nhanvien@company.com"
                disabled={isPending}
                className="w-full bg-slate-50 border border-line/20 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none transition-all placeholder:text-subtle"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="secondary"
            loading={checkEmailMutation.isPending}
            disabled={!email.trim() || isPending}
            className="h-[36px] px-3.5"
          >
            <UserPlus size={14} />
            <span>Thêm</span>
          </Button>
        </form>

        <div className="space-y-2 pt-2 border-t border-line/10">
          <h3 className="text-[10px] font-extrabold text-ink uppercase tracking-wider">
            Danh sách sẽ mời ({invites.length})
          </h3>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
            {invites.map((member, index) => (
              <div
                key={member.email}
                className="flex items-center justify-between p-2.5 border border-line/15 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all"
              >
                <span className="text-xs font-semibold text-ink truncate flex-1 mr-2">{member.email}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveInvite(index)}
                  disabled={isPending}
                  className="p-1 text-muted hover:text-red-500 rounded-lg hover:bg-slate-100 transition-all shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {invites.length === 0 && (
              <p className="text-xs text-subtle italic py-2">Chưa thêm email nào vào danh sách mời.</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ProjectInviteModal
