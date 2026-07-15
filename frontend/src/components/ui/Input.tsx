import type { InputHTMLAttributes, Ref } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  /** Thông báo lỗi validate; có giá trị -> viền đỏ + hiện text dưới input. */
  error?: string
  // React 19: nhận ref như một prop thường (react-hook-form register cần ref này).
  ref?: Ref<HTMLInputElement>
}

/** Ô input dùng chung, kèm label + hiển thị lỗi validate. */
const Input = ({ label, error, className, id, ref, ...rest }: InputProps) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        aria-invalid={!!error}
        className={cn(
          'rounded-xl border bg-white px-3 py-2 text-sm text-ink transition placeholder:text-subtle focus:outline-none focus:ring-2',
          error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-line/40 focus:ring-brand/30',
          className,
        )}
        {...rest}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default Input
