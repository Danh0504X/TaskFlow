import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import AdminSelect from './AdminSelect'
import { toast } from '@/components/ui/toast/toastStore'
import { useUpdateUser } from '../hooks/useAdminUsers'
import type { AdminUserItem, UserRole } from '../admin.types'

interface EditUserModalProps {
  user: AdminUserItem | null
  roleLocked: boolean
  roleLockedReason?: string
  onClose: () => void
}

/** Sửa hồ sơ 1 tài khoản: đổi tên và/hoặc vai trò. Vai trò bị khoá (disabled kèm lý do) khi
 * đang sửa chính admin đang đăng nhập, hoặc khi đây là admin cuối cùng của hệ thống — cha
 * (AdminUsersPage) tính sẵn 2 điều kiện đó rồi gộp thành `roleLocked`. */
const EditUserModal = ({ user, roleLocked, roleLockedReason, onClose }: EditUserModalProps) => {
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [role, setRole] = useState<UserRole>(user?.role ?? 'user')
  const mutation = useUpdateUser()

  if (!user) return null

  const trimmedName = fullName.trim()
  const nameChanged = trimmedName !== user.fullName
  const roleChanged = role !== user.role
  const canSubmit = trimmedName.length >= 2 && (nameChanged || roleChanged)

  const handleSubmit = async () => {
    const payload: { fullName?: string; role?: UserRole } = {}
    if (nameChanged) payload.fullName = trimmedName
    if (roleChanged) payload.role = role
    await mutation.mutateAsync({ userId: user._id, payload })
    toast.success(`Đã cập nhật tài khoản ${trimmedName}.`)
    onClose()
  }

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title="Chỉnh sửa tài khoản"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Huỷ
          </Button>
          <Button loading={mutation.isPending} disabled={!canSubmit} onClick={handleSubmit}>
            Lưu thay đổi
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Họ tên"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={trimmedName.length > 0 && trimmedName.length < 2 ? 'Tên quá ngắn' : undefined}
        />

        <div>
          <AdminSelect
            label="Vai trò"
            value={role}
            disabled={roleLocked}
            title={roleLocked ? roleLockedReason : undefined}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </AdminSelect>
          {roleLocked && roleLockedReason && <p className="text-[11px] text-amber-500 mt-1">{roleLockedReason}</p>}
        </div>

        <p className="text-[11px] text-subtle font-mono">{user.email}</p>
      </div>
    </Modal>
  )
}

export default EditUserModal
