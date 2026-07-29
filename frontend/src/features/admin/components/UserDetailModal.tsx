import { Mail, Calendar, KeyRound, Shield, LogIn } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/format'
import { useAdminUserDetail } from '../hooks/useAdminUsers'
import { TableLoading } from './TableStates'

interface UserDetailModalProps {
  userId: string | null
  onClose: () => void
}

const InfoField = ({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) => (
  <div className="p-3 border border-hairline rounded-lg bg-canvas space-y-1">
    <span className="text-[10px] font-semibold text-subtle uppercase tracking-wide">{label}</span>
    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
      <Icon size={13} className="text-muted shrink-0" />
      <span className="truncate">{value}</span>
    </div>
  </div>
)

export const UserDetailModal = ({ userId, onClose }: UserDetailModalProps) => {
  const { data: user, isLoading } = useAdminUserDetail(userId)

  return (
    <Modal open={!!userId} onClose={onClose} title="Chi tiết tài khoản">
      {isLoading || !user ? (
        <TableLoading />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3.5 p-3.5 bg-canvas rounded-lg border border-hairline">
            <Avatar src={user.avatarUrl} name={user.fullName} size={48} />
            <div className="min-w-0">
              <h4 className="font-semibold text-ink truncate">{user.fullName}</h4>
              <p className="text-xs text-subtle font-mono truncate">{user.email}</p>
            </div>
            <Badge color={user.role === 'admin' ? 'blue' : 'slate'} className="ml-auto shrink-0">
              <Shield size={11} className="mr-1" />
              {user.role}
            </Badge>
          </div>

          {user.bio && <p className="text-xs text-muted italic">"{user.bio}"</p>}

          <div className="grid grid-cols-2 gap-2.5">
            <InfoField icon={Mail} label="Xác thực email" value={user.isEmailVerified ? 'Đã xác thực' : 'Chưa xác thực'} />
            <InfoField icon={LogIn} label="Hình thức đăng nhập" value={user.authProvider} />
            <InfoField icon={KeyRound} label="Mật khẩu" value={user.hasPassword ? 'Đã đặt mật khẩu' : 'Chưa đặt (đăng nhập Google)'} />
            <InfoField icon={Calendar} label="Ngày tham gia" value={formatDate(user.createdAt)} />
          </div>

          <p className="text-[11px] text-subtle font-mono">
            ID: {user._id} · Cập nhật lần cuối {formatDate(user.updatedAt)}
          </p>
        </div>
      )}
    </Modal>
  )
}
