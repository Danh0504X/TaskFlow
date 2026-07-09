import { Navigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import ResetPasswordForm from '../components/ResetPasswordForm'

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  // Vào trang này mà thiếu token/email (không qua link trong email) -> yêu cầu gửi lại.
  if (!token || !email) return <Navigate to="/forgot-password" replace />

  return (
    <AuthLayout>
      <header className="text-center md:text-left">
        <h2 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
          Đặt lại mật khẩu
        </h2>
        <p className="mt-1.5 text-[15px] text-muted">
          Nhập mật khẩu mới cho tài khoản{' '}
          <span className="font-semibold text-ink">{email}</span>
        </p>
      </header>

      <ResetPasswordForm email={email} token={token} />
    </AuthLayout>
  )
}

export default ResetPasswordPage
