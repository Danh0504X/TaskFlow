import { Zap } from 'lucide-react'
import { motion } from 'motion/react'
import { fadeUpItem } from '@/lib/motion'

// Chưa có API hạn mức AI thật cho user thường (khác với bảng "Hạn mức & xếp hạng" bên khu
// Admin, vốn quản lý toàn hệ thống) — số liệu dưới đây là placeholder tĩnh chờ nối API.
const USED = 5
const LIMIT = 15
const remainingPct = Math.round(((LIMIT - USED) / LIMIT) * 100)

export function AiQuotaCard() {
  return (
    <motion.section variants={fadeUpItem} className="bg-surface border border-hairline rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[11px] font-semibold text-subtle uppercase tracking-wide">Hạn mức AI</h4>
        <div className="w-7 h-7 rounded-lg bg-pastel-yellow text-pastel-yellow-ink flex items-center justify-center">
          <Zap size={14} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <span className="text-2xl font-semibold text-ink leading-none">
            {USED} <span className="text-sm font-normal text-subtle">/ {LIMIT} lượt</span>
          </span>
          <span className="text-xs font-bold text-brand">Còn lại {remainingPct}%</span>
        </div>

        <div className="w-full h-2 bg-canvas rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${(USED / LIMIT) * 100}%` }}
          />
        </div>

        <p className="text-xs text-subtle leading-relaxed">Hạn mức sẽ được làm mới vào lúc 00:00 ngày mai.</p>
      </div>
    </motion.section>
  )
}
