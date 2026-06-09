import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../hooks/useAuth'
import { getApiErrorMessage } from '@/lib/http'

const LoginPage = () => {
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
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-center text-2xl font-bold text-slate-800">
          TaskFlow
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Đăng nhập để tiếp tục
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />

          <input
            type="password"
            required
            minLength={6}
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">hoặc</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={() => loginWithGoogle()}
          disabled={loading}
          className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          Đăng nhập với Google
        </button>

        <p className="mt-6 text-center text-sm text-slate-500">
          Chưa có tài khoản?{' '}
          <Link
            to="/register"
            className="font-semibold text-indigo-600 hover:underline"
          >
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
