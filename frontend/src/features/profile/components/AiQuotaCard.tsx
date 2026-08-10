import { useState } from 'react'
import { Zap, Crown, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { fadeUpItem } from '@/lib/motion'
import { useAuthStore } from '@/features/auth/authStore'
import { useAiQuota } from '@/features/ai-lab/hooks/useAiQuota'
import { UpgradeModal } from '@/features/payment/components/UpgradeModal'

export function AiQuotaCard() {
  const { user } = useAuthStore()
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  // Dữ liệu thật từ GET /me/ai-quota — cùng logic đếm/kiểm PRO với checkAiLimit.js (middleware
  // chặn tạo lượt sinh), nên số hiển thị ở đây luôn khớp số thật đang bị chặn/còn lại.
  const { data: quota, isLoading } = useAiQuota()

  const isPro = quota?.isPro ?? false
  const used = quota?.used ?? 0
  const limit = quota?.limit ?? 15
  const usedRatio = limit > 0 ? Math.min((used / limit) * 100, 100) : 0

  return (
    <>
      <motion.section variants={fadeUpItem} className="bg-surface border border-hairline rounded-lg p-5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[11px] font-semibold text-subtle uppercase tracking-wide flex items-center gap-1.5">
            Hạn mức AI
            {isPro && (
              <span className="bg-gradient-to-r from-amber-500 to-indigo-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                PRO
              </span>
            )}
          </h4>
          <div className="w-7 h-7 rounded-lg bg-pastel-yellow text-pastel-yellow-ink flex items-center justify-center">
            {isPro ? <Crown size={15} className="text-amber-600" /> : <Zap size={14} />}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-7 w-28 rounded bg-canvas" />
            <div className="h-2 w-full rounded-full bg-canvas" />
          </div>
        ) : isPro ? (
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold text-amber-500 flex items-center gap-1">
                Vô hạn <span className="text-xs font-normal text-subtle">lượt sinh AI</span>
              </span>
              <span className="text-xs font-semibold text-emerald-500">PRO Active</span>
            </div>
            <p className="text-xs text-subtle leading-relaxed">
              Hạn gói PRO đến:{' '}
              <strong className="text-ink">
                {user?.currentPlanExpiresAt ? new Date(user.currentPlanExpiresAt).toLocaleDateString('vi-VN') : 'Đang hoạt động'}
              </strong>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-2xl font-semibold text-ink leading-none">
                {used} <span className="text-sm font-normal text-subtle">/ {limit} lượt</span>
              </span>
              <span className="text-xs font-bold text-amber-500">Tài khoản FREE</span>
            </div>

            <div className="w-full h-2 bg-canvas rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${usedRatio}%` }}
              />
            </div>

            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <Sparkles size={14} /> Nâng cấp PRO ngay (99.000đ)
            </button>
          </div>
        )}
      </motion.section>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </>
  )
}
