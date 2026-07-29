import { motion } from 'motion/react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { useAuthStore } from '@/features/auth/authStore'
import { fadeUpItem } from '@/lib/motion'

export function AvatarCard() {
  const user = useAuthStore((state) => state.user)

  if (!user) return null

  const isAdmin = user.role === 'admin'

  return (
    <motion.section
      variants={fadeUpItem}
      className="bg-surface border border-hairline rounded-lg p-6 flex flex-col items-center text-center"
    >
      <Avatar src={user.avatarUrl} name={user.fullName} size={88} className="ring-4 ring-brand/15" />
      <h3 className="text-base font-semibold text-ink mt-4">{user.fullName}</h3>
      <p className="text-subtle text-sm mt-0.5 truncate max-w-full">{user.email}</p>
      <Badge color={isAdmin ? 'blue' : 'slate'} className="mt-3">
        {isAdmin ? 'Quản trị viên' : 'Thành viên hệ thống'}
      </Badge>
    </motion.section>
  )
}
