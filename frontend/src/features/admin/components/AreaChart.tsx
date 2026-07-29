import { useMemo, useState } from 'react'
import { formatDate } from '@/lib/format'

interface AreaChartPoint {
  date: string
  value: number
}

interface AreaChartProps {
  data: AreaChartPoint[]
  height?: number
  formatValue?: (value: number) => string
  xLabelEvery?: number
  color?: string
}

const WIDTH = 960

/** Biểu đồ area đơn giản vẽ bằng SVG inline — không phụ thuộc thư viện biểu đồ.
 * Có lưới ngang mờ, nhãn trục X thưa, tooltip khi rê chuột theo cột gần nhất. */
const AreaChart = ({ data, height = 220, formatValue = (v) => String(v), xLabelEvery = 5, color = 'var(--color-brand)' }: AreaChartProps) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const { linePath, areaPath, points, maxValue, minValue } = useMemo(() => {
    if (data.length === 0) {
      return { linePath: '', areaPath: '', points: [] as { x: number; y: number }[], maxValue: 0, minValue: 0 }
    }
    const values = data.map((d) => d.value)
    const max = Math.max(...values, 1)
    const min = Math.min(...values, 0)
    const range = max - min || 1
    const stepX = WIDTH / Math.max(data.length - 1, 1)
    const pts = data.map((d, i) => ({
      x: i * stepX,
      y: height - ((d.value - min) / range) * (height - 24) - 8,
    }))
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${height} L 0 ${height} Z`
    return { linePath: line, areaPath: area, points: pts, maxValue: max, minValue: min }
  }, [data, height])

  if (data.length === 0) return null

  const gridLines = 4
  const hovered = hoverIdx !== null ? data[hoverIdx] : null
  const hoveredPoint = hoverIdx !== null ? points[hoverIdx] : null

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${WIDTH} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="admin-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const y = (height / gridLines) * i
          return <line key={i} x1={0} x2={WIDTH} y1={y} y2={y} stroke="var(--color-hairline)" strokeWidth={1} />
        })}

        <path d={areaPath} fill="url(#admin-area-fill)" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />

        {hoveredPoint && (
          <>
            <line x1={hoveredPoint.x} x2={hoveredPoint.x} y1={0} y2={height} stroke="var(--color-hairline)" strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r={4} fill={color} stroke="var(--color-canvas)" strokeWidth={2} />
          </>
        )}

        {/* Lớp bắt sự kiện chuột: chia đều theo số điểm dữ liệu. */}
        {points.map((p, i) => (
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
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-hairline bg-surface px-2.5 py-1.5 text-xs shadow-lg"
          style={{
            left: `${(hoveredPoint.x / WIDTH) * 100}%`,
            top: Math.max(0, hoveredPoint.y - 54),
          }}
        >
          <div className="font-mono text-subtle text-[10px]">{formatDate(hovered.date)}</div>
          <div className="font-semibold text-ink">{formatValue(hovered.value)}</div>
        </div>
      )}

      <div className="flex justify-between mt-1.5 px-0.5">
        {data.map((d, i) =>
          i % xLabelEvery === 0 ? (
            <span key={i} className="text-[10px] font-medium text-subtle">
              {formatDate(d.date).slice(0, 5)}
            </span>
          ) : null,
        )}
      </div>

      <div className="sr-only">
        Giá trị nhỏ nhất {formatValue(minValue)}, lớn nhất {formatValue(maxValue)}
      </div>
    </div>
  )
}

export default AreaChart
