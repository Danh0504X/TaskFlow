import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import AppBackground from '@/components/layout/AppBackground'
import AuthBranding from './AuthBranding'

// Khung chung cho mọi trang auth: nền + branding/robot bên trái, thẻ form glass bên phải.
// Mỗi trang chỉ cần truyền nội dung form vào `children`, phần còn lại giữ nguyên.
const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <AppBackground>
      <div className="flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
        <main className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-y-12 font-sans md:grid-cols-12 md:gap-x-12 lg:gap-x-16">
          {/* Khung trái: branding + robot (dùng chung) */}
          <AuthBranding />

          {/* Khung phải: thẻ form (glassmorphism) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto flex w-full max-w-[460px] flex-col space-y-6 rounded-[28px] border border-white/10 bg-surface/40 p-7 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-9 md:col-span-5"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </AppBackground>
  )
}

export default AuthLayout
