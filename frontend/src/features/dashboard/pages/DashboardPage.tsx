import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import Button from '@/components/ui/Button'
import ProjectsView from '@/features/projects/components/ProjectsView'

const DashboardPage = () => {
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
    <div className="min-h-screen bg-slate-100">
      {/* Thanh điều hướng trên cùng */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold text-slate-800">TaskFlow</span>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-slate-500">
                Xin chào, <span className="font-medium text-slate-700">{user.fullName}</span>
              </span>
            )}
            <Button
              variant="danger"
              size="sm"
              onClick={handleLogout}
              loading={loading}
            >
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      {/* Nội dung: bảng quản lý project */}
      <main>
        <ProjectsView />
      </main>
    </div>
  )
}

export default DashboardPage
