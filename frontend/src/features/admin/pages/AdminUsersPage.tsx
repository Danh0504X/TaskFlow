import { useState, type CSSProperties } from 'react'
import { Download, Eye, Lock, Unlock, Trash2 } from 'lucide-react'
import SearchInput from '@/components/ui/SearchInput'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatDate } from '@/lib/format'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { toast } from '@/components/ui/toast/toastStore'
import { adminApi } from '../admin.api'
import { useAdminCount, useAdminUsers, useDeleteUser, useUpdateUser } from '../hooks/useAdminUsers'
import { UserDetailModal } from '../components/UserDetailModal'
import AdminSelect from '../components/AdminSelect'
import AdminPageLayout from '../components/AdminPageLayout'
import Pagination from '../components/Pagination'
import { SectionCard, TableEmpty, TableError, TableLoading } from '../components/TableStates'
import type { AdminUserItem, UserRole, UserStatus } from '../admin.types'

const LIMIT = 10

const exportCsv = async (filters: { search: string; role: UserRole | ''; status: UserStatus | '' }) => {
  const { users } = await adminApi.getUsers({ ...filters, page: 1, limit: 9999 })
  const header = ['Họ tên', 'Email', 'Vai trò', 'Trạng thái', 'Đăng nhập', 'Ngày tạo']
  const rows = users.map((u) => [u.fullName, u.email, u.role, u.status, u.authProvider, formatDate(u.createdAt)])
  const csv = [header, ...rows].map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tai-khoan-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const AdminUsersPage = () => {
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')
  const [status, setStatus] = useState<UserStatus | ''>('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [detailUser, setDetailUser] = useState<AdminUserItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUserItem | null>(null)
  const [bulkAction, setBulkAction] = useState<UserStatus | null>(null)

  const { data, isLoading, isError } = useAdminUsers({ page, limit: LIMIT, search, role, status })
  const { data: adminCount } = useAdminCount()
  const updateUserMutation = useUpdateUser()
  const deleteUserMutation = useDeleteUser()

  const isSelf = (row: AdminUserItem) => !!currentUser?.email && currentUser.email === row.email
  const isLastAdmin = (row: AdminUserItem) => row.role === 'admin' && adminCount === 1

  const roleLockReason = (row: AdminUserItem): string | undefined => {
    if (isSelf(row)) return 'Không thể tự thay đổi vai trò của chính mình.'
    if (isLastAdmin(row)) return 'Không thể hạ quyền admin cuối cùng của hệ thống.'
    return undefined
  }

  const statusLockReason = (row: AdminUserItem): string | undefined => {
    if (isLastAdmin(row)) return 'Không thể khoá admin cuối cùng của hệ thống.'
    return undefined
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (!data) return
    setSelectedIds((prev) => {
      const pageIds = data.users.map((u) => u._id)
      const allSelected = pageIds.every((id) => prev.has(id))
      const next = new Set(prev)
      pageIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)))
      return next
    })
  }

  const handleToggleLock = async (row: AdminUserItem) => {
    const nextStatus: UserStatus = row.status === 'banned' ? 'active' : 'banned'
    await updateUserMutation.mutateAsync({ userId: row._id, payload: { status: nextStatus } })
    toast.success(nextStatus === 'banned' ? `Đã khoá tài khoản ${row.fullName}.` : `Đã mở khoá tài khoản ${row.fullName}.`)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    await deleteUserMutation.mutateAsync(deleteTarget._id)
    toast.success(`Đã xoá tài khoản ${deleteTarget.fullName}.`)
    setDeleteTarget(null)
  }

  const eligibleForBulk = data ? data.users.filter((u) => selectedIds.has(u._id) && !isLastAdmin(u)) : []
  const skippedForBulk = selectedIds.size - eligibleForBulk.length

  const handleConfirmBulk = async () => {
    if (!bulkAction) return
    await Promise.all(eligibleForBulk.map((u) => updateUserMutation.mutateAsync({ userId: u._id, payload: { status: bulkAction } })))
    toast.success(
      `Đã ${bulkAction === 'banned' ? 'khoá' : 'mở khoá'} ${eligibleForBulk.length} tài khoản` +
        (skippedForBulk > 0 ? `, bỏ qua ${skippedForBulk} tài khoản (admin cuối cùng).` : '.'),
    )
    setBulkAction(null)
    setSelectedIds(new Set())
  }

  return (
    <AdminPageLayout title="Tài khoản" subtitle="Xem, tìm kiếm, sửa hồ sơ và khoá/mở khoá tài khoản người dùng.">
      <SectionCard className="p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-end justify-between">
        <SearchInput
          placeholder="Tìm theo tên hoặc email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          containerClassName="md:max-w-xs"
        />

        <div className="flex items-center gap-2">
          <AdminSelect
            value={role}
            onChange={(e) => {
              setRole(e.target.value as UserRole | '')
              setPage(1)
            }}
          >
            <option value="">Tất cả vai trò</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </AdminSelect>

          <AdminSelect
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as UserStatus | '')
              setPage(1)
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="banned">Bị khoá</option>
            <option value="inactive">Chưa kích hoạt</option>
          </AdminSelect>

          <Button variant="secondary" size="sm" onClick={() => exportCsv({ search, role, status })}>
            <Download size={14} />
            Xuất CSV
          </Button>
        </div>
      </SectionCard>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-brand/10 border border-brand/30 rounded-lg px-4 py-2.5">
          <span className="text-xs font-semibold text-ink">Đã chọn {selectedIds.size} tài khoản</span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setBulkAction('active')}>
              <Unlock size={13} />
              Mở khoá hàng loạt
            </Button>
            <Button variant="danger" size="sm" onClick={() => setBulkAction('banned')}>
              <Lock size={13} />
              Khoá hàng loạt
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              Bỏ chọn
            </Button>
          </div>
        </div>
      )}

      <SectionCard>
        {isLoading && <TableLoading label="Đang tải danh sách tài khoản..." />}
        {isError && <TableError />}
        {!isLoading && !isError && data && data.users.length === 0 && (
          <TableEmpty title="Không tìm thấy tài khoản nào." description="Thử đổi từ khoá tìm kiếm hoặc bộ lọc." />
        )}

        {!isLoading && !isError && data && data.users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline text-[10px] font-semibold text-subtle uppercase tracking-wider">
                  <th className="py-2.5 px-4 w-8">
                    <input
                      type="checkbox"
                      checked={data.users.every((u) => selectedIds.has(u._id))}
                      onChange={toggleSelectAll}
                      className="accent-brand"
                    />
                  </th>
                  <th className="py-2.5 px-4">Người dùng</th>
                  <th className="py-2.5 px-4">Gói Dịch Vụ</th>
                  <th className="py-2.5 px-4">Vai trò</th>
                  <th className="py-2.5 px-4">Trạng thái</th>
                  <th className="py-2.5 px-4">Ngày tạo</th>
                  <th className="py-2.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-[13px]">
                {data.users.map((u, idx) => {
                  const self = isSelf(u)
                  const lastAdmin = isLastAdmin(u)
                  const isPro = u.plan === 'PRO' && u.currentPlanExpiresAt && new Date(u.currentPlanExpiresAt) > new Date()
                  return (
                    <tr
                      key={u._id}
                      className="group animate-fade-up hover:bg-canvas/60 transition-colors"
                      style={{ '--stagger': idx } as CSSProperties}
                    >
                      <td className="py-2.5 px-4">
                        <input type="checkbox" checked={selectedIds.has(u._id)} onChange={() => toggleSelect(u._id)} className="accent-brand" />
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={u.avatarUrl} name={u.fullName} size={30} />
                          <div className="min-w-0">
                            <div className="font-semibold text-ink truncate flex items-center gap-1.5">
                              {u.fullName}
                              {self && <Badge color="blue">Bạn</Badge>}
                            </div>
                            <div className="text-[11px] text-subtle font-mono truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        {isPro ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md">
                            👑 PRO (VIP)
                          </span>
                        ) : (
                          <Badge color="slate">FREE</Badge>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge color={u.role === 'admin' ? 'blue' : 'slate'}>{u.role}</Badge>
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge color={u.status === 'active' ? 'green' : u.status === 'banned' ? 'red' : 'amber'}>
                          {u.status === 'active' ? 'Hoạt động' : u.status === 'banned' ? 'Bị khoá' : 'Chưa kích hoạt'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs text-subtle">{formatDate(u.createdAt)}</td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button
                            onClick={() => setDetailUser(u)}
                            className="p-1.5 text-muted hover:text-pastel-blue-ink hover:bg-pastel-blue rounded-md transition-colors"
                            title="Xem & chỉnh sửa chi tiết"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleToggleLock(u)}
                            disabled={lastAdmin}
                            title={lastAdmin ? 'Không thể khoá admin cuối cùng của hệ thống' : u.status === 'banned' ? 'Mở khoá' : 'Khoá tài khoản'}
                            className="p-1.5 text-muted hover:text-pastel-yellow-ink hover:bg-pastel-yellow rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-muted disabled:hover:bg-transparent"
                          >
                            {u.status === 'banned' ? <Unlock size={15} /> : <Lock size={15} />}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(u)}
                            disabled={self || lastAdmin}
                            title={self ? 'Không thể tự xoá chính mình' : lastAdmin ? 'Không thể xoá admin cuối cùng của hệ thống' : 'Xoá tài khoản'}
                            className="p-1.5 text-muted hover:text-pastel-red-ink hover:bg-pastel-red rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-muted disabled:hover:bg-transparent"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {data && <Pagination page={page} limit={LIMIT} total={data.total} currentCount={data.users.length} onChange={setPage} />}
      </SectionCard>

      {/* key theo userId -> remount mỗi lần đổi dòng, tránh giữ role/trạng thái cũ của dòng trước. */}
      <UserDetailModal
        key={detailUser?._id ?? 'none'}
        userId={detailUser?._id ?? null}
        onClose={() => setDetailUser(null)}
        roleLocked={!!detailUser && !!roleLockReason(detailUser)}
        roleLockedReason={detailUser ? roleLockReason(detailUser) : undefined}
        lockToggleLocked={!!detailUser && !!statusLockReason(detailUser)}
        lockToggleLockedReason={detailUser ? statusLockReason(detailUser) : undefined}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xoá tài khoản"
        message={`Bạn có chắc chắn muốn xoá tài khoản "${deleteTarget?.fullName}" không? Hành động này không thể hoàn tác.`}
        confirmText="Xoá tài khoản"
        danger
        loading={deleteUserMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmDialog
        open={!!bulkAction}
        title={bulkAction === 'banned' ? 'Khoá hàng loạt' : 'Mở khoá hàng loạt'}
        message={
          skippedForBulk > 0
            ? `Áp dụng cho ${eligibleForBulk.length}/${selectedIds.size} tài khoản đã chọn (bỏ qua ${skippedForBulk} tài khoản vì là admin cuối cùng của hệ thống).`
            : `Áp dụng cho ${eligibleForBulk.length} tài khoản đã chọn.`
        }
        confirmText="Xác nhận"
        danger={bulkAction === 'banned'}
        loading={updateUserMutation.isPending}
        onClose={() => setBulkAction(null)}
        onConfirm={handleConfirmBulk}
      />
    </AdminPageLayout>
  )
}

export default AdminUsersPage
