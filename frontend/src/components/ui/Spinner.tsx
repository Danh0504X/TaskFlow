import { cn } from '@/lib/cn'

interface SpinnerProps {
  className?: string
}

/** Vòng xoay loading dùng chung. Màu kế thừa từ `currentColor`. */
const Spinner = ({ className }: SpinnerProps) => {
  return (
    <span
      role="status"
      aria-label="Đang tải"
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
    />
  )
}

export default Spinner
