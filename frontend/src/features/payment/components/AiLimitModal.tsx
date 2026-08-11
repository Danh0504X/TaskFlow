import React from 'react'
import { Sparkles, Crown, Clock, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/features/auth/authStore'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface AiLimitModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenPricing: () => void
  dailyUsedCount?: number
  dailyLimit?: number
}

export const AiLimitModal: React.FC<AiLimitModalProps> = ({
  isOpen,
  onClose,
  onOpenPricing,
  dailyUsedCount = 5,
  dailyLimit = 5,
}) => {
  const { user } = useAuthStore()

  const isExpiredPro =
    user?.plan === 'PRO' &&
    user?.currentPlanExpiresAt &&
    new Date(user.currentPlanExpiresAt) <= new Date()

  const usedRatio = dailyLimit > 0 ? Math.min((dailyUsedCount / dailyLimit) * 100, 100) : 100

  // Tính giờ reset (07:00 sáng mai GMT+7 / 00:00 UTC)
  const getNextResetTimeString = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(7, 0, 0, 0)
    return tomorrow.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' sáng mai'
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isExpiredPro ? 'Gói PRO của bạn đã hết hạn' : 'Đã đạt giới hạn AI hôm nay'}
      tone="premium"
      layout="compact"
      icon={isExpiredPro ? <Crown size={18} /> : <Sparkles size={18} />}
    >
      <p className="text-xs text-subtle -mt-1 mb-4">
        {isExpiredPro
          ? 'Gói PRO đã hết hạn sử dụng. Hãy gia hạn để tiếp tục sử dụng AI không giới hạn!'
          : `Tài khoản FREE được sử dụng tối đa ${dailyLimit} lượt tạo AI mỗi ngày.`}
      </p>

      <div className="space-y-4 text-xs">
        {/* Box Đếm lượt sử dụng */}
        <div className="p-3.5 bg-canvas border border-hairline rounded-lg space-y-2">
          <div className="flex items-center justify-between font-medium">
            <span className="text-subtle flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-pastel-yellow-ink" /> Số lượt đã dùng
            </span>
            <span className="text-sm font-bold text-pastel-yellow-ink">
              {dailyUsedCount} / {dailyLimit} lượt
            </span>
          </div>
          <div className="w-full bg-hairline h-2 rounded-full overflow-hidden">
            <div className="bg-pastel-yellow-ink h-full rounded-full transition-all duration-500" style={{ width: `${usedRatio}%` }} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-subtle pt-1">
            <span className="flex items-center gap-1">
              <Clock size={12} /> Hạn mức tự đặt lại vào:
            </span>
            <span className="font-semibold text-ink">{getNextResetTimeString()}</span>
          </div>
        </div>

        {/* Quyền lợi Nâng cấp PRO */}
        <div className="p-3.5 rounded-lg bg-pastel-yellow text-pastel-yellow-ink space-y-1.5">
          <p className="font-semibold flex items-center gap-1.5 text-xs">
            <Crown size={15} /> Mở khóa PRO ngay hôm nay:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] pl-1">
            <li>Tạo không giới hạn Issue / Task / Epic bằng AI</li>
            <li>Không phải chờ đặt lại hạn mức hàng ngày</li>
            <li>Tự động tối ưu câu prompt chuẩn Scrum/Agile</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="pt-1 space-y-1.5">
          <Button
            className="w-full"
            onClick={() => {
              onClose()
              onOpenPricing()
            }}
          >
            {isExpiredPro ? 'Gia hạn gói PRO ngay' : 'Nâng cấp lên gói PRO ngay'}
          </Button>

          <Button variant="ghost" className="w-full" onClick={onClose}>
            Để sau, tôi sẽ tiếp tục dùng tính năng khác
          </Button>
        </div>
      </div>
    </Modal>
  )
}
