import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '@/components/ui/Button'
import { getApiErrorMessage } from '@/lib/http'
import { useVerifyEmail, useResendCode } from '../hooks/useAuthMutations'
import { errorClass, primaryButtonClass } from '../auth.styles'

// Ô nhập mã: cùng phong cách input chung nhưng căn giữa + giãn ký tự cho dễ đọc.
const codeInputClass =
  'h-12 w-full rounded-lg border border-hairline bg-surface px-4 text-center text-lg tracking-[0.5em] text-ink transition-colors placeholder:text-base placeholder:tracking-normal placeholder:text-subtle outline-none focus:border-ink/25 focus:ring-2 focus:ring-brand/20'

const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    return null
  }
}

// Form xác thực email: nhập mã 6 số, gửi lại mã, quay lại đăng nhập.
const VerifyEmailForm = ({ email, inviteToken }: { email: string; inviteToken?: string }) => {
  const navigate = useNavigate()
  const verifyMutation = useVerifyEmail()
  const resendMutation = useResendCode()

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const decoded = inviteToken ? decodeJWT(inviteToken) : null
  const projectId = decoded?.projectId

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setInfo('')
    verifyMutation.mutate(
      { email, code, inviteToken },
      {
        onSuccess: () => {
          if (projectId) {
            navigate(`/projects/${projectId}`, { replace: true })
          } else {
            navigate('/', { replace: true })
          }
        },
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
      {info && <p className="ml-1 mt-1.5 text-xs text-pastel-green-ink">{info}</p>}

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
