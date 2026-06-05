import type { ReactNode } from 'react'
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import DashboardPage from '@/features/dashboard/pages/DashboardPage'
import LoginPage from '@/features/auth/pages/LoginPage'
import { useAuthStore } from '@/features/auth/authStore'

// Chặn truy cập trang cần đăng nhập.
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const user = useAuthStore((state) => state.user)
  if (!user) return <Navigate to="/login" replace />
  return children
}

// Nếu đã đăng nhập thì không cho vào lại trang login.
const PublicOnlyRoute = ({ children }: { children: ReactNode }) => {
  const user = useAuthStore((state) => state.user)
  if (user) return <Navigate to="/" replace />
  return children
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [{ index: true, element: <DashboardPage /> }],
  },
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

const AppRouter = () => <RouterProvider router={router} />

export default AppRouter
