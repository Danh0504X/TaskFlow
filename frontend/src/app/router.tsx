import type { ReactNode } from 'react'
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import DashboardPage from '@/features/dashboard/pages/DashboardPage'
import LoginPage from '@/features/auth/pages/LoginPage'
import RegisterPage from '@/features/auth/pages/RegisterPage'
import VerifyEmailPage from '@/features/auth/pages/VerifyEmailPage'
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage'
import ProjectsPage from '@/features/projects/pages/ProjectsPage'
import ProjectWorkspacePage from '@/features/projects/pages/ProjectWorkspacePage'
import ProjectSetupWizard from '@/features/projects/pages/ProjectSetupWizard'
import InvitationPage from '@/features/projects/pages/InvitationPage'
import ArchivedProjectsPage from '@/features/projects/pages/ArchivedProjectsPage'
import MyTasksPage from '@/features/tasks/pages/MyTasksPage'
import { useAuthStore } from '@/features/auth/authStore'
import { ProfilePage } from '@/features/profile/pages/ProfilePage'
import { ChangePasswordPage } from '@/features/profile/pages/ChangePasswordPage'
import AdminUsersPage from '@/features/admin/pages/AdminUsersPage'

// Chặn truy cập trang cần đăng nhập.
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const user = useAuthStore((state) => state.user)
  if (!user) return <Navigate to="/login" replace />
  return children
}

// Chặn truy cập trang dành riêng cho Admin.
const AdminRoute = ({ children }: { children: ReactNode }) => {
  const user = useAuthStore((state) => state.user)
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
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
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/new', element: <ProjectSetupWizard /> },
      { path: 'projects/:projectId', element: <ProjectWorkspacePage /> },
      { path: 'projects/:projectId/invitation', element: <InvitationPage /> },
      { path: 'projects/archived', element: <ArchivedProjectsPage /> },
      { path: 'tasks', element: <MyTasksPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'profile/change-password', element: <ChangePasswordPage /> },
      {
        path: 'admin/users',
        element: (
          <AdminRoute>
            <AdminUsersPage />
          </AdminRoute>
        ),
      },
    ],
  },
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/verify-email',
    element: (
      <PublicOnlyRoute>
        <VerifyEmailPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <PublicOnlyRoute>
        <ForgotPasswordPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <PublicOnlyRoute>
        <ResetPasswordPage />
      </PublicOnlyRoute>
    ),
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

const AppRouter = () => <RouterProvider router={router} />

export default AppRouter
