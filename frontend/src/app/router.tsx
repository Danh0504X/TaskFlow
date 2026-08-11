import type { ReactNode } from 'react'
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
  useLocation,
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
import LandingPage from '@/features/landing/pages/LandingPage'
import AdminLayout from '@/components/layout/AdminLayout'
import AdminOverviewPage from '@/features/admin/pages/AdminOverviewPage'
import AdminUsersPage from '@/features/admin/pages/AdminUsersPage'
import AdminAiPage from '@/features/admin/pages/AdminAiPage'
import AiOverviewTab from '@/features/admin/pages/ai/AiOverviewTab'
import AiQuotaTab from '@/features/admin/pages/ai/AiQuotaTab'
import AdminAuditPage from '@/features/admin/pages/AdminAuditPage'
import { AdminPaymentsPage } from '@/features/admin/pages/AdminPaymentsPage'

// Route "/" hiển thị khác nhau tuỳ trạng thái đăng nhập: khách (chưa đăng nhập) xem trang
// giới thiệu (LandingPage) ngay tại "/"; các đường dẫn con khác dưới "/" (vd /projects) vẫn
// đá về /login như route được bảo vệ bình thường. Người đã đăng nhập vào thẳng MainLayout
// (sidebar + Outlet) như cũ — không đổi hành vi cho user đã đăng nhập.
// Admin không dùng chung không gian làm việc (dashboard/dự án/việc) với user thường — toàn bộ
// nhánh "/" (và mọi route con) redirect thẳng sang khu Admin, kể cả khi họ gõ thẳng URL.
const RootGate = () => {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()

  if (!user) {
    if (location.pathname === '/') return <LandingPage />
    return <Navigate to="/login" replace />
  }

  if (user.role === 'admin') return <Navigate to="/admin" replace />

  return <MainLayout />
}

// Nếu đã đăng nhập thì không cho vào lại trang login.
const PublicOnlyRoute = ({ children }: { children: ReactNode }) => {
  const user = useAuthStore((state) => state.user)
  if (user) return <Navigate to="/" replace />
  return children
}

const router = createBrowserRouter([
  // Alias công khai tới trang giới thiệu — luôn hiện LandingPage bất kể trạng thái đăng nhập
  // (khác với "/" vốn đổi nội dung tuỳ theo đã đăng nhập hay chưa, xem RootGate).
  { path: '/welcome', element: <LandingPage /> },
  {
    path: '/',
    element: <RootGate />,
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
    ],
  },
  {
    // Khu vực Admin tách hẳn khỏi MainLayout — AdminLayout tự chặn nếu user không có role
    // 'admin' (xem AdminLayout.tsx), không dùng chung ProtectedRoute/AdminRoute của app user.
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminOverviewPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      {
        path: 'ai',
        element: <AdminAiPage />,
        children: [
          { index: true, element: <AiOverviewTab /> },
          { path: 'quota', element: <AiQuotaTab /> },
        ],
      },
      { path: 'payments', element: <AdminPaymentsPage /> },
      { path: 'audit', element: <AdminAuditPage /> },
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
    element: <ResetPasswordPage />,
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

const AppRouter = () => <RouterProvider router={router} />

export default AppRouter
