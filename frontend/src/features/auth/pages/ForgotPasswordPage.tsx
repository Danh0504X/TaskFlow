import AuthLayout from '../components/AuthLayout'
import ForgotPasswordForm from '../components/ForgotPasswordForm'

const ForgotPasswordPage = () => {
  return (
    <AuthLayout>
      <header className="text-center md:text-left">
        <h2 className="font-editorial text-[28px] font-medium leading-tight tracking-tight text-ink">
          Quên mật khẩu?
        </h2>
        <p className="mt-1.5 text-[15px] text-muted">
          Nhập email để nhận hướng dẫn đặt lại mật khẩu.
        </p>
      </header>

      <ForgotPasswordForm />
    </AuthLayout>
  )
}

export default ForgotPasswordPage
