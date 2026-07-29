import { useState } from 'react'
import { Search, Shield, Lock, Unlock, Eye, Trash2, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import { useAdminUsers, useUpdateUserStatus, useDeleteUser } from '../hooks/useAdminUsers'
import { UserDetailModal } from '../components/UserDetailModal'
import type { UserRole, UserStatus } from '../admin.types'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')
  const [status, setStatus] = useState<UserStatus | ''>('')
  const [page, setPage] = useState(1)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const { data, isLoading } = useAdminUsers({ page, limit: 10, search, role, status })
  const updateStatusMutation = useUpdateUserStatus()
  const deleteUserMutation = useDeleteUser()

  const handleToggleLock = async (userId: string, currentStatus: UserStatus) => {
    const nextStatus: UserStatus = currentStatus === 'banned' ? 'active' : 'banned'
    await updateStatusMutation.mutateAsync({
      userId,
      payload: { status: nextStatus },
    })
  }

  const handleDelete = async (userId: string, fullName: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${fullName}" không?`)) {
      await deleteUserMutation.mutateAsync(userId)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản trị người dùng</h1>
          <p className="text-slate-500 text-sm mt-1">
            Xem, tìm kiếm, kiểm tra chi tiết và khóa/mở khóa tài khoản (U051, U052, U053)
          </p>
        </div>
      </div>

      {/* Filter / Search Bar (U051) */}
      <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm theo Tên hoặc Email người dùng..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm">
            <Filter size={16} className="text-slate-400" />
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as UserRole | '')
                setPage(1)
              }}
              className="bg-transparent focus:outline-none text-slate-700 text-sm font-medium"
            >
              <option value="">Tất cả Vai trò</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as UserStatus | '')
                setPage(1)
              }}
              className="bg-transparent focus:outline-none text-slate-700 text-sm font-medium"
            >
              <option value="">Tất cả Trạng thái</option>
              <option value="active">Active (Hoạt động)</option>
              <option value="banned">Banned (Đã khóa)</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Đang tải danh sách người dùng...</div>
        ) : !data || data.users.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Không tìm thấy tài khoản người dùng nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Người dùng</th>
                  <th className="py-4 px-6">Vai trò</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6">Ngày tạo</th>
                  <th className="py-4 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {data.users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.avatarUrl} name={u.fullName} size={40} />
                        <div>
                          <div className="font-semibold text-slate-900">{u.fullName}</div>
                          <div className="text-xs text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          u.role === 'admin'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Shield size={12} />
                        <span className="capitalize">{u.role}</span>
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : u.status === 'banned'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {u.status === 'active'
                          ? 'Hoạt động'
                          : u.status === 'banned'
                          ? 'Bị khóa'
                          : 'Chưa kích hoạt'}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-500 text-xs font-medium">
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>

                    <td className="py-4 px-6 text-right space-x-2">
                      {/* Xem chi tiết (U052) */}
                      <button
                        onClick={() => setSelectedUserId(u._id)}
                        className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>

                      {/* Khóa/Mở khóa (U053) */}
                      <button
                        onClick={() => handleToggleLock(u._id, u.status)}
                        className={`p-2 rounded-lg transition-all ${
                          u.status === 'banned'
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-amber-600 hover:bg-amber-50'
                        }`}
                        title={u.status === 'banned' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                      >
                        {u.status === 'banned' ? <Unlock size={18} /> : <Lock size={18} />}
                      </button>

                      {/* Xóa user */}
                      <button
                        onClick={() => handleDelete(u._id, u.fullName)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Xóa tài khoản"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
            <div>
              Hiển thị <strong>{data.users.length}</strong> / <strong>{data.total}</strong> tài khoản
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="font-semibold text-slate-700">Trang {page}</span>
              <button
                disabled={page * 10 >= data.total}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal (U052, U053) */}
      {selectedUserId && (
        <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </div>
  )
}
