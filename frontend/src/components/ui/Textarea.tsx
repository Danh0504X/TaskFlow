import type { TextareaHTMLAttributes, Ref } from 'react'
import { cn } from '@/lib/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  ref?: Ref<HTMLTextAreaElement>
}

/** Ô textarea dùng chung, kèm label + hiển thị lỗi validate. */
const Textarea = ({ label, error, className, id, ref, ...rest }: TextareaProps) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={id}
        ref={ref}
        aria-invalid={!!error}
        className={cn(
          'min-h-[88px] resize-y rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition placeholder:text-slate-400 focus:outline-none focus:ring-2',
          error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-slate-300 focus:ring-blue-500',
          className,
        )}
        {...rest}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default Textarea
