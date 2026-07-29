import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { getApiErrorMessage } from '@/lib/http'
import { changePasswordSchema, type ChangePasswordFormValues } from '@/features/auth/auth.schema'
import { useChangePassword } from '@/features/auth/hooks/useAuthMutations'
import { useAuthStore } from '@/features/auth/authStore'
import PageHeader from '@/components/layout/PageHeader'
import PageHeaderButton from '@/components/layout/PageHeaderButton'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Modal, { type ModalTone } from '@/components/ui/Modal'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const changePasswordMutation = useChangePassword()

  const [modalConfig, setModalConfig] = useState<{ open: boolean; tone: ModalTone; title: string; message: string; isSuccess: boolean }>({
    open: false,
    tone: 'brand',
    title: '',
    message: '',
    isSuccess: false,
  })

  const hasPassword = user?.hasPassword ?? false

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = (data: ChangePasswordFormValues) => {
    const payload = {
      currentPassword: data.currentPassword || '',
      newPassword: data.newPassword,
    }

    changePasswordMutation.mutate(payload, {
      onSuccess: () => {
        if (user) setUser({ ...user, hasPassword: true })
        setModalConfig({
          open: true,
          tone: 'success',
          title: 'Thành công',
          message: hasPassword ? 'Đổi mật khẩu thành công!' : 'Thiết lập mật khẩu thành công!',
          isSuccess: true,
        })
      },
      onError: (error) => {
        setModalConfig({
          open: true,
          tone: 'danger',
          title: 'Lỗi thiết lập',
          message: getApiErrorMessage(error, 'Có lỗi xảy ra, vui lòng kiểm tra lại mật khẩu hiện tại.'),
          isSuccess: false,
        })
      },
    })
  }

  const handleCloseModal = () => {
    setModalConfig((prev) => ({ ...prev, open: false }))
    if (modalConfig.isSuccess) {
      reset()
      navigate('/profile')
    }
  }

  if (!user) {
    return (
      <div className="flex justify-center pt-16 text-muted">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col">
      <PageHeader
        title={hasPassword ? 'Đổi mật khẩu' : 'Thiết lập mật khẩu'}
        subtitle="Bảo vệ tài khoản TaskFlow của bạn bằng một mật khẩu mạnh."
        actions={
          <PageHeaderButton icon={ArrowLeft} onClick={() => navigate('/profile')}>
            Quay lại hồ sơ
          </PageHeaderButton>
        }
      />

      <div className="px-8 md:px-12 pt-6 pb-12">
        <section className="bg-surface border border-hairline rounded-lg p-6">
          <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            {hasPassword && (
              <Input
                label="Mật khẩu hiện tại"
                type="password"
                placeholder="••••••••"
                error={errors.currentPassword?.message}
                {...register('currentPassword')}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Mật khẩu mới"
                type="password"
                placeholder="••••••••"
                error={errors.newPassword?.message}
                {...register('newPassword')}
              />
              <Input
                label="Xác nhận mật khẩu"
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>

            <div className="pt-5 mt-2 border-t border-hairline flex justify-end gap-2.5">
              <Button type="button" variant="ghost" onClick={() => navigate('/profile')}>
                Huỷ
              </Button>
              <Button type="submit" loading={changePasswordMutation.isPending}>
                {hasPassword ? 'Cập nhật mật khẩu' : 'Lưu mật khẩu mới'}
              </Button>
            </div>
          </form>
        </section>
      </div>

      <Modal
        open={modalConfig.open}
        onClose={handleCloseModal}
        title={modalConfig.title}
        tone={modalConfig.tone}
        layout="compact"
        footer={
          <Button variant="primary" onClick={handleCloseModal}>
            Đóng
          </Button>
        }
      >
        <p className="text-sm text-muted leading-relaxed">{modalConfig.message}</p>
      </Modal>
    </div>
  )
}
