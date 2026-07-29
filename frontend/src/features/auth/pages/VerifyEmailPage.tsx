import { Navigate, useLocation } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import VerifyEmailForm from '../components/VerifyEmailForm'

const VerifyEmailPage = () => {
  const location = useLocation()

  // Email và inviteToken được truyền sang từ trang đăng ký.
  const state = location.state as { email?: string; inviteToken?: string } | null
  const email = state?.email
  const inviteToken = state?.inviteToken

  // Vào thẳng trang này mà không có email (không qua bước đăng ký) -> về login.
  if (!email) return <Navigate to="/login" replace />

  return (
    <AuthLayout>
      <header className="text-center md:text-left">
        <h2 className="font-editorial text-[28px] font-medium leading-tight tracking-tight text-ink">
          Xác thực email
        </h2>
        <p className="mt-1.5 text-[15px] text-muted">
          Nhập mã 6 số đã gửi tới{' '}
          <span className="font-semibold text-ink">{email}</span>
        </p>
      </header>

      <VerifyEmailForm email={email} inviteToken={inviteToken} />
    </AuthLayout>
  )
}

export default VerifyEmailPage
