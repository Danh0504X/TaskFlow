import type { AiFunnelStage } from '../admin.types'

interface FunnelChartProps {
  stages: AiFunnelStage[]
  wastedDrafts: number
  wastedDraftsRate: number
}

/** Phễu chuyển đổi vẽ bằng div co chiều rộng dần theo tỉ lệ — không cần SVG. */
const FunnelChart = ({ stages, wastedDrafts, wastedDraftsRate }: FunnelChartProps) => {
  const max = Math.max(...stages.map((s) => s.value), 1)

  return (
    <div className="space-y-2.5">
      {stages.map((stage) => {
        const widthPct = Math.max(8, (stage.value / max) * 100)
        return (
          <div key={stage.label} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-[11px] font-semibold text-muted">{stage.label}</span>
            <div className="flex-1 h-7 bg-canvas rounded-md overflow-hidden">
              <div
                className="h-full rounded-md flex items-center justify-end px-2.5 bg-brand/70 text-[11px] font-bold text-ink transition-all"
                style={{ width: `${widthPct}%` }}
              >
                {stage.value.toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
        )
      })}

      <p className="text-[11px] font-medium text-subtle pt-1">
        <span className="text-ink font-bold">{Math.round((1 - wastedDraftsRate) * 100)}%</span> draft được chấp nhận ·{' '}
        <span className="text-amber-500 font-bold">{wastedDrafts.toLocaleString('vi-VN')} draft bỏ phí</span>
      </p>
    </div>
  )
}

export default FunnelChart
