import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AuthAurora from './AuthAurora'
import AuthBranding from './AuthBranding'

// Khung chung cho mọi trang auth: nền aurora nhiều màu chuyển động + branding bên trái,
// thẻ form phẳng bên phải. Mỗi trang chỉ cần truyền nội dung form vào `children`, phần còn
// lại giữ nguyên. Dùng AuthAurora riêng (không phải AppBackground chung toàn app) vì đây là
// trang "cửa ngõ" — cố tình cho phép nhiều màu sắc + chuyển động hơn phần còn lại của app.
const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <AuthAurora>
      <Link
        to="/"
        className="fixed left-5 top-5 z-20 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-ink"
      >
        <ArrowLeft size={16} />
        Trang chủ
      </Link>

      <div className="flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
        <main className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-y-12 font-sans md:grid-cols-12 md:gap-x-12 lg:gap-x-16">
          {/* Khung trái: branding + cụm thẻ trôi nổi (dùng chung) */}
          <AuthBranding />

          {/* Khung phải: thẻ form — dải màu mảnh phía trên nối form với tông màu của nền. */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto w-full max-w-[460px] overflow-hidden rounded-lg border border-hairline bg-surface md:col-span-5"
          >
            <div className="h-1 w-full bg-gradient-to-r from-[#8b5cf6] via-[#38bdf8] to-[#f472b6]" />
            <div className="flex flex-col space-y-6 p-7 sm:p-9">{children}</div>
          </motion.div>
        </main>
      </div>
    </AuthAurora>
  )
}

export default AuthLayout
