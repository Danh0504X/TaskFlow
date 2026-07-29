import { useState } from 'react'
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, MonitorSmartphone, ScrollText, Settings, ShieldAlert, Sparkles, Users } from 'lucide-react'
import { cn } from '@/lib/cn'
import { APP_LOGO_URL } from '@/lib/constants'
import Avatar from '@/components/ui/Avatar'
import { useAuth } from '@/features/auth/hooks/useAuth'
import AppBackground from './AppBackground'

const NAV_ITEMS = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Tài khoản', icon: Users, end: false },
  { to: '/admin/ai', label: 'Giám sát AI', icon: Sparkles, end: false },
  { to: '/admin/audit', label: 'Nhật ký', icon: ScrollText, end: false },
  { to: '/admin/settings', label: 'Cấu hình', icon: Settings, end: false },
]

/** Màn hình nhắc dùng màn hình rộng — khu Admin cần đủ chỗ cho bảng dữ liệu dày đặc,
 * không tối ưu cho mobile như app user. */
const NarrowScreenNotice = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 xl:hidden">
    <MonitorSmartphone size={32} className="text-subtle mb-3" />
    <h2 className="font-editorial text-xl text-ink">Cần màn hình rộng hơn</h2>
    <p className="text-sm text-muted mt-1.5 max-w-xs">
      Khu vực Admin hiển thị nhiều bảng dữ liệu dày đặc, cần màn hình từ 1280px trở lên. Vui lòng dùng máy tính hoặc mở rộng cửa sổ trình duyệt.
    </p>
  </div>
)

/** Layout riêng cho khu Admin — cùng cấu trúc sidebar với `MainLayout.tsx` của app user
 * (logo trên, danh sách nav, khối tài khoản + đăng xuất dưới cùng, sticky h-screen) để giữ
 * cảm giác quen thuộc, chỉ khác nội dung nav (5 mục quản trị thay vì dự án/việc) và có thêm
 * badge "Admin" cạnh logo để không bao giờ nhầm đang ở khu vực nào. Mỗi trang con tự có
 * `PageHeader` (title + subtitle) riêng làm phần mô tả đầu trang — dùng chung 1 component với
 * toàn bộ app, không tạo header riêng cho admin. Tự chặn nếu user không có role 'admin'.
 */
const AdminLayout = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(false)

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />

  const handleLogout = async () => {
    setLoading(true)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppBackground>
      <NarrowScreenNotice />

      <div className="hidden xl:flex min-h-screen">
        <aside className="w-72 bg-surface border-r border-hairline p-6 flex-col justify-between sticky top-0 h-screen shrink-0 flex">
          <div>
            <div className="flex items-center gap-3 mb-8 px-2">
              <img src={APP_LOGO_URL} alt="TaskFlow AI Logo" className="w-12 h-12 object-contain" />
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-editorial text-xl font-medium text-ink tracking-tight leading-none">TaskFlow</h1>
                  <span className="flex items-center gap-1 rounded-md bg-brand/15 text-brand ring-1 ring-inset ring-brand/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                    <ShieldAlert size={9} />
                    Admin
                  </span>
                </div>
                <p className="text-xs text-subtle mt-1">Khu vực quản trị hệ thống</p>
              </div>
            </div>

            <nav className="space-y-1">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium border',
                      isActive
                        ? 'bg-canvas border-hairline text-ink'
                        : 'text-muted border-transparent hover:bg-canvas hover:text-ink',
                    )
                  }
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="space-y-3 pt-4 border-t border-hairline">
            <div className="flex items-center gap-3 px-2 py-1">
              <Avatar src={user.avatarUrl} name={user.fullName} size={36} />
              <div className="text-left min-w-0">
                <p className="font-semibold text-ink text-sm leading-tight truncate">{user.fullName}</p>
                <p className="text-xs text-subtle font-medium truncate">{user.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-canvas rounded-lg text-muted hover:text-pastel-red-ink transition-colors text-sm font-semibold disabled:opacity-60"
            >
              <LogOut size={16} />
              <span>{loading ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </AppBackground>
  )
}

export default AdminLayout
