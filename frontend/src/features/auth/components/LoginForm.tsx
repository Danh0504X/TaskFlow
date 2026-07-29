import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useGoogleLogin } from '@react-oauth/google'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { cn } from '@/lib/cn'
import { getApiErrorMessage } from '@/lib/http'
import { loginSchema, type LoginFormValues } from '../auth.schema'
import { useSignIn, useGoogleSignIn } from '../hooks/useAuthMutations'
import {
  errorClass,
  ghostButtonClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from '../auth.styles'

// Form đăng nhập: email + mật khẩu (validate bằng zod), kèm đăng nhập Google.
const LoginForm = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const signInMutation = useSignIn()
  const googleMutation = useGoogleSignIn()

  const [serverError, setServerError] = useState('')
  // Thông báo truyền từ trang đặt lại mật khẩu (vd "Đặt lại mật khẩu thành công").
  const infoMessage = (location.state as { info?: string } | null)?.info
  // JWT hết hạn (refresh token cũng hết) -> interceptor tự đá về đây kèm query param
  // này (xem forceLogout ở lib/api.ts) -> báo rõ lý do thay vì im lặng mất phiên.
  const sessionExpired = searchParams.get('reason') === 'session_expired'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const loading = signInMutation.isPending || googleMutation.isPending

  const onSubmit = (data: LoginFormValues) => {
    setServerError('')
    signInMutation.mutate(data, {
      onSuccess: () => navigate('/', { replace: true }),
      onError: (err) =>
        setServerError(getApiErrorMessage(err, 'Có lỗi xảy ra, vui lòng thử lại')),
    })
  }

  // Google OAuth implicit flow -> trả access_token gửi lên backend.
  const loginWithGoogle = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setServerError('')
      googleMutation.mutate(tokenResponse.access_token, {
        onSuccess: () => navigate('/', { replace: true }),
        onError: (err) =>
          setServerError(getApiErrorMessage(err, 'Đăng nhập Google thất bại')),
      })
    },
    onError: () => setServerError('Đăng nhập Google thất bại'),
  })

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="relative w-full space-y-5"
      noValidate
    >
      {infoMessage ? (
        <p className="ml-1 text-[13px] text-pastel-green-ink">{infoMessage}</p>
      ) : (
        sessionExpired && (
          <p className="ml-1 text-[13px] font-medium text-pastel-yellow-ink">
            Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.
          </p>
        )
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="login-email" className={labelClass}>
            Email
          </label>
          <Input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            className={cn('mt-1.5', inputClass)}
            {...register('email')}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className={labelClass}>
              Mật khẩu
            </label>
            <Link
              to="/forgot-password"
              className="text-[13px] font-medium text-brand transition-colors hover:text-brand-light hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <Input
            id="login-password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            className={cn('mt-1.5', inputClass)}
            {...register('password')}
          />
        </div>
      </div>

      {serverError && <p className={errorClass}>{serverError}</p>}

      <Button
        type="submit"
        variant="primary"
        loading={loading}
        className={primaryButtonClass}
      >
        {loading ? 'Đang xử lý...' : 'Đăng nhập'}
      </Button>

      <div className="relative flex items-center">
        <div className="flex-grow border-t border-hairline" />
        <span className="mx-3 flex-shrink text-[12px] font-medium text-subtle">
          hoặc
        </span>
        <div className="flex-grow border-t border-hairline" />
      </div>

      <Button
        variant="ghost"
        type="button"
        onClick={() => loginWithGoogle()}
        disabled={loading}
        className={ghostButtonClass}
      >
        <img
          src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png"
          alt="Google"
          className="h-5 w-5"
        />
        <span>Đăng nhập với Google</span>
      </Button>

      <footer className="text-center">
        <p className="text-[14px] text-muted">
          Chưa có tài khoản?{' '}
          <Link
            to="/register"
            className="font-semibold text-brand transition-colors hover:text-brand-light hover:underline"
          >
            Đăng ký
          </Link>
        </p>
      </footer>
    </form>
  )
}

export default LoginForm
