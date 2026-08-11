import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutGrid, FolderGit2, CheckSquare, LogOut, User, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/cn'
import { APP_LOGO_URL } from '@/lib/constants'
import Avatar from '@/components/ui/Avatar'
import { useAuth } from '@/features/auth/hooks/useAuth'
import AppBackground from './AppBackground'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { AiLimitModalContainer } from '@/features/payment/components/AiLimitModalContainer'

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
  const [mobileOpen, setMobileOpen] = useState(false)

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

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
            <img
              src={APP_LOGO_URL}
              alt="TaskFlow AI Logo"
              className="w-10 h-10 md:w-12 md:h-12 object-contain"
            />
            <div>
              <h1 className="font-editorial text-xl font-medium text-ink tracking-tight leading-none">TaskFlow</h1>
              <p className="text-xs text-subtle mt-1">AI-Powered Focus</p>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg text-muted hover:text-ink hover:bg-canvas transition-colors border border-transparent hover:border-hairline"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="space-y-1.5">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'w-full flex items-center gap-3 px-4 py-3 md:py-2.5 rounded-lg transition-all text-sm font-medium border',
                  isActive
                    ? 'bg-canvas border-hairline text-ink shadow-sm'
                    : 'text-muted border-transparent hover:bg-canvas/60 hover:text-ink',
                )
              }
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="space-y-3 pt-4 border-t border-hairline">
        <div className="flex items-center justify-between px-2 py-1 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar src={user?.avatarUrl} name={user?.fullName ?? '?'} size={36} />
            <div className="text-left min-w-0">
              <p className="font-semibold text-ink text-sm leading-tight truncate">{user?.fullName}</p>
              <p className="text-xs text-subtle font-medium truncate">{user?.email}</p>
            </div>
          </div>
          {!isMobile && <NotificationBell />}
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
    </div>
  )

  return (
    <AppBackground>
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Mobile Top Navigation Bar */}
        <header className="md:hidden sticky top-0 z-30 bg-surface/95 backdrop-blur-lg border-b border-hairline px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg text-muted hover:text-ink hover:bg-canvas border border-hairline/60 transition-colors"
              aria-label="Open Menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2.5">
              <img src={APP_LOGO_URL} alt="TaskFlow Logo" className="w-8 h-8 object-contain" />
              <span className="font-editorial text-lg font-medium text-ink tracking-tight">TaskFlow</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={() => setMobileOpen(true)} className="focus:outline-none">
              <Avatar src={user?.avatarUrl} name={user?.fullName ?? '?'} size={32} />
            </button>
          </div>
        </header>

        {/* Desktop Sidebar */}
        <aside className="w-72 bg-surface border-r border-hairline p-6 flex-col justify-between hidden md:flex sticky top-0 h-screen shrink-0 z-20">
          {renderSidebarContent(false)}
        </aside>

        {/* Mobile Slide-over Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-surface border-r border-hairline p-6 z-50 md:hidden shadow-2xl overflow-y-auto"
              >
                {renderSidebarContent(true)}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
      <AiLimitModalContainer />
    </AppBackground>
  )
}

export default MainLayout
