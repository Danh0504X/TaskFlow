import { useMemo, useState } from 'react'
import { formatDate } from '@/lib/format'
import type { AiDailyStat } from '../admin.types'

interface DualAxisChartProps {
  data: AiDailyStat[]
  height?: number
}

const WIDTH = 960

const scalePoints = (values: number[], height: number) => {
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const stepX = WIDTH / Math.max(values.length - 1, 1)
  return values.map((v, i) => ({ x: i * stepX, y: height - ((v - min) / range) * (height - 24) - 8 }))
}

const toPath = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

/** Biểu đồ 2 trục Y (token trái, chi phí phải) — dùng cho tab AI Tổng quan. Không dùng thư
 * viện biểu đồ, chỉ SVG + path thủ công. */
const DualAxisChart = ({ data, height = 240 }: DualAxisChartProps) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const { tokenPath, costPath, tokenPoints } = useMemo(() => {
    const tokenPts = scalePoints(data.map((d) => d.tokens), height)
    const costPts = scalePoints(data.map((d) => d.costUsd), height)
    return { tokenPath: toPath(tokenPts), costPath: toPath(costPts), tokenPoints: tokenPts }
  }, [data, height])

  if (data.length === 0) return null

  const hovered = hoverIdx !== null ? data[hoverIdx] : null
  const hoveredPoint = hoverIdx !== null ? tokenPoints[hoverIdx] : null

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-2 text-[11px] font-semibold">
        <span className="flex items-center gap-1.5 text-ink">
          <span className="w-2.5 h-0.5 rounded-full" style={{ background: 'var(--color-brand)' }} />
          Token/ngày
        </span>
        <span className="flex items-center gap-1.5 text-muted">
          <span className="w-2.5 h-0.5 rounded-full bg-emerald-500" />
          Chi phí/ngày (USD)
        </span>
      </div>

      <div className="relative w-full">
        <svg viewBox={`0 0 ${WIDTH} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
          {Array.from({ length: 5 }).map((_, i) => {
            const y = (height / 4) * i
            return <line key={i} x1={0} x2={WIDTH} y1={y} y2={y} stroke="var(--color-hairline)" strokeWidth={1} />
          })}

          <path d={tokenPath} fill="none" stroke="var(--color-brand)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
          <path d={costPath} fill="none" stroke="#10b981" strokeWidth={2} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />

          {hoveredPoint && (
            <line x1={hoveredPoint.x} x2={hoveredPoint.x} y1={0} y2={height} stroke="var(--color-hairline)" strokeWidth={1} strokeDasharray="3 3" />
          )}

          {tokenPoints.map((p, i) => (
            <rect
              key={i}
              x={i === 0 ? 0 : p.x - WIDTH / data.length / 2}
              y={0}
              width={WIDTH / data.length}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx((cur) => (cur === i ? null : cur))}
            />
          ))}
        </svg>

        {hovered && hoveredPoint && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-hairline bg-surface px-2.5 py-1.5 text-xs shadow-lg space-y-0.5"
            style={{ left: `${(hoveredPoint.x / WIDTH) * 100}%`, top: 0 }}
          >
            <div className="font-mono text-subtle text-[10px]">{formatDate(hovered.date)}</div>
            <div className="font-semibold text-ink">{hovered.tokens.toLocaleString('vi-VN')} token</div>
            <div className="font-semibold text-emerald-600">${hovered.costUsd.toFixed(2)}</div>
            {hovered.errorsCount > 0 && <div className="font-semibold text-red-500">{hovered.errorsCount} lỗi</div>}
          </div>
        )}
      </div>
    </div>
  )
}

export default DualAxisChart
