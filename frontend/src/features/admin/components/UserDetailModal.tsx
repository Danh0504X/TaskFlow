import { useState } from 'react'
import { Mail, Calendar, Lock, Unlock } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'
import { toast } from '@/components/ui/toast/toastStore'
import { useAdminUserDetail, useUpdateUser } from '../hooks/useAdminUsers'
import { TableLoading } from './TableStates'
import AdminSelect from './AdminSelect'
import type { UpdateUserPayload, UserRole, UserStatus } from '../admin.types'

interface UserDetailModalProps {
  userId: string | null
  onClose: () => void
  /** Vai trò bị khoá (không cho sửa) khi đang xem chính admin đang đăng nhập, hoặc đây là
   * admin cuối cùng của hệ thống — cha (AdminUsersPage) tính sẵn 2 điều kiện đó. */
  roleLocked: boolean
  roleLockedReason?: string
  /** Khoá/mở khoá tài khoản bị chặn khi đây là admin cuối cùng của hệ thống. */
  lockToggleLocked: boolean
  lockToggleLockedReason?: string
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

/** Xem chi tiết + chỉnh sửa 1 tài khoản, gộp trong cùng 1 modal. Chỉ cho phép sửa vai trò và
 * trạng thái khoá/mở khoá — không cho đổi tên (giữ nguyên dữ liệu người dùng tự khai). */
export const UserDetailModal = ({ userId, onClose, roleLocked, roleLockedReason, lockToggleLocked, lockToggleLockedReason }: UserDetailModalProps) => {
  const { data: user, isLoading } = useAdminUserDetail(userId)
  const mutation = useUpdateUser()

  // Chỉ lưu phần admin *muốn đổi* (không mirror toàn bộ user vào state) — nhờ cha remount
  // component qua `key` mỗi lần đổi userId nên không cần effect đồng bộ lại khi data tải xong.
  const [roleOverride, setRoleOverride] = useState<UserRole | null>(null)
  const [statusOverride, setStatusOverride] = useState<UserStatus | null>(null)

  const role = roleOverride ?? user?.role ?? 'user'
  const status = statusOverride ?? user?.status ?? 'active'

  const roleChanged = !!user && roleOverride !== null && roleOverride !== user.role
  // status có thể là 'inactive' (chưa kích hoạt) — chỉ tính là "đã đổi" khi admin bấm chọn tường minh,
  // tránh trường hợp mở modal lên là tự động coi như muốn chuyển inactive -> active.
  const statusChanged = !!user && statusOverride !== null && statusOverride !== user.status
  const canSubmit = roleChanged || statusChanged

  const handleSubmit = async () => {
    if (!user) return
    const payload: UpdateUserPayload = {}
    if (roleChanged) payload.role = role
    if (statusChanged) payload.status = status
    await mutation.mutateAsync({ userId: user._id, payload })
    toast.success(`Đã cập nhật tài khoản ${user.fullName}.`)
    onClose()
  }

  return (
    <Modal
      open={!!userId}
      onClose={onClose}
      title="Chi tiết tài khoản"
      footer={
        !isLoading && user ? (
          <>
            <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
              Huỷ
            </Button>
            <Button loading={mutation.isPending} disabled={!canSubmit} onClick={handleSubmit}>
              Lưu thay đổi
            </Button>
          </>
        ) : undefined
      }
    >
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
            <Badge color={user.status === 'active' ? 'green' : user.status === 'banned' ? 'red' : 'amber'} className="ml-auto shrink-0">
              {user.status === 'active' ? 'Hoạt động' : user.status === 'banned' ? 'Bị khoá' : 'Chưa kích hoạt'}
            </Badge>
          </div>

          {user.bio && <p className="text-xs text-muted italic">"{user.bio}"</p>}

          <div className="grid grid-cols-2 gap-2.5">
            <InfoField icon={Mail} label="Xác thực email" value={user.isEmailVerified ? 'Đã xác thực' : 'Chưa xác thực'} />
            <InfoField icon={Calendar} label="Ngày tham gia" value={formatDate(user.createdAt)} />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-subtle uppercase tracking-wide">Vai trò</span>
            <AdminSelect
              value={role}
              disabled={roleLocked}
              title={roleLocked ? roleLockedReason : undefined}
              onChange={(e) => setRoleOverride(e.target.value as UserRole)}
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </AdminSelect>
            {roleLocked && roleLockedReason && <p className="text-[11px] text-amber-500">{roleLockedReason}</p>}
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-subtle uppercase tracking-wide">Trạng thái tài khoản</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatusOverride('active')}
                disabled={lockToggleLocked}
                title={lockToggleLocked ? lockToggleLockedReason : undefined}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-semibold transition-colors',
                  status === 'active'
                    ? 'border-pastel-green-ink/30 bg-pastel-green text-pastel-green-ink'
                    : 'border-hairline text-muted hover:bg-canvas',
                  lockToggleLocked && 'opacity-50 cursor-not-allowed hover:bg-transparent',
                )}
              >
                <Unlock size={13} />
                Hoạt động
              </button>
              <button
                type="button"
                onClick={() => setStatusOverride('banned')}
                disabled={lockToggleLocked}
                title={lockToggleLocked ? lockToggleLockedReason : undefined}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-semibold transition-colors',
                  status === 'banned'
                    ? 'border-pastel-red-ink/30 bg-pastel-red text-pastel-red-ink'
                    : 'border-hairline text-muted hover:bg-canvas',
                  lockToggleLocked && 'opacity-50 cursor-not-allowed hover:bg-transparent',
                )}
              >
                <Lock size={13} />
                Khoá
              </button>
            </div>
            {lockToggleLocked && lockToggleLockedReason && <p className="text-[11px] text-amber-500">{lockToggleLockedReason}</p>}
            {!lockToggleLocked && user.status === 'inactive' && statusOverride === null && (
              <p className="text-[11px] text-subtle">Tài khoản chưa kích hoạt (chưa xác thực email).</p>
            )}
          </div>

          <p className="text-[11px] text-subtle font-mono">
            ID: {user._id} · Cập nhật lần cuối {formatDate(user.updatedAt)}
          </p>
        </div>
      )}
    </Modal>
  )
}
