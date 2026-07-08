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
}

/** Nhóm nút chuyển tab dạng pill dùng chung (filter danh sách, tab workspace...). */
const Tabs = <T extends string>({ items, value, onChange, className }: TabsProps<T>) => {
  return (
    <div className={cn('flex gap-1.5 p-1.5 bg-slate-100/80 rounded-xl border border-line/30', className)}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={cn(
            'px-4 py-2 rounded-lg text-xs font-bold transition-all',
            value === item.value
              ? 'bg-white text-brand shadow-sm'
              : 'text-muted hover:text-ink hover:bg-white/40',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export default Tabs
