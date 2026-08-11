import { useState } from 'react'
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { CreditCard, LayoutDashboard, LogOut, Menu, ScrollText, ShieldAlert, Sparkles, Users, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/cn'
import { APP_LOGO_URL } from '@/lib/constants'
import Avatar from '@/components/ui/Avatar'
import { useAuth } from '@/features/auth/hooks/useAuth'
import AppBackground from './AppBackground'

const NAV_ITEMS = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Tài khoản', icon: Users, end: false },
  { to: '/admin/payments', label: 'Thanh toán & Webhook', icon: CreditCard, end: false },
  { to: '/admin/ai', label: 'Giám sát AI', icon: Sparkles, end: false },
  { to: '/admin/audit', label: 'Nhật ký', icon: ScrollText, end: false },
]

/** Layout riêng cho khu Admin: hỗ trợ responsive trên mọi kích thước màn hình với topbar + drawer drawer mobile. */
const AdminLayout = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

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

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO_URL} alt="TaskFlow AI Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
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
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
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
    </div>
  )

  return (
    <AppBackground>
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Mobile Top Navigation Bar */}
        <header className="md:hidden sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-hairline px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg text-muted hover:text-ink hover:bg-canvas transition-colors"
              aria-label="Open Menu"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2">
              <img src={APP_LOGO_URL} alt="TaskFlow Logo" className="w-8 h-8 object-contain" />
              <span className="font-editorial text-lg font-medium text-ink">TaskFlow</span>
              <span className="flex items-center gap-1 rounded-md bg-brand/15 text-brand ring-1 ring-inset ring-brand/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                <ShieldAlert size={9} />
                Admin
              </span>
            </div>
          </div>

          <Avatar src={user.avatarUrl} name={user.fullName} size={32} />
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

        <div className="flex-1 min-w-0 overflow-x-auto">
          <Outlet />
        </div>
      </div>
    </AppBackground>
  )
}

export default AdminLayout
