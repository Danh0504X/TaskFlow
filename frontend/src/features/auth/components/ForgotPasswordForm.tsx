import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { cn } from '@/lib/cn'
import { getApiErrorMessage } from '@/lib/http'
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '../auth.schema'
import { useForgotPassword } from '../hooks/useAuthMutations'
import { errorClass, inputClass, labelClass, primaryButtonClass } from '../auth.styles'

// Form quên mật khẩu: nhập email -> backend gửi link reset nếu email tồn tại
// (response luôn là message chung, không tiết lộ email có tồn tại hay không).
const ForgotPasswordForm = () => {
  const forgotPasswordMutation = useForgotPassword()
  const [serverError, setServerError] = useState('')
  const [sentMessage, setSentMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = (data: ForgotPasswordFormValues) => {
    setServerError('')
    forgotPasswordMutation.mutate(data, {
      onSuccess: (res) => setSentMessage(res.message),
      onError: (err) =>
        setServerError(getApiErrorMessage(err, 'Có lỗi xảy ra, vui lòng thử lại')),
    })
  }

  if (sentMessage) {
    return (
      <div className="space-y-5 text-center">
        <p className="text-[15px] text-muted">{sentMessage}</p>
        <Link
          to="/login"
          className="font-semibold text-brand transition-colors hover:text-brand-light hover:underline"
        >
          Quay lại đăng nhập
        </Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="relative w-full space-y-5"
      noValidate
    >
      <div>
        <label htmlFor="forgot-email" className={labelClass}>
          Email
        </label>
        <Input
          id="forgot-email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          className={cn('mt-1.5', inputClass)}
          {...register('email')}
        />
      </div>

      {serverError && <p className={errorClass}>{serverError}</p>}

      <Button
        type="submit"
        variant="primary"
        loading={forgotPasswordMutation.isPending}
        className={primaryButtonClass}
      >
        {forgotPasswordMutation.isPending ? 'Đang gửi...' : 'Gửi hướng dẫn'}
      </Button>

      <footer className="text-center">
        <p className="text-[14px] text-muted">
          <Link
            to="/login"
            className="font-semibold text-brand transition-colors hover:text-brand-light hover:underline"
          >
            Quay lại đăng nhập
          </Link>
        </p>
      </footer>
    </form>
  )
}

export default ForgotPasswordForm
