import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'

export interface TabItem<T extends string> {
  value: T
  label: string
}

interface TabsProps<T extends string> {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  /** ID nhóm animation riêng cho từng bộ Tabs — tránh 2 bộ tab khác nhau cùng "dính" pill vào nhau
   * nếu lỡ mount đồng thời trên 1 trang. Mặc định dùng chung là đủ vì thường chỉ có 1 bộ Tabs/trang. */
  layoutGroupId?: string
}

/** Nhóm nút chuyển tab dạng pill dùng chung (filter danh sách, tab workspace...).
 * Pill nền trắng trượt mượt (spring) sang tab đang chọn thay vì đổi bg đột ngột. */
const Tabs = <T extends string>({ items, value, onChange, className, layoutGroupId = 'tabs-pill' }: TabsProps<T>) => {
  const reduceMotion = useReducedMotion()

  return (
    <div className={cn('flex gap-1.5 p-1.5 bg-slate-100/80 rounded-xl border border-line/30', className)}>
      {items.map((item) => {
        const isActive = value === item.value
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              'relative px-4 py-2 rounded-lg text-xs font-bold transition-colors',
              isActive ? 'text-brand' : 'text-muted hover:text-ink hover:bg-white/40',
            )}
          >
            {isActive && (
              <motion.span
                layoutId={layoutGroupId}
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default Tabs
