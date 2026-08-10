import { Zap, Crown, Sparkles, Eye } from 'lucide-react'
import { motion } from 'motion/react'
import { fadeUpItem } from '@/lib/motion'
import { useAuthStore } from '@/features/auth/authStore'
import { useAiQuota } from '@/features/ai-lab/hooks/useAiQuota'

interface AiQuotaCardProps {
  onOpenPricing?: () => void
  onOpenUpgrade?: () => void
}

export function AiQuotaCard({ onOpenPricing, onOpenUpgrade }: AiQuotaCardProps) {
  const { user } = useAuthStore()
  // Dữ liệu thật từ GET /me/ai-quota — cùng logic đếm/kiểm PRO với checkAiLimit.js (middleware
  // chặn tạo lượt sinh), nên số hiển thị ở đây luôn khớp số thật đang bị chặn/còn lại.
  const { data: quota, isLoading } = useAiQuota()

  const isPro = quota?.isPro ?? false
  const used = quota?.used ?? 0
  const limit = quota?.limit ?? 15
  const usedRatio = limit > 0 ? Math.min((used / limit) * 100, 100) : 0

  return (
    <motion.section variants={fadeUpItem} className="bg-surface border border-hairline rounded-lg p-5 relative overflow-hidden space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold text-subtle uppercase tracking-wide flex items-center gap-1.5">
          Hạn mức & Gói AI
          {isPro && (
            <span className="bg-gradient-to-r from-amber-500 to-indigo-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm">
              PRO VIP
            </span>
          )}
        </h4>
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
          {isPro ? <Crown size={15} className="text-amber-500" /> : <Zap size={14} />}
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

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onOpenPricing}
              className="py-2 px-2 bg-canvas border border-hairline hover:bg-surface text-ink text-xs font-semibold rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1"
            >
              <Eye size={13} /> Bảng Giá
            </button>
            <button
              onClick={onOpenUpgrade}
              className="py-2 px-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
            >
              <Crown size={13} /> Gia hạn PRO
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-2xl font-semibold text-ink leading-none">
              {used} <span className="text-sm font-normal text-subtle">/ {limit} lượt/ngày</span>
            </span>
            <span className="text-xs font-bold text-amber-500">Tài khoản FREE</span>
          </div>

          <div className="w-full h-2 bg-canvas rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${usedRatio}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onOpenPricing}
              className="py-2 px-2 bg-canvas border border-hairline hover:bg-surface text-ink text-xs font-semibold rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1"
            >
              <Eye size={13} /> Xem Bảng Giá
            </button>
            <button
              onClick={onOpenUpgrade}
              className="py-2 px-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
            >
              <Sparkles size={13} /> Nâng cấp PRO
            </button>
          </div>
        </div>
      )}
    </motion.section>
  )
}
