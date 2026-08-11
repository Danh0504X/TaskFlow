import { useState } from 'react'
import { Mail, Calendar, Lock, Unlock, Crown, ShieldCheck } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'
import { toast } from '@/components/ui/toast/toastStore'
import { useAdminUserDetail, useUpdateUser } from '../hooks/useAdminUsers'
import { paymentApi } from '@/features/payment/payment.api'
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

/** Xem chi tiết + chỉnh sửa 1 tài khoản, gộp trong cùng 1 modal. */
export const UserDetailModal = ({ userId, onClose, roleLocked, roleLockedReason, lockToggleLocked, lockToggleLockedReason }: UserDetailModalProps) => {
  const { data: user, isLoading, refetch } = useAdminUserDetail(userId)
  const mutation = useUpdateUser()

  const [roleOverride, setRoleOverride] = useState<UserRole | null>(null)
  const [statusOverride, setStatusOverride] = useState<UserStatus | null>(null)
  const [grantingPro, setGrantingPro] = useState<boolean>(false)

  const role = roleOverride ?? user?.role ?? 'user'
  const status = statusOverride ?? user?.status ?? 'active'

  const roleChanged = !!user && roleOverride !== null && roleOverride !== user.role
  const statusChanged = !!user && statusOverride !== null && statusOverride !== user.status
  const canSubmit = roleChanged || statusChanged

  const isPro = user?.plan === 'PRO' && user?.currentPlanExpiresAt && new Date(user.currentPlanExpiresAt) > new Date()
  const expiresAtFormatted = user?.currentPlanExpiresAt ? formatDate(user.currentPlanExpiresAt) : 'Vĩnh viễn'

  const handleGrantProManually = async (days: number) => {
    if (!user) return
    const reason = prompt(
      days > 0
        ? `Cấp +${days} ngày PRO cho ${user.fullName}.\nNhập lý do cấp (bắt buộc để lưu nhật ký giao dịch):`
        : `Gỡ quyền PRO của ${user.fullName}.\nNhập lý do gỡ quyền (bắt buộc để lưu nhật ký giao dịch):`,
      days > 0 ? 'Admin cấp quyền PRO ưu đãi / đối soát thủ công' : 'Admin gỡ quyền PRO'
    )
    if (!reason || !reason.trim()) {
      if (reason !== null) toast.error('Bắt buộc phải nhập lý do khi xử lý thủ công!')
      return
    }

    try {
      setGrantingPro(true)
      await paymentApi.resolveTransactionManually({
        userId: user._id,
        daysToAdd: days,
        adminNote: reason.trim(),
      })

      toast.success(days > 0 ? `Đã cấp +${days} ngày PRO và lưu lịch sử giao dịch!` : `Đã gỡ quyền PRO thành công!`)
      refetch()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật gói PRO.')
    } finally {
      setGrantingPro(false)
    }
  }

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

          {/* Quản lý Gói Dịch Vụ PRO (Lưu Nhật ký Giao dịch) */}
          <div className="p-3.5 border border-amber-500/30 rounded-xl bg-amber-500/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Crown size={16} className="text-amber-500" />
                <span className="text-xs font-bold text-ink">Gói Dịch Vụ Hiện Tại:</span>
              </div>
              {isPro ? (
                <span className="text-[11px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-md shadow-sm">
                  Gói PRO (VIP)
                </span>
              ) : (
                <span className="text-[11px] font-bold bg-subtle/20 text-subtle px-2 py-0.5 rounded-md">
                  Gói FREE
                </span>
              )}
            </div>

            <p className="text-[11px] text-subtle">
              {isPro
                ? `Hạn sử dụng gói PRO: ${expiresAtFormatted}. (AI Không giới hạn)`
                : 'Tài khoản đang dùng gói miễn phí (giới hạn lượt dùng AI/ngày).'}
            </p>

            <div className="flex items-center gap-2 pt-1 border-t border-hairline">
              <button
                type="button"
                onClick={() => handleGrantProManually(30)}
                disabled={grantingPro}
                className="flex-1 py-1.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold text-[11px] rounded-lg shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck size={13} />
                +30 Ngày PRO (Lưu Nhật Ký)
              </button>
              {isPro && (
                <button
                  type="button"
                  onClick={() => handleGrantProManually(-999)}
                  disabled={grantingPro}
                  className="py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold text-[11px] rounded-lg border border-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  Gỡ PRO
                </button>
              )}
            </div>
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
