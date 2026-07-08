import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { cn } from '@/lib/cn'
import { getApiErrorMessage } from '@/lib/http'
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '../auth.schema'
import { useResetPassword } from '../hooks/useAuthMutations'
import { errorClass, inputClass, labelClass, primaryButtonClass } from '../auth.styles'

interface ResetPasswordFormProps {
  email: string
  token: string
}

// Form đặt lại mật khẩu: email + token lấy từ query string của link trong email.
const ResetPasswordForm = ({ email, token }: ResetPasswordFormProps) => {
  const navigate = useNavigate()
  const resetPasswordMutation = useResetPassword()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = (data: ResetPasswordFormValues) => {
    setServerError('')
    resetPasswordMutation.mutate(
      { email, token, ...data },
      {
        onSuccess: () =>
          navigate('/login', {
            replace: true,
            state: { info: 'Đặt lại mật khẩu thành công, vui lòng đăng nhập.' },
          }),
        onError: (err) =>
          setServerError(
            getApiErrorMessage(err, 'Không đặt lại được mật khẩu, vui lòng thử lại'),
          ),
      },
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="relative w-full space-y-5"
      noValidate
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="reset-password" className={labelClass}>
            Mật khẩu mới
          </label>
          <Input
            id="reset-password"
            type="password"
            placeholder="••••••••"
            error={errors.newPassword?.message}
            className={cn('mt-1.5', inputClass)}
            {...register('newPassword')}
          />
        </div>

        <div>
          <label htmlFor="reset-confirm" className={labelClass}>
            Xác nhận mật khẩu mới
          </label>
          <Input
            id="reset-confirm"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            className={cn('mt-1.5', inputClass)}
            {...register('confirmPassword')}
          />
        </div>
      </div>

      {serverError && <p className={errorClass}>{serverError}</p>}

      <Button
        type="submit"
        variant="primary"
        loading={resetPasswordMutation.isPending}
        className={primaryButtonClass}
      >
        {resetPasswordMutation.isPending ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
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

export default ResetPasswordForm
