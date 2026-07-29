import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Mail, UserPlus, X } from 'lucide-react'
import { toast } from '@/components/ui/toast/toastStore'
import { getApiErrorMessage } from '@/lib/http'
import { useCheckEmail } from '@/features/auth/hooks/useAuthMutations'
import { easeOut } from '@/lib/motion'

export interface TeamInvite {
  email: string
}

interface InviteTeamProps {
  invites: TeamInvite[]
  onChange: (invites: TeamInvite[]) => void
}

/** Danh sách lời mời thành viên trong wizard — mọi lời mời đều được thêm với vai trò MEMBER. */
const InviteTeam = ({ invites, onChange }: InviteTeamProps) => {
  const [email, setEmail] = useState('')
  const checkEmailMutation = useCheckEmail()

  const handleAddInvite = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || invites.some((inv) => inv.email === trimmed)) return

    try {
      // available: true -> chưa có tài khoản nào dùng email này -> không cho mời.
      const { available } = await checkEmailMutation.mutateAsync(trimmed)
      if (available) {
        toast.error(`Email ${trimmed} chưa có tài khoản trong hệ thống, không thể mời.`)
        return
      }
      onChange([...invites, { email: trimmed }])
      setEmail('')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không kiểm tra được email, vui lòng thử lại.'))
    }
  }

  const handleRemoveInvite = (index: number) => {
    onChange(invites.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto text-left">
      <div className="text-center mb-8">
        <h2 className="font-editorial text-2xl font-medium text-ink tracking-tight">Mời đồng đội tham gia</h2>
        <p className="text-muted mt-2 text-xs">Cộng tác chặt chẽ và thúc đẩy tốc độ hoàn thành dự án cùng team.</p>
      </div>

      <form onSubmit={handleAddInvite} className="flex gap-3 items-end">
        <div className="flex-grow space-y-1.5">
          <label className="text-xs font-semibold text-ink uppercase tracking-wider">Địa chỉ email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nhanvien@company.com"
              className="w-full bg-surface border border-hairline rounded-lg pl-12 pr-4 py-3 text-xs font-medium focus:ring-2 focus:ring-brand/15 focus:border-ink/20 outline-none transition-all placeholder:text-subtle"
            />
          </div>
        </div>

        <motion.button
          type="submit"
          whileTap={{ scale: 0.98 }}
          disabled={checkEmailMutation.isPending}
          className="bg-ink text-canvas hover:bg-[#e4e4e5] px-5 py-3 rounded-lg font-semibold text-xs flex items-center gap-1.5 h-[46px] transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <UserPlus size={14} />
          <span>{checkEmailMutation.isPending ? 'Đang kiểm tra...' : 'Thêm'}</span>
        </motion.button>
      </form>

      <div className="space-y-3 pt-4 border-t border-hairline">
        <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">Danh sách lời mời ({invites.length})</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {invites.map((member, index) => (
              <motion.div
                key={member.email}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2, ease: easeOut }}
                className="flex items-center justify-between p-3 border border-hairline rounded-lg bg-surface hover:border-ink/15 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-pastel-blue text-pastel-blue-ink flex items-center justify-center font-semibold text-xs shrink-0">
                    {member.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink leading-none">{member.email}</p>
                    <p className="text-[10px] text-muted mt-1">
                      Vai trò: <span className="font-semibold text-ink">Member</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveInvite(index)}
                  className="p-1.5 text-muted hover:text-pastel-red-ink hover:bg-pastel-red rounded-md transition-colors"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {invites.length === 0 && <p className="text-xs text-subtle italic">Chưa có lời mời nào.</p>}
        </div>
      </div>
    </div>
  )
}

export default InviteTeam
