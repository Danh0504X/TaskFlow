import { motion } from 'motion/react'
import { CheckCircle2 } from 'lucide-react'
import { APP_LOGO_URL } from '@/lib/constants'

interface FloatCard {
  title: string
  meta: string
  accentBg: string
  accentText: string
  top: string
  left: string
  rotate: number
  floatDuration: number
  delay: number
}

// Cụm thẻ công việc mock trôi nổi — thay cho icon robot AI cũ, vừa cho màu sắc (khớp bộ pastel
// dùng cho priority/status badge thật trong app) vừa "khoe" trực quan sản phẩm là gì.
const floatCards: FloatCard[] = [
  {
    title: 'Thiết kế màn hình đăng nhập',
    meta: 'WEB-12 · Task',
    accentBg: 'bg-pastel-blue',
    accentText: 'text-pastel-blue-ink',
    top: '2%',
    left: '0%',
    rotate: -6,
    floatDuration: 5,
    delay: 0.3,
  },
  {
    title: 'Chuẩn bị demo Sprint 4',
    meta: 'WEB-08 · Epic',
    accentBg: 'bg-pastel-yellow',
    accentText: 'text-pastel-yellow-ink',
    top: '0%',
    left: '54%',
    rotate: 5,
    floatDuration: 6,
    delay: 0.6,
  },
  {
    title: 'Sửa lỗi đồng bộ dữ liệu',
    meta: 'WEB-21 · Bug',
    accentBg: 'bg-pastel-red',
    accentText: 'text-pastel-red-ink',
    top: '56%',
    left: '14%',
    rotate: -4,
    floatDuration: 5.5,
    delay: 0.9,
  },
]

// Cụm branding dùng chung cho mọi trang auth: logo + wordmark gradient + cụm thẻ công việc
// bay lơ lửng. Tách riêng để 3 trang (register/login/verify) chia sẻ y hệt phần nền & hero.
const AuthBranding = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center text-center md:col-span-7 md:items-start md:text-left"
    >
      <div className="flex flex-col items-center space-y-5 md:items-start">
        <img
          alt="TaskFlow AI Logo"
          className="h-16 w-16 object-contain md:h-20 md:w-20"
          src={APP_LOGO_URL}
        />
        <h1 className="font-editorial bg-gradient-to-r from-[#c4b5fd] via-[#93c5fd] to-[#f9a8d4] bg-clip-text text-[40px] font-medium leading-[1.1] tracking-tight text-transparent sm:text-[48px] lg:text-[56px]">
          TaskFlow AI
        </h1>
        <p className="max-w-md text-base leading-relaxed text-muted sm:text-lg">
          Quản lý dự án và công việc nhóm rõ ràng, gọn gàng, đúng tiến độ.
        </p>
      </div>

      {/* Hero: cụm thẻ công việc bay lơ lửng, mỗi thẻ tự trôi lên xuống độc lập. */}
      <div className="relative mt-14 h-[300px] w-full max-w-lg md:mt-16 md:h-[340px]">
        {floatCards.map((card) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, y: [0, -14, 0] }}
            transition={{
              opacity: { duration: 0.6, delay: card.delay, ease: [0.16, 1, 0.3, 1] },
              scale: { duration: 0.6, delay: card.delay, ease: [0.16, 1, 0.3, 1] },
              y: { duration: card.floatDuration, repeat: Infinity, ease: 'easeInOut', delay: card.delay + 0.6 },
            }}
            style={{ top: card.top, left: card.left, rotate: card.rotate }}
            className="absolute w-56 rounded-lg border border-hairline bg-surface p-3.5 shadow-xl shadow-black/30"
          >
            <span
              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${card.accentBg} ${card.accentText}`}
            >
              {card.meta}
            </span>
            <p className="mt-2 text-xs font-medium leading-snug text-ink">{card.title}</p>
          </motion.div>
        ))}

        {/* Thẻ trạng thái nhỏ, tạo cảm giác "đang hoạt động" thật. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
          transition={{
            opacity: { duration: 0.6, delay: 1.2 },
            scale: { duration: 0.6, delay: 1.2 },
            y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1.8 },
          }}
          style={{ top: '74%', left: '48%' }}
          className="absolute flex items-center gap-2 rounded-full border border-hairline bg-surface px-3.5 py-2 shadow-xl shadow-black/30"
        >
          <CheckCircle2 size={14} className="text-pastel-green-ink" />
          <span className="text-[11px] font-semibold text-ink whitespace-nowrap">12 việc đã hoàn thành hôm nay</span>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default AuthBranding
