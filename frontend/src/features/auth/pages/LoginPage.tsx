import AuthLayout from '../components/AuthLayout'
import LoginForm from '../components/LoginForm'

const LoginPage = () => {
  return (
    <AuthLayout>
      <header className="text-center md:text-left">
        <h2 className="text-[26px] font-bold leading-tight tracking-tight text-[#0b1c30]">
          Chào mừng trở lại
        </h2>
        <p className="mt-1.5 text-[15px] text-[#494454]">
          Đăng nhập để tiếp tục.
        </p>
      </header>

      <LoginForm />
    </AuthLayout>
  )
}

export default LoginPage
