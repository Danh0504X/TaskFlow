import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { cn } from '@/lib/cn'
import { getApiErrorMessage } from '@/lib/http'
import { useAuth } from '../hooks/useAuth'
import {
  errorClass,
  ghostButtonClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from '../auth.styles'

// Form đăng nhập: email + mật khẩu, kèm đăng nhập Google.
const LoginForm = () => {
  const navigate = useNavigate()
  const { signIn, googleSignIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn({ email, password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Có lỗi xảy ra, vui lòng thử lại'))
    } finally {
      setLoading(false)
    }
  }

  // Google OAuth implicit flow -> trả access_token gửi lên backend.
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError('')
      setLoading(true)
      try {
        await googleSignIn(tokenResponse.access_token)
        navigate('/', { replace: true })
      } catch (err) {
        setError(getApiErrorMessage(err, 'Đăng nhập Google thất bại'))
      } finally {
        setLoading(false)
      }
    },
    onError: () => setError('Đăng nhập Google thất bại'),
  })

  return (
    <form onSubmit={handleSubmit} className="relative w-full space-y-5">
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Email</label>
          <Input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn('mt-1.5', inputClass)}
          />
        </div>

        <div>
          <label className={labelClass}>Mật khẩu</label>
          <Input
            type="password"
            required
            minLength={6}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn('mt-1.5', inputClass)}
          />
        </div>
      </div>

      {error && <p className={errorClass}>{error}</p>}

      <Button
        type="submit"
        variant="primary"
        loading={loading}
        className={primaryButtonClass}
      >
        {loading ? 'Đang xử lý...' : 'Đăng nhập'}
      </Button>

      <div className="relative flex items-center">
        <div className="flex-grow border-t border-[#cbc3d7]/60" />
        <span className="mx-3 flex-shrink text-[12px] font-medium text-[#a89db8]">
          hoặc
        </span>
        <div className="flex-grow border-t border-[#cbc3d7]/60" />
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
        <p className="text-[14px] text-[#494454]">
          Chưa có tài khoản?{' '}
          <Link
            to="/register"
            className="font-semibold text-[#6b38d4] transition-colors hover:text-[#8455ef] hover:underline"
          >
            Đăng ký
          </Link>
        </p>
      </footer>
    </form>
  )
}

export default LoginForm
