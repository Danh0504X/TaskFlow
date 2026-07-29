import { X, Shield, Mail, Calendar, UserCheck, AlertTriangle } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import { useAdminUserDetail, useUpdateUserStatus } from '../hooks/useAdminUsers'
import type { UserStatus } from '../admin.types'

interface UserDetailModalProps {
  userId: string | null
  onClose: () => void
}

export const UserDetailModal = ({ userId, onClose }: UserDetailModalProps) => {
  const { data: user, isLoading } = useAdminUserDetail(userId)
  const updateStatusMutation = useUpdateUserStatus()

  if (!userId) return null

  const handleStatusChange = async (newStatus: UserStatus) => {
    if (!user) return
    await updateStatusMutation.mutateAsync({
      userId: user._id,
      payload: { status: newStatus },
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-slate-900 mb-6">Chi tiết tài khoản (U052)</h3>

        {isLoading || !user ? (
          <div className="py-12 text-center text-slate-400">Đang tải thông tin chi tiết...</div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <Avatar src={user.avatarUrl} name={user.fullName} size={56} />
              <div>
                <h4 className="font-semibold text-lg text-slate-900">{user.fullName}</h4>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                  <Mail size={14} />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 border border-slate-100 rounded-xl space-y-1">
                <span className="text-slate-400 text-xs font-medium">Vai trò hệ thống</span>
                <div className="flex items-center gap-2 font-semibold text-slate-700">
                  <Shield size={16} className={user.role === 'admin' ? 'text-purple-600' : 'text-slate-400'} />
                  <span className="capitalize">{user.role}</span>
                </div>
              </div>

              <div className="p-3 border border-slate-100 rounded-xl space-y-1">
                <span className="text-slate-400 text-xs font-medium">Trạng thái xác thực</span>
                <div className="flex items-center gap-2 font-semibold text-slate-700">
                  <UserCheck size={16} className={user.isEmailVerified ? 'text-emerald-500' : 'text-amber-500'} />
                  <span>{user.isEmailVerified ? 'Đã xác thực email' : 'Chưa xác thực'}</span>
                </div>
              </div>

              <div className="p-3 border border-slate-100 rounded-xl space-y-1">
                <span className="text-slate-400 text-xs font-medium">Hình thức đăng nhập</span>
                <div className="font-semibold text-slate-700 capitalize">{user.authProvider}</div>
              </div>

              <div className="p-3 border border-slate-100 rounded-xl space-y-1">
                <span className="text-slate-400 text-xs font-medium">Ngày tham gia</span>
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Calendar size={14} />
                  <span>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="block text-sm font-semibold text-slate-900">
                Thao tác quản trị & Khóa/Mở khóa (U053)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange('active')}
                  disabled={user.status === 'active' || updateStatusMutation.isPending}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                    user.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-emerald-600 hover:text-white'
                  }`}
                >
                  Mở khóa (Active)
                </button>
                <button
                  onClick={() => handleStatusChange('banned')}
                  disabled={user.status === 'banned' || updateStatusMutation.isPending}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                    user.status === 'banned'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-red-600 hover:text-white'
                  }`}
                >
                  Khóa tài khoản (Banned)
                </button>
              </div>

              {user.status === 'banned' && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-xs text-red-600 font-medium">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>Tài khoản này đang bị khóa và không thể đăng nhập vào hệ thống.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
