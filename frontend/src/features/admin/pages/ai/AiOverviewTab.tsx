import type { CSSProperties } from 'react'
import { AlertTriangle, Clock, TrendingDown } from 'lucide-react'
import { useAiStats } from '../../hooks/useAiStats'
import AdminStatCard from '../../components/AdminStatCard'
import FunnelChart from '../../components/FunnelChart'
import DualAxisChart from '../../components/DualAxisChart'
import { SectionCard, TableError, TableLoading } from '../../components/TableStates'
import { AI_TYPE_LABEL } from '../../ai.constants'
import { formatDate } from '@/lib/format'

const ALERT_ICON = { STUCK_PROCESSING: Clock, QUOTA_CAPPED: AlertTriangle, ERROR_SPIKE: TrendingDown } as const

const AiOverviewTab = () => {
  const { data, isLoading, isError } = useAiStats()

  if (isLoading) return <TableLoading label="Đang tải số liệu AI..." />
  if (isError || !data) return <TableError />

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminStatCard
          label="Chi phí tháng này"
          value={`$${data.costThisMonth.current.toFixed(2)}`}
          trend={data.costThisMonth}
          invertTrendColor
          dangerAboveTrendPct={20}
          staggerIndex={0}
        />
        <AdminStatCard label="Tỉ lệ chấp nhận 7 ngày" value={`${(data.acceptanceRate7d * 100).toFixed(0)}%`} staggerIndex={1} />
        <AdminStatCard label="Tỉ lệ lỗi 7 ngày" value={`${(data.errorRate7d * 100).toFixed(1)}%`} staggerIndex={2} />
        <AdminStatCard label="Lượt sinh hôm nay" value={data.generationsToday} staggerIndex={3} />
      </div>

      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert, idx) => {
            const Icon = ALERT_ICON[alert.kind]
            return (
              <div
                key={alert.id}
                className="animate-fade-up flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5"
                style={{ '--stagger': idx } as CSSProperties}
              >
                <Icon size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink">{alert.message}</p>
                  <p className="text-[10px] text-subtle font-mono mt-0.5">{formatDate(alert.createdAt)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard className="p-5 animate-fade-up" style={{ '--stagger': 4 } as CSSProperties}>
          <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-4">Phễu chuyển đổi</h3>
          <FunnelChart stages={data.funnel} wastedDrafts={data.wastedDrafts} wastedDraftsRate={data.wastedDraftsRate} />
        </SectionCard>

        <SectionCard className="p-5 animate-fade-up" style={{ '--stagger': 5 } as CSSProperties}>
          <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-4">Tỉ lệ chấp nhận theo loại</h3>
          <div className="space-y-3">
            {data.byType.map((row) => (
              <div key={row.type} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink">{AI_TYPE_LABEL[row.type]}</span>
                  <span className="text-subtle">
                    {row.count} lượt · TB {row.avgTokens.toLocaleString('vi-VN')} token
                  </span>
                </div>
                <div className="h-2 bg-canvas rounded-full overflow-hidden">
                  <div className="h-full bg-brand rounded-full" style={{ width: `${row.acceptanceRate * 100}%` }} />
                </div>
                <div className="text-right text-[11px] font-bold text-ink">{(row.acceptanceRate * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard className="p-5 animate-fade-up" style={{ '--stagger': 6 } as CSSProperties}>
        <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-4">Token &amp; chi phí 30 ngày</h3>
        <DualAxisChart data={data.daily30d} />
      </SectionCard>
    </div>
  )
}

export default AiOverviewTab
