import AuthLayout from '../components/AuthLayout'
import LoginForm from '../components/LoginForm'

const LoginPage = () => {
  return (
    <AuthLayout>
      <header className="text-center md:text-left">
        <h2 className="font-editorial text-[28px] font-medium leading-tight tracking-tight text-ink">
          Chào mừng trở lại
        </h2>
        <p className="mt-1.5 text-[15px] text-muted">
          Đăng nhập để tiếp tục.
        </p>
      </header>

      <LoginForm />
    </AuthLayout>
  )
}

export default LoginPage
