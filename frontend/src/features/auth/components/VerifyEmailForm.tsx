import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '@/components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { errorClass, primaryButtonClass } from '../auth.styles'

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

// Ô nhập mã: cùng phong cách input chung nhưng căn giữa + giãn ký tự cho dễ đọc.
const codeInputClass =
  'h-12 w-full rounded-xl border border-[#cbc3d7]/80 bg-white/50 px-4 text-center text-lg tracking-[0.5em] text-[#0b1c30] backdrop-blur-md transition placeholder:text-base placeholder:tracking-normal placeholder:text-[#a89db8] outline-none focus:border-transparent focus:ring-2 focus:ring-[#6b38d4]/70'

// Form xác thực email: nhập mã 6 số, gửi lại mã, quay lại đăng nhập.
const VerifyEmailForm = ({ email }: { email: string }) => {
  const navigate = useNavigate()
  const { verifyEmail, resendCode } = useAuth()

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

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
    <form onSubmit={handleSubmit} className="relative w-full space-y-5">
      <input
        type="text"
        inputMode="numeric"
        autoFocus
        required
        maxLength={6}
        placeholder="Nhập mã xác thực"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        className={codeInputClass}
      />

      {error && <p className={errorClass}>{error}</p>}
      {info && <p className="ml-1 mt-1.5 text-xs text-green-600">{info}</p>}

      <Button
        type="submit"
        variant="primary"
        loading={loading}
        disabled={loading || code.length !== 6}
        className={primaryButtonClass}
      >
        {loading ? 'Đang xác thực...' : 'Xác thực'}
      </Button>

      <footer className="space-y-2 text-center">
        <p className="text-[14px] text-[#494454]">
          Không nhận được mã?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-semibold text-[#6b38d4] transition-colors hover:text-[#8455ef] hover:underline disabled:opacity-60"
          >
            {resending ? 'Đang gửi...' : 'Gửi lại'}
          </button>
        </p>
        <p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="text-[14px] font-medium text-[#a89db8] transition-colors hover:text-[#494454] hover:underline"
          >
            Quay lại đăng nhập
          </button>
        </p>
      </footer>
    </form>
  )
}

export default VerifyEmailForm
