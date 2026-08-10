import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Crown, X, Clock, AlertTriangle, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/features/auth/authStore'

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

  if (!isOpen) return null

  const isExpiredPro =
    user?.plan === 'PRO' &&
    user?.currentPlanExpiresAt &&
    new Date(user.currentPlanExpiresAt) <= new Date()

  // Tính giờ reset (07:00 sáng mai GMT+7 / 00:00 UTC)
  const getNextResetTimeString = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(7, 0, 0, 0)
    return tomorrow.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' sáng mai'
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-surface border border-hairline rounded-2xl shadow-2xl overflow-hidden text-ink"
        >
          {/* Top Bar Icon Header */}
          <div className="relative bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 p-6 text-center border-b border-hairline">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-subtle hover:text-ink transition-colors p-1.5 rounded-lg hover:bg-surface/50 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 mb-3">
              {isExpiredPro ? <Crown size={32} /> : <Sparkles size={32} />}
            </div>

            <h3 className="text-xl font-bold text-ink">
              {isExpiredPro ? 'Gói PRO của bạn đã hết hạn' : 'Đã đạt giới hạn AI hôm nay'}
            </h3>
            <p className="text-xs text-subtle mt-1">
              {isExpiredPro
                ? 'Gói PRO đã hết hạn sử dụng. Hãy gia hạn để tiếp tục sử dụng AI không giới hạn!'
                : `Tài khoản FREE được sử dụng tối đa ${dailyLimit} lượt tạo AI mỗi ngày.`}
            </p>
          </div>

          {/* Body stats */}
          <div className="p-6 space-y-4 text-xs">
            {/* Box Đếm lượt sử dụng */}
            <div className="p-3.5 bg-canvas border border-hairline rounded-xl space-y-2">
              <div className="flex items-center justify-between font-medium">
                <span className="text-subtle flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-500" /> Số lượt đã dùng
                </span>
                <span className="text-sm font-bold text-amber-500">
                  {dailyUsedCount} / {dailyLimit} lượt
                </span>
              </div>
              <div className="w-full bg-hairline h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full w-full rounded-full" />
              </div>
              <div className="flex items-center justify-between text-[11px] text-subtle pt-1">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> Hạn mức tự đặt lại vào:
                </span>
                <span className="font-semibold text-ink">{getNextResetTimeString()}</span>
              </div>
            </div>

            {/* Quyền lợi Nâng cấp PRO */}
            <div className="p-3.5 bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/20 rounded-xl space-y-1.5">
              <p className="font-semibold text-ink flex items-center gap-1.5 text-xs">
                <Crown size={15} className="text-amber-500" /> Mở khóa PRO ngay hôm nay:
              </p>
              <ul className="list-disc list-inside space-y-1 text-subtle text-[11px] pl-1">
                <li>Tạo không giới hạn Issue / Task / Epic bằng AI</li>
                <li>Không phải chờ đặt lại hạn mức hàng ngày</li>
                <li>Tự động tối ưu câu prompt chuẩn Scrum/Agile</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  onClose()
                  onOpenPricing()
                }}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                {isExpiredPro ? 'Gia hạn gói PRO ngay' : 'Nâng cấp lên gói PRO ngay'}
                <ArrowRight size={15} />
              </button>

              <button
                onClick={onClose}
                className="w-full py-2 text-subtle hover:text-ink font-medium text-xs text-center cursor-pointer transition-colors"
              >
                Để sau, tôi sẽ tiếp tục dùng tính năng khác
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
