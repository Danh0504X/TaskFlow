import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { IdCard } from 'lucide-react'
import { useAuthStore } from '@/features/auth/authStore'
import { useUpdateProfile } from '@/features/auth/hooks/useAuthMutations'
import { getApiErrorMessage } from '@/lib/http'
import { fadeUpItem } from '@/lib/motion'
import Modal, { type ModalTone } from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export function PersonalInfoForm() {
  const user = useAuthStore((state) => state.user)
  const updateProfileMutation = useUpdateProfile()
  // Khởi tạo 1 lần từ store — SessionGate đã đảm bảo store đồng bộ xong trước khi trang này
  // mount, nên không cần useEffect để "chờ" user tới sau. Sau khi lưu thành công, user.fullName
  // trong store cũng chính là giá trị vừa gửi -> isDirty tự về false, không cần đồng bộ lại.
  const [fullName, setFullName] = useState(user?.fullName ?? '')

  const [modalConfig, setModalConfig] = useState<{
    open: boolean
    tone: ModalTone
    title: string
    message: string
  }>({
    open: false,
    tone: 'brand',
    title: '',
    message: '',
  })

  const closeModal = () => setModalConfig((prev) => ({ ...prev, open: false }))

  if (!user) return null

  const trimmedName = fullName.trim()
  const isDirty = trimmedName !== '' && trimmedName !== user.fullName

  const handleCancel = () => setFullName(user.fullName)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!isDirty) return

    updateProfileMutation.mutate(
      { fullName: trimmedName },
      {
        onSuccess: () => {
          setModalConfig({
            open: true,
            tone: 'success',
            title: 'Cập nhật thành công',
            message: 'Thông tin cá nhân của bạn đã được lưu lại trên hệ thống.',
          })
        },
        onError: (error) => {
          setModalConfig({
            open: true,
            tone: 'danger',
            title: 'Lỗi cập nhật',
            message: getApiErrorMessage(error, 'Họ và tên chỉ được chứa chữ cái và khoảng trắng.'),
          })
        },
      },
    )
  }

  return (
    <motion.section variants={fadeUpItem} className="bg-surface border border-hairline rounded-lg p-6">
      <header className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-pastel-blue text-pastel-blue-ink flex items-center justify-center shrink-0">
          <IdCard size={16} />
        </div>
        <h3 className="text-base font-semibold text-ink">Thông tin cá nhân</h3>
      </header>

      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
        <div className="col-span-2">
          <Input label="Họ và tên" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="col-span-2">
          <Input label="Email" type="email" value={user.email} readOnly className="cursor-not-allowed opacity-70" />
        </div>

        <div className="col-span-2 mt-2 pt-5 border-t border-hairline flex justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={!isDirty || updateProfileMutation.isPending}
          >
            Huỷ
          </Button>
          <Button type="submit" disabled={!isDirty} loading={updateProfileMutation.isPending}>
            Lưu thay đổi
          </Button>
        </div>
      </form>

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
