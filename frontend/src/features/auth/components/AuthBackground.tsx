import { useState } from 'react'
import { motion } from 'motion/react'
import type { CSSProperties, MouseEvent, ReactNode } from 'react'

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

// Nền động cho các trang auth: gradient chạy theo con trỏ chuột + các hạt particle bay.
// Tách riêng để page chỉ tập trung vào nội dung, và có thể tái dùng cho trang auth khác.
const AuthBackground = ({ children }: { children: ReactNode }) => {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })

  // Theo dõi chuột để cập nhật tâm gradient nền.
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x, y })
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
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
      {/* Lớp particle floating phía sau nội dung */}
      <div className="pointer-events-none absolute inset-0 z-0">
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

      {children}
    </div>
  )
}

export default AuthBackground
