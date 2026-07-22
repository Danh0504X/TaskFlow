import { useMutation } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast/toastStore'
import { getApiErrorMessage } from '@/lib/http'
import { authApi } from '../auth.api'
import { useAuthStore } from '../authStore'

// Các mutation cho auth (đăng nhập/đăng ký/xác thực...). Dùng React Query để
// thống nhất với phần còn lại của app: tự có isPending, error, không phải tự
// quản useState loading/error ở mỗi form.

/** Đăng nhập email/mật khẩu. Thành công -> lưu userInfo vào store. */
export const useSignIn = () => {
  const setUser = useAuthStore((state) => state.setUser)
  return useMutation({
    mutationFn: authApi.signIn,
    onSuccess: (res) => setUser(res.data.userInfo),
  })
}

/** Đăng nhập Google (gửi access_token). Thành công -> lưu userInfo. */
export const useGoogleSignIn = () => {
  const setUser = useAuthStore((state) => state.setUser)
  return useMutation({
    mutationFn: (accessToken: string) => authApi.googleSignIn(accessToken),
    onSuccess: (res) => setUser(res.data.userInfo),
  })
}

/** Xác thực mã email -> backend set cookie & trả userInfo -> lưu user (đã đăng nhập). */
export const useVerifyEmail = () => {
  const setUser = useAuthStore((state) => state.setUser)
  return useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: (res) => setUser(res.data.userInfo),
  })
}

/** Đăng ký (không đăng nhập ngay -> backend gửi mã xác thực). */
export const useSignUp = () => useMutation({ mutationFn: authApi.signUp })

/** Kiểm tra email còn dùng được không (bước 1 đăng ký). */
export const useCheckEmail = () =>
  useMutation({ mutationFn: (email: string) => authApi.checkEmail(email) })

/** Gửi lại mã xác thực email. */
export const useResendCode = () =>
  useMutation({ mutationFn: (email: string) => authApi.resendVerifyCode(email) })

/** Gửi email quên mật khẩu (bước 1 của luồng reset). */
export const useForgotPassword = () =>
  useMutation({ mutationFn: authApi.forgotPassword })

/** Đặt lại mật khẩu bằng token từ link trong email (bước 2 của luồng reset). */
export const useResetPassword = () =>
  useMutation({ mutationFn: authApi.resetPassword })

/** Cập nhật hồ sơ cá nhân (trang Profile) -> đồng bộ lại userInfo trong store. */
export const useUpdateProfile = () => {
  const setUser = useAuthStore((state) => state.setUser)
  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (userInfo) => {
      setUser(userInfo)
      toast.success('Cập nhật thông tin thành công')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Cập nhật thất bại')),
  })
}

/** Đổi mật khẩu khi đã đăng nhập (trang Profile). */
export const useChangePassword = () =>
  useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => toast.success('Đổi mật khẩu thành công'),
    onError: (error) => toast.error(getApiErrorMessage(error, 'Đổi mật khẩu thất bại')),
  })
