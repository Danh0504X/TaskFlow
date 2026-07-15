import { useState, type FormEvent } from 'react'
import { Mail, UserPlus, X } from 'lucide-react'
import { toast } from '@/components/ui/toast/toastStore'
import { getApiErrorMessage } from '@/lib/http'
import { useCheckEmail } from '@/features/auth/hooks/useAuthMutations'

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
        <h2 className="text-2xl font-extrabold text-brand tracking-tight">Mời đồng đội tham gia</h2>
        <p className="text-muted mt-2 text-xs font-semibold">Cộng tác chặt chẽ và thúc đẩy tốc độ hoàn thành dự án cùng team.</p>
      </div>

      <form onSubmit={handleAddInvite} className="flex gap-3 items-end">
        <div className="flex-grow space-y-1.5">
          <label className="text-xs font-extrabold text-ink uppercase tracking-wider">Địa chỉ email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nhanvien@company.com"
              className="w-full bg-slate-50 border border-line/20 rounded-2xl pl-12 pr-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none transition-all placeholder:text-subtle"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={checkEmailMutation.isPending}
          className="bg-brand text-white hover:bg-brand-light px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-brand/15 h-[46px] disabled:opacity-45 disabled:pointer-events-none"
        >
          <UserPlus size={14} />
          <span>{checkEmailMutation.isPending ? 'Đang kiểm tra...' : 'Thêm'}</span>
        </button>
      </form>

      <div className="space-y-3 pt-4 border-t border-line/10">
        <h3 className="text-xs font-extrabold text-ink uppercase tracking-wider">Danh sách lời mời ({invites.length})</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {invites.map((member, index) => (
            <div key={member.email} className="flex items-center justify-between p-3 border border-line/15 rounded-2xl bg-white hover:bg-slate-50 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-muted font-bold text-xs">
                  {member.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-ink leading-none">{member.email}</p>
                  <p className="text-[10px] text-muted font-semibold mt-1">
                    Vai trò: <span className="font-extrabold text-brand">Member</span>
                  </p>
                </div>
              </div>
              <button onClick={() => handleRemoveInvite(index)} className="p-1.5 text-muted hover:text-red-500 rounded-lg hover:bg-slate-100 transition-all">
                <X size={14} />
              </button>
            </div>
          ))}
          {invites.length === 0 && <p className="text-xs text-subtle italic">Chưa có lời mời nào.</p>}
        </div>
      </div>
    </div>
  )
}

export default InviteTeam
