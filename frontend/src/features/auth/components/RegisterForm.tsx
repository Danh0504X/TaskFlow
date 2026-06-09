import { useState, type FocusEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'motion/react'
import { useGoogleLogin } from '@react-oauth/google'
import { ArrowRight } from 'lucide-react'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { cn } from '@/lib/cn'
import { getApiErrorMessage } from '@/lib/http'
import { useAuth } from '../hooks/useAuth'
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
  const { signUp, checkEmail, googleSignIn } = useAuth()

  const [step, setStep] = useState<1 | 2>(1)
  const [serverError, setServerError] = useState('')
  const [checkingEmail, setCheckingEmail] = useState(false)

  const {
    register,
    handleSubmit,
    trigger,
    setError,
    getValues,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  })

  // register email riêng để vừa giữ onBlur gốc của react-hook-form,
  // vừa gắn thêm việc kiểm tra email tồn tại ngay khi rời khỏi ô email.
  const emailField = register('email')

  // Kiểm tra email đã có trong hệ thống chưa (chỉ chạy khi định dạng hợp lệ).
  // Trả về true nếu email còn dùng được (chưa ai đăng ký).
  const verifyEmailAvailable = async () => {
    const isEmailValid = await trigger('email')
    if (!isEmailValid) return false

    setServerError('')
    setCheckingEmail(true)
    try {
      const { available } = await checkEmail(getValues('email'))
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
    } finally {
      setCheckingEmail(false)
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
      await signUp({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      })
      navigate('/verify-email', { state: { email: data.email } })
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Đăng ký thất bại, vui lòng thử lại'))
    }
  }

  // Google OAuth implicit flow -> gửi access_token lên backend rồi vào thẳng dashboard.
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setServerError('')
      try {
        await googleSignIn(tokenResponse.access_token)
        navigate('/', { replace: true })
      } catch (err) {
        setServerError(getApiErrorMessage(err, 'Đăng nhập Google thất bại'))
      }
    },
    onError: () => setServerError('Đăng nhập Google thất bại'),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative w-full space-y-5">
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
              <label className={labelClass}>Full Name</label>
              <Input
                {...register('fullName')}
                placeholder="John Doe"
                className={cn('mt-1.5', inputClass)}
              />
              {errors.fullName && (
                <p className={errorClass}>{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>Email Address</label>
              <Input
                {...emailField}
                onBlur={handleEmailBlur}
                type="email"
                placeholder="john@example.com"
                className={cn('mt-1.5', inputClass)}
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
            <div>
              <label className={labelClass}>Password</label>
              <Input
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
              <label className={labelClass}>Confirm Password</label>
              <Input
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

      {serverError && <p className="ml-1 text-sm text-red-500">{serverError}</p>}

      <Button
        type={step === 1 ? 'button' : 'submit'}
        onClick={step === 1 ? handleNextStep : undefined}
        variant="primary"
        loading={isSubmitting || checkingEmail}
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
            <div className="flex-grow border-t border-[#cbc3d7]/60" />
            <span className="mx-3 flex-shrink text-[12px] font-medium text-[#a89db8]">
              or join with
            </span>
            <div className="flex-grow border-t border-[#cbc3d7]/60" />
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
            <p className="text-[14px] text-[#494454]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-[#6b38d4] transition-colors hover:text-[#8455ef] hover:underline"
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
