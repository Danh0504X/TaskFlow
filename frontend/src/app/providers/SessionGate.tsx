import { useEffect, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/features/auth/auth.api'
import { useAuthStore } from '@/features/auth/authStore'
import Spinner from '@/components/ui/Spinner'

/**
 * Khôi phục phiên khi mở/tải lại app:
 * - Gọi GET /auth/me để hỏi backend "cookie còn hợp lệ không, tôi là ai?".
 * - Thành công  -> đồng bộ userInfo mới nhất vào store.
 * - Thất bại    -> xoá user (phiên đã hết) -> ProtectedRoute sẽ đá về /login.
*/

const SessionGate = ({ children }: { children: ReactNode }) => {
  const setUser = useAuthStore((state) => state.setUser)
  const clearUser = useAuthStore((state) => state.clearUser)

  const { data, isError, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (data) setUser(data)
  }, [data, setUser])

  useEffect(() => {
    if (isError) clearUser()
  }, [isError, clearUser])

  // Lần kiểm tra phiên đầu tiên chưa xong -> hiện màn hình chờ.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-400">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  return children
}

export default SessionGate
