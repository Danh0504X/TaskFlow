import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/features/auth/authStore'
import { useForgotPassword } from '@/features/auth/hooks/useAuthMutations'
import { getApiErrorMessage } from '@/lib/http'
import { fadeUpItem } from '@/lib/motion'
import Modal, { type ModalTone } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

const GoogleIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

export function SecuritySettings() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const forgotPasswordMutation = useForgotPassword()

  const [modalConfig, setModalConfig] = useState<{ open: boolean; tone: ModalTone; title: string; message: string }>({
    open: false,
    tone: 'brand',
    title: '',
    message: '',
  })

  if (!user) {
    return (
      <div className="bg-surface border border-hairline rounded-lg p-6 flex justify-center text-muted">
        <Spinner />
      </div>
    )
  }

  const isGoogle = user.authProvider === 'google'
  const hasPassword = user.hasPassword ?? false

  const closeModal = () => setModalConfig((prev) => ({ ...prev, open: false }))

  const handleForgotPassword = () => {
    forgotPasswordMutation.mutate(
      { email: user.email },
      {
        onSuccess: (res) => setModalConfig({ open: true, tone: 'success', title: 'Đã gửi email', message: res.message }),
        onError: (error) =>
          setModalConfig({ open: true, tone: 'danger', title: 'Lỗi', message: getApiErrorMessage(error, 'Không thể gửi email lúc này.') }),
      },
    )
  }

  return (
    <motion.section variants={fadeUpItem} className="bg-surface border border-hairline rounded-lg p-6">
      <header className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-pastel-green text-pastel-green-ink flex items-center justify-center shrink-0">
          <ShieldCheck size={16} />
        </div>
        <h3 className="text-base font-semibold text-ink">Bảo mật &amp; Mật khẩu</h3>
      </header>

      <div className="space-y-4">
        {isGoogle && (
          <div className="p-4 bg-canvas rounded-lg border border-hairline flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface border border-hairline flex items-center justify-center shrink-0">
                <GoogleIcon />
              </div>
              <div>
                <span className="font-semibold text-sm text-ink">Đã liên kết với Google</span>
                <p className="text-subtle text-xs mt-0.5">
                  {hasPassword ? 'Tài khoản của bạn đăng nhập bằng Google.' : 'Bạn chưa thiết lập mật khẩu cho tài khoản này.'}
                </p>
              </div>
            </div>

            {!hasPassword && (
              <Button variant="primary" size="sm" onClick={() => navigate('/profile/change-password')} className="w-fit">
                <KeyRound size={14} />
                Thiết lập mật khẩu mới
              </Button>
            )}
          </div>
        )}

        {hasPassword && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-canvas rounded-lg border border-hairline">
            <div>
              <p className="font-semibold text-sm text-ink">Mật khẩu</p>
              <p className="text-subtle text-xs mt-0.5">Đổi mật khẩu đăng nhập TaskFlow của bạn.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleForgotPassword} loading={forgotPasswordMutation.isPending}>
                Quên mật khẩu?
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/profile/change-password')}>
                Đổi mật khẩu
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={modalConfig.open}
        onClose={closeModal}
        title={modalConfig.title}
        tone={modalConfig.tone}
        layout="compact"
        footer={
          <Button variant="secondary" onClick={closeModal}>
            Đóng
          </Button>
        }
      >
        <p className="text-sm text-muted leading-relaxed">{modalConfig.message}</p>
      </Modal>
    </motion.section>
  )
}
