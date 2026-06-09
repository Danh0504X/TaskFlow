import { Navigate, useLocation } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import VerifyEmailForm from '../components/VerifyEmailForm'

const VerifyEmailPage = () => {
  const location = useLocation()

  // Email được truyền sang từ trang đăng ký.
  const email = (location.state as { email?: string } | null)?.email

  // Vào thẳng trang này mà không có email (không qua bước đăng ký) -> về login.
  if (!email) return <Navigate to="/login" replace />

  return (
    <AuthLayout>
      <header className="text-center md:text-left">
        <h2 className="text-[26px] font-bold leading-tight tracking-tight text-[#0b1c30]">
          Xác thực email
        </h2>
        <p className="mt-1.5 text-[15px] text-[#494454]">
          Nhập mã 6 số đã gửi tới{' '}
          <span className="font-semibold text-[#0b1c30]">{email}</span>
        </p>
      </header>

      <VerifyEmailForm email={email} />
    </AuthLayout>
  )
}

export default VerifyEmailPage
