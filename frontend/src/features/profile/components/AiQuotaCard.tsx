import { Zap, Crown, Sparkles, Eye } from 'lucide-react'
import { motion } from 'motion/react'
import { fadeUpItem } from '@/lib/motion'
import { useAuthStore } from '@/features/auth/authStore'
import { useAiQuota } from '@/features/ai-lab/hooks/useAiQuota'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

interface AiQuotaCardProps {
  onOpenPricing?: () => void
  onOpenUpgrade?: () => void
}

export function AiQuotaCard({ onOpenPricing, onOpenUpgrade }: AiQuotaCardProps) {
  const { user } = useAuthStore()
  // Dữ liệu thật từ GET /me/ai-quota — cùng logic đếm/kiểm PRO với checkAiLimit.js (middleware
  // chặn tạo lượt sinh), nên số hiển thị ở đây luôn khớp số thật đang bị chặn/còn lại.
  const { data: quota, isLoading } = useAiQuota()

  const isPro = quota?.isPro ?? (user?.plan === 'PRO' && user?.currentPlanExpiresAt && new Date(user.currentPlanExpiresAt) > new Date())
  const used = quota?.used ?? 0
  const limit = quota?.limit ?? 15
  const usedRatio = limit > 0 ? Math.min((used / limit) * 100, 100) : 0

  return (
    <motion.section variants={fadeUpItem} className="bg-surface border border-hairline rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold text-subtle uppercase tracking-wide flex items-center gap-1.5">
          Hạn mức & Gói AI
          {isPro && <Badge color="amber">PRO</Badge>}
        </h4>
        <div className="w-7 h-7 rounded-lg bg-pastel-yellow text-pastel-yellow-ink flex items-center justify-center">
          {isPro ? <Crown size={15} /> : <Zap size={14} />}
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
            <span className="text-2xl font-bold text-pastel-yellow-ink flex items-center gap-1">
              Vô hạn <span className="text-xs font-normal text-subtle">lượt sinh AI</span>
            </span>
            <span className="text-xs font-semibold text-pastel-green-ink">Đang hoạt động</span>
          </div>
          <p className="text-xs text-subtle leading-relaxed">
            Hạn gói PRO đến:{' '}
            <strong className="text-ink">
              {user?.currentPlanExpiresAt ? new Date(user.currentPlanExpiresAt).toLocaleDateString('vi-VN') : 'Đang hoạt động'}
            </strong>
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={onOpenPricing}>
              <Eye size={13} /> Bảng giá
            </Button>
            <Button size="sm" onClick={onOpenUpgrade}>
              <Crown size={13} /> Gia hạn PRO
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-2xl font-semibold text-ink leading-none">
              {used} <span className="text-sm font-normal text-subtle">/ {limit} lượt/ngày</span>
            </span>
            <span className="text-xs font-bold text-subtle">Tài khoản FREE</span>
          </div>

          <div className="w-full h-2 bg-canvas rounded-full overflow-hidden">
            <div
              className="h-full bg-pastel-yellow-ink rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${usedRatio}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={onOpenPricing}>
              <Eye size={13} /> Xem bảng giá
            </Button>
            <Button size="sm" onClick={onOpenUpgrade}>
              <Sparkles size={13} /> Nâng cấp PRO
            </Button>
          </div>
        </div>
      )}
    </motion.section>
  )
}
