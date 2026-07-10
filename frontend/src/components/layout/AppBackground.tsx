import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

// 20 hạt particle với thông số ngẫu nhiên. Tính 1 lần khi load module (ngoài
// component) — KHÔNG dùng Math.random lúc render (React 19 cấm gọi hàm không
// thuần khi render; particle chỉ là trang trí tĩnh nên dùng chung cho mọi lần mount).
const PARTICLES = Array.from({ length: 20 }).map((_, i) => ({
  id: i,
  size: Math.random() * 60 + 20,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  delay: Math.random() * 5,
  duration: Math.random() * 10 + 10,
}))

/**
 * Nền động dùng chung cho toàn bộ app: gradient chạy theo con trỏ chuột + các hạt
 * particle bay. Lớp nền `fixed inset-0` theo viewport nên luôn phủ kín trang dù nội
 * dung cuộn dài tới đâu (khác với trước đây chỉ dùng riêng cho trang auth).
 * Theo dõi chuột qua `window` (không phải bounding rect của 1 container) để toạ độ
 * luôn đúng theo viewport thật, không lệch khi trang cuộn hoặc children không phủ hết màn hình.
 */
const AppBackground = ({ children }: { children: ReactNode }) => {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={
          {
            '--mouse-x': `${mousePos.x}%`,
            '--mouse-y': `${mousePos.y}%`,
            background: `radial-gradient(circle at var(--mouse-x, 0%) var(--mouse-y, 0%), rgba(107, 56, 212, 0.15) 0%, transparent 40%),
                        radial-gradient(circle at 0% 0%, #e9ddff 0%, transparent 50%),
                        radial-gradient(circle at 100% 100%, #ffd8ed 0%, transparent 50%),
                        radial-gradient(circle at 50% 50%, #f8f9ff 0%, #f8f9ff 100%)`,
          } as CSSProperties
        }
      >
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-brand-glow/20"
            style={{ width: p.size, height: p.size, left: p.left, top: p.top }}
            animate={{
              y: [0, -100, 0],
              x: [0, 50, 0],
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="relative z-10">{children}</div>
    </>
  )
}

export default AppBackground
