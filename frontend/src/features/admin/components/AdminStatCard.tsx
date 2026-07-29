import type { CSSProperties, ReactNode } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { TrendValue } from '../admin.types'

interface AdminStatCardProps {
  label: string
  value: ReactNode
  trend?: TrendValue
  /** true = tăng là xấu (vd chi phí AI) -> đảo màu mũi tên. */
  invertTrendColor?: boolean
  /** Ngưỡng % để tô đỏ khi tăng bất thường (vd chi phí AI tăng > 20%). */
  dangerAboveTrendPct?: number
  /** Thứ tự trong dải thẻ — dùng để so le hiệu ứng xuất hiện (animate-fade-up), giống ProjectCard. */
  staggerIndex?: number
  className?: string
}

const trendPct = (trend: TrendValue) => {
  if (trend.previous === 0) return trend.current > 0 ? 100 : 0
  return ((trend.current - trend.previous) / trend.previous) * 100
}

/** Thẻ số liệu mật độ admin: số lớn + đường xu hướng gọn, không trang trí như StatCard của user app. */
const AdminStatCard = ({ label, value, trend, invertTrendColor, dangerAboveTrendPct, staggerIndex = 0, className }: AdminStatCardProps) => {
  const pct = trend ? trendPct(trend) : null
  const isUp = pct !== null && pct >= 0
  const isDanger = pct !== null && dangerAboveTrendPct !== undefined && pct > dangerAboveTrendPct
  const goodDirection = invertTrendColor ? !isUp : isUp

  return (
    <div
      className={cn(
        'animate-fade-up bg-surface border border-hairline rounded-xl p-5 transition-colors hover:border-ink/20',
        className,
      )}
      style={{ '--stagger': staggerIndex } as CSSProperties}
    >
      <p className="text-[11px] font-semibold text-subtle uppercase tracking-wide">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="text-3xl font-semibold text-ink tabular-nums leading-none">{value}</span>
        {pct !== null && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-xs font-bold pb-0.5',
              isDanger ? 'text-red-500' : goodDirection ? 'text-emerald-500' : 'text-red-500',
            )}
          >
            {isUp ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(pct).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  )
}

export default AdminStatCard
