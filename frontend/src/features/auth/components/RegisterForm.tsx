import { useState, useEffect, type FocusEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'motion/react'
import { useGoogleLogin } from '@react-oauth/google'
import { ArrowRight, Mail } from 'lucide-react'

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

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { cn } from '@/lib/cn'
import { getApiErrorMessage } from '@/lib/http'
import {
  useSignUp,
  useCheckEmail,
  useGoogleSignIn,
} from '../hooks/useAuthMutations'
import { registerSchema } from '../auth.schema'
import type { RegisterFormValues } from '../auth.schema'
import {
  errorClass,
  ghostButtonClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from '../auth.styles'

// Form đăng ký 2 bước: (1) Họ tên + Email, (2) Mật khẩu + Xác nhận.
const RegisterForm = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('token')
  const signUpMutation = useSignUp()
  const checkEmailMutation = useCheckEmail()
  const googleMutation = useGoogleSignIn()

  const [step, setStep] = useState<1 | 2>(1)
  const [serverError, setServerError] = useState('')
  const [decodedEmail, setDecodedEmail] = useState('')

  const {
    register,
    handleSubmit,
    trigger,
    setError,
    getValues,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  })

  useEffect(() => {
    if (inviteToken) {
      const decoded = decodeJWT(inviteToken)
      if (decoded?.email) {
        setDecodedEmail(decoded.email)
        setValue('email', decoded.email)
      }
    }
  }, [inviteToken, setValue])

  // register email riêng để vừa giữ onBlur gốc của react-hook-form,
  // vừa gắn thêm việc kiểm tra email tồn tại ngay khi rời khỏi ô email.
  const emailField = register('email')

  // Kiểm tra email đã có trong hệ thống chưa (chỉ chạy khi định dạng hợp lệ).
  // Trả về true nếu email còn dùng được (chưa ai đăng ký).
  const verifyEmailAvailable = async () => {
    if (decodedEmail) return true
    const isEmailValid = await trigger('email')
    if (!isEmailValid) return false

    setServerError('')
    try {
      const { available } = await checkEmailMutation.mutateAsync(
        getValues('email'),
      )
      if (!available) {
        setError('email', { type: 'manual', message: 'Email đã được sử dụng.' })
        return false
      }
      return true
    } catch (err) {
      setServerError(
        getApiErrorMessage(err, 'Không kiểm tra được email, vui lòng thử lại'),
      )
      return false
    }
  }

  // Vừa rời ô email -> kiểm tra ngay (gọi cả onBlur gốc của react-hook-form).
  const handleEmailBlur = (event: FocusEvent<HTMLInputElement>) => {
    emailField.onBlur(event)
    void verifyEmailAvailable()
  }

  // Sang bước 2 khi: (1) tên hợp lệ và (2) email hợp lệ + chưa có người dùng.
  const handleNextStep = async () => {
    const isNameValid = await trigger('fullName')
    const isEmailAvailable = await verifyEmailAvailable()
    if (isNameValid && isEmailAvailable) setStep(2)
  }

  // Đăng ký KHÔNG đăng nhập ngay -> backend gửi mã, chuyển sang trang nhập mã xác thực.
  const onSubmit = async (data: RegisterFormValues) => {
    setServerError('')
    try {
      await signUpMutation.mutateAsync({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        inviteToken: inviteToken ?? undefined,
      })
      navigate('/verify-email', {
        state: { email: data.email, inviteToken: inviteToken ?? undefined },
      })
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Đăng ký thất bại, vui lòng thử lại'))
    }
  }

  // Google OAuth implicit flow -> gửi access_token lên backend rồi vào thẳng dashboard.
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setServerError('')
      try {
        await googleMutation.mutateAsync(tokenResponse.access_token)
        navigate('/', { replace: true })
      } catch (err) {
        setServerError(getApiErrorMessage(err, 'Đăng nhập Google thất bại'))
      }
    },
    onError: () => setServerError('Đăng nhập Google thất bại'),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative w-full space-y-5">
      {/* Chỉ báo bước: cho biết đang ở part mấy trong 2 part. */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="ml-1 text-[12px] font-semibold uppercase tracking-wide text-brand">
            Step {step} of 2
          </span>
          <span className="mr-1 text-[12px] font-medium text-subtle">
            {step === 1 ? 'Your details' : 'Set a password'}
          </span>
        </div>
        <div className="flex gap-2">
          <span className="h-1.5 flex-1 rounded-full bg-ink" />
          <span
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              step === 2 ? 'bg-ink' : 'bg-hairline',
            )}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="register-fullname" className={labelClass}>
                Full Name
              </label>
              <Input
                id="register-fullname"
                {...register('fullName')}
                placeholder="John Doe"
                className={cn('mt-1.5', inputClass)}
              />
              {errors.fullName && (
                <p className={errorClass}>{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="register-email" className={labelClass}>
                Email Address
              </label>
              <Input
                id="register-email"
                {...emailField}
                onBlur={handleEmailBlur}
                type="email"
                placeholder="john@example.com"
                disabled={!!decodedEmail}
                className={cn(
                  'mt-1.5',
                  inputClass,
                  decodedEmail && 'opacity-60 bg-canvas cursor-not-allowed'
                )}
              />
              {errors.email && (
                <p className={errorClass}>{errors.email.message}</p>
              )}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
            className="space-y-4"
          >
            {/* Cho biết đang tạo mật khẩu cho email nào (lấy từ bước 1). */}
            <div className="flex items-start gap-2.5 rounded-lg border border-hairline bg-canvas px-4 py-3">
              <Mail className="mt-0.5 h-[18px] w-[18px] shrink-0 text-brand" />
              <p className="text-[13px] leading-snug text-muted">
                Creating a password for{' '}
                <span className="font-semibold text-ink">
                  {getValues('email')}
                </span>
              </p>
            </div>

            <div>
              <label htmlFor="register-password" className={labelClass}>
                Password
              </label>
              <Input
                id="register-password"
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className={cn('mt-1.5', inputClass)}
              />
              {dirtyFields.password && errors.password && (
                <p className={errorClass}>{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="register-confirm" className={labelClass}>
                Confirm Password
              </label>
              <Input
                id="register-confirm"
                {...register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className={cn('mt-1.5', inputClass)}
              />
              {dirtyFields.confirmPassword && errors.confirmPassword && (
                <p className={errorClass}>{errors.confirmPassword.message}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {serverError && <p className="ml-1 text-sm text-pastel-red-ink">{serverError}</p>}

      <Button
        type={step === 1 ? 'button' : 'submit'}
        onClick={step === 1 ? handleNextStep : undefined}
        variant="primary"
        loading={signUpMutation.isPending || checkEmailMutation.isPending}
        className={primaryButtonClass}
      >
        {step === 1 ? (
          <span className="flex items-center justify-center gap-2">
            Continue
            <ArrowRight className="h-[18px] w-[18px]" />
          </span>
        ) : (
          'Create account'
        )}
      </Button>

      {/* Đăng nhập bằng Google + link sang trang đăng nhập chỉ hiện ở bước 1 */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-5"
        >
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-hairline" />
            <span className="mx-3 flex-shrink text-[12px] font-medium text-subtle">
              or join with
            </span>
            <div className="flex-grow border-t border-hairline" />
          </div>

          <Button
            variant="ghost"
            type="button"
            onClick={() => loginWithGoogle()}
            className={ghostButtonClass}
          >
            <img
              src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png"
              alt="Google"
              className="h-5 w-5"
            />
            <span>Google</span>
          </Button>

          <footer className="text-center">
            <p className="text-[14px] text-muted">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-brand transition-colors hover:text-brand-light hover:underline"
              >
                Log in
              </Link>
            </p>
          </footer>
        </motion.div>
      )}
    </form>
  )
}

export default RegisterForm
