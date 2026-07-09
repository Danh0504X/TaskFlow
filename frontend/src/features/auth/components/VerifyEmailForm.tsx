import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '@/components/ui/Button'
import { getApiErrorMessage } from '@/lib/http'
import { useVerifyEmail, useResendCode } from '../hooks/useAuthMutations'
import { errorClass, primaryButtonClass } from '../auth.styles'

// Ô nhập mã: cùng phong cách input chung nhưng căn giữa + giãn ký tự cho dễ đọc.
const codeInputClass =
  'h-12 w-full rounded-xl border border-line/80 bg-white/50 px-4 text-center text-lg tracking-[0.5em] text-ink backdrop-blur-md transition placeholder:text-base placeholder:tracking-normal placeholder:text-subtle outline-none focus:border-transparent focus:ring-2 focus:ring-brand/70'

// Form xác thực email: nhập mã 6 số, gửi lại mã, quay lại đăng nhập.
const VerifyEmailForm = ({ email }: { email: string }) => {
  const navigate = useNavigate()
  const verifyMutation = useVerifyEmail()
  const resendMutation = useResendCode()

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setInfo('')
    verifyMutation.mutate(
      { email, code },
      {
        onSuccess: () => navigate('/', { replace: true }),
        onError: (err) =>
          setError(getApiErrorMessage(err, 'Mã không đúng hoặc đã hết hạn')),
      },
    )
  }

  const handleResend = () => {
    setError('')
    setInfo('')
    resendMutation.mutate(email, {
      onSuccess: () => setInfo('Đã gửi lại mã xác thực tới email của bạn.'),
      onError: (err) =>
        setError(
          getApiErrorMessage(err, 'Không gửi lại được mã, vui lòng thử lại sau'),
        ),
    })
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
        aria-label="Mã xác thực"
      />

      {error && <p className={errorClass}>{error}</p>}
      {info && <p className="ml-1 mt-1.5 text-xs text-green-600">{info}</p>}

      <Button
        type="submit"
        variant="primary"
        loading={verifyMutation.isPending}
        disabled={verifyMutation.isPending || code.length !== 6}
        className={primaryButtonClass}
      >
        {verifyMutation.isPending ? 'Đang xác thực...' : 'Xác thực'}
      </Button>

      <footer className="space-y-2 text-center">
        <p className="text-[14px] text-muted">
          Không nhận được mã?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendMutation.isPending}
            className="font-semibold text-brand transition-colors hover:text-brand-light hover:underline disabled:opacity-60"
          >
            {resendMutation.isPending ? 'Đang gửi...' : 'Gửi lại'}
          </button>
        </p>
        <p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="text-[14px] font-medium text-subtle transition-colors hover:text-muted hover:underline"
          >
            Quay lại đăng nhập
          </button>
        </p>
      </footer>
    </form>
  )
}

export default VerifyEmailForm
