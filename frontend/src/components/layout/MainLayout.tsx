import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutGrid, FolderGit2, CheckSquare, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/cn'
import { APP_LOGO_URL } from '@/lib/constants'
import Avatar from '@/components/ui/Avatar'
import { useAuth } from '@/features/auth/hooks/useAuth'
import AppBackground from './AppBackground'

const baseNavItems = [
  { to: '/', label: 'Tổng quan', icon: LayoutGrid, end: true },
  { to: '/projects', label: 'Dự án của tôi', icon: FolderGit2, end: false },
  { to: '/tasks', label: 'Việc của tôi', icon: CheckSquare, end: false },
  { to: '/profile', label: 'Hồ sơ', icon: User, end: false },
]

/** Layout gốc cho các trang cần đăng nhập: sidebar dùng chung + nội dung trang render vào <Outlet />. */
const MainLayout = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(false)

  // Admin không bao giờ render layout này (RootGate redirect thẳng sang /admin), nên nav ở đây
  // chỉ còn dành cho user thường.
  const navItems = baseNavItems

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
      <div className="min-h-screen flex">
        <aside className="w-72 bg-surface border-r border-hairline p-6 flex-col justify-between hidden md:flex sticky top-0 h-screen shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-8 px-2">
              <img
                src={APP_LOGO_URL}
                alt="TaskFlow AI Logo"
                className="w-12 h-12 object-contain"
              />
              <div>
                <h1 className="font-editorial text-xl font-medium text-ink tracking-tight leading-none">TaskFlow</h1>
                <p className="text-xs text-subtle mt-1">AI-Powered Focus</p>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map(({ to, label, icon: Icon, end }) => (
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
              <Avatar src={user?.avatarUrl} name={user?.fullName ?? '?'} size={36} />
              <div className="text-left min-w-0">
                <p className="font-semibold text-ink text-sm leading-tight truncate">{user?.fullName}</p>
                <p className="text-xs text-subtle font-medium truncate">{user?.email}</p>
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

export default MainLayout
