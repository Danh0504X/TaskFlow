import AuthLayout from '../components/AuthLayout'
import RegisterForm from '../components/RegisterForm'

const RegisterPage = () => {
  return (
    <AuthLayout>
      <header className="text-center md:text-left">
        <h2 className="font-editorial text-[28px] font-medium leading-tight tracking-tight text-ink">
          Start your journey
        </h2>
        <p className="mt-1.5 text-[15px] text-muted">
          Create your workspace in seconds.
        </p>
      </header>

      <RegisterForm />
    </AuthLayout>
  )
}

export default RegisterPage
