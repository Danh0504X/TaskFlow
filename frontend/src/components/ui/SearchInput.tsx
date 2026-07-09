import type { InputHTMLAttributes } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  containerClassName?: string
}

/** Ô tìm kiếm dùng chung (icon kính lúp + input), dùng cho toolbar của Board/List/... */
const SearchInput = ({ containerClassName, className, ...rest }: SearchInputProps) => {
  return (
    <div className={cn('relative w-full', containerClassName)}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
      <input
        type="text"
        className={cn(
          'w-full bg-slate-50 border border-line/20 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold focus:ring-2 focus:ring-brand/20 outline-none transition-all placeholder:text-subtle',
          className,
        )}
        {...rest}
      />
    </div>
  )
}

export default SearchInput
