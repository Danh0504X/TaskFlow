import { useEffect, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/features/auth/auth.api'
import { useAuthStore } from '@/features/auth/authStore'
import Spinner from '@/components/ui/Spinner'

/**
 * Khôi phục phiên khi mở/tải lại app:
 * - Gọi GET /auth/me để hỏi backend "cookie còn hợp lệ không, tôi là ai?".
 * - Thành công  -> đồng bộ userInfo mới nhất vào store.
 * - Thất bại    -> xoá user (phiên đã hết) -> ProtectedRoute sẽ đá về /login.
 *
 * `synced` cố tình là cờ 1 chiều (bật 1 lần rồi đứng yên mãi mãi), KHÔNG so khớp lại với
 * cache của query mỗi lần render. Nếu so khớp lại kiểu storeUser._id === data._id thì sau khi
 * đăng xuất, storeUser sẽ là null trong khi `data` trong cache vẫn còn giữ user cũ (query
 * không tự refetch khi logout) -> điều kiện không bao giờ true nữa -> app kẹt mãi ở màn hình
 * chờ. Cờ `synced` tránh đúng lỗi đó vì không phụ thuộc dữ liệu cache.
*/

const SessionGate = ({ children }: { children: ReactNode }) => {
  const setUser = useAuthStore((state) => state.setUser)
  const clearUser = useAuthStore((state) => state.clearUser)
  const [synced, setSynced] = useState(false)

  const { data, isError, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (!data) return
    setUser(data)
    setSynced(true) // eslint-disable-line react-hooks/set-state-in-effect -- xem giải thích ở trên
  }, [data, setUser])

  useEffect(() => {
    if (!isError) return
    clearUser()
    setSynced(true) // eslint-disable-line react-hooks/set-state-in-effect -- xem giải thích ở trên
  }, [isError, clearUser])

  // Lần kiểm tra phiên đầu tiên chưa xong -> hiện màn hình chờ.
  if (isLoading || !synced) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-subtle">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  return children
}

export default SessionGate
