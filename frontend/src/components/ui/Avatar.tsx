import { cn } from '@/lib/cn'

interface AvatarProps {
  src?: string | null
  name: string
  size?: number
  className?: string
}

const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

/** Ảnh đại diện dùng chung: hiện ảnh nếu có, hoặc initials nếu không (assignee, member, profile...). */
const Avatar = ({ src, name, size = 20, className }: AvatarProps) => {
  const style = { width: size, height: size }

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={style}
        className={cn('rounded-full object-cover border border-white shadow-sm shrink-0', className)}
      />
    )
  }

  return (
    <div
      style={style}
      className={cn(
        'rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold shrink-0',
        className,
      )}
    >
      <span style={{ fontSize: size * 0.4 }}>{getInitials(name) || '?'}</span>
    </div>
  )
}

export default Avatar
