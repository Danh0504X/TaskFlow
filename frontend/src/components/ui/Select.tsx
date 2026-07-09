import type { SelectHTMLAttributes, Ref } from 'react'
import { cn } from '@/lib/cn'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  ref?: Ref<HTMLSelectElement>
}

/** Dropdown chọn 1 giá trị, kèm label + hiển thị lỗi validate. */
const Select = ({
  label,
  error,
  options,
  className,
  id,
  ref,
  ...rest
}: SelectProps) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={id}
        ref={ref}
        aria-invalid={!!error}
        className={cn(
          'rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition focus:outline-none focus:ring-2',
          error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-slate-300 focus:ring-blue-500',
          className,
        )}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default Select
