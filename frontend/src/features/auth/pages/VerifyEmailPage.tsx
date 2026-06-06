import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Lấy message lỗi từ response axios (nếu có), fallback message mặc định.
const getErrorMessage = (error: unknown, fallback: string): string => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response
      ?.data?.message === 'string'
  ) {
    return (error as { response: { data: { message: string } } }).response.data
      .message
  }
  return fallback
}

const VerifyEmailPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyEmail, resendCode } = useAuth()

  // Email được truyền sang từ LoginPage sau khi đăng ký.
  const email = (location.state as { email?: string } | null)?.email

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  // Vào thẳng trang này mà không có email (không qua bước đăng ký) -> về login.
  if (!email) return <Navigate to="/login" replace />

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      await verifyEmail({ email, code })
      navigate('/', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'Mã không đúng hoặc đã hết hạn'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setInfo('')
    setResending(true)
    try {
      await resendCode(email)
      setInfo('Đã gửi lại mã xác thực tới email của bạn.')
    } catch (err) {
      setError(getErrorMessage(err, 'Không gửi lại được mã, vui lòng thử lại sau'))
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-center text-2xl font-bold text-slate-800">
          Xác thực email
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Nhập mã 6 số đã gửi tới <br />
          <span className="font-medium text-slate-700">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            required
            maxLength={6}
            placeholder="Nhập mã xác thực"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-lg tracking-[0.5em] text-slate-900 placeholder:text-base placeholder:tracking-normal placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-600">{info}</p>}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Đang xác thực...' : 'Xác thực'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Không nhận được mã?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-semibold text-indigo-600 hover:underline disabled:opacity-60"
          >
            {resending ? 'Đang gửi...' : 'Gửi lại'}
          </button>
        </p>

        <p className="mt-2 text-center text-sm text-slate-500">
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="font-medium text-slate-500 hover:underline"
          >
            Quay lại đăng nhập
          </button>
        </p>
      </div>
    </div>
  )
}

export default VerifyEmailPage
