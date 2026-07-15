import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutGrid, FolderGit2, CheckSquare, LogOut } from 'lucide-react'
import { cn } from '@/lib/cn'
import { APP_LOGO_URL } from '@/lib/constants'
import Avatar from '@/components/ui/Avatar'
import { useAuth } from '@/features/auth/hooks/useAuth'
import AppBackground from './AppBackground'

const navItems = [
  { to: '/', label: 'Tổng quan', icon: LayoutGrid, end: true },
  { to: '/projects', label: 'Dự án của tôi', icon: FolderGit2, end: false },
  { to: '/tasks', label: 'Việc của tôi', icon: CheckSquare, end: false },
]

/** Layout gốc cho các trang cần đăng nhập: sidebar dùng chung + nội dung trang render vào <Outlet />. */
const MainLayout = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(false)

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
        <aside className="w-72 bg-white/30 backdrop-blur-xl border-r border-white/25 p-6 flex-col justify-between hidden md:flex sticky top-0 h-screen shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div>
            <div className="flex items-center gap-3 mb-8 px-2">
              <img
                src={APP_LOGO_URL}
                alt="TaskFlow AI Logo"
                className="w-12 h-12 object-contain drop-shadow-[0_2px_8px_rgba(139,92,246,0.12)]"
              />
              <div>
                <h1 className="font-semibold text-xl text-brand tracking-tight leading-none">TaskFlow</h1>
                <p className="text-xs text-muted mt-1">AI-Powered Focus</p>
              </div>
            </div>

            <nav className="space-y-1.5">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium border',
                      isActive
                        ? 'bg-white/30 backdrop-blur-md border-white/60 text-brand shadow-sm'
                        : 'text-slate-400 border-transparent hover:bg-white/30 hover:text-brand hover:shadow-sm',
                    )
                  }
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/20">
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
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/35 rounded-xl text-muted hover:text-red-600 transition-all text-sm font-semibold disabled:opacity-60 hover:shadow-sm"
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
