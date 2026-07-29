import type { ReactNode } from 'react'
import { motion } from 'motion/react'

// Quầng màu lớn, mờ, trôi chậm — tạo chiều sâu + màu sắc cho riêng cụm trang auth (không
// dùng cho AppBackground chung toàn app vì các trang sau đăng nhập cố tình giữ tĩnh/trung
// tính). 4 quầng phủ 4 góc, mỗi quầng 1 màu + nhịp trôi riêng để không bao giờ đồng bộ.
const blobs = [
  { color: 'rgba(139,92,246,0.32)', size: 560, top: '-12%', left: '2%', duration: 19 },
  { color: 'rgba(56,189,248,0.24)', size: 460, top: '52%', left: '62%', duration: 23 },
  { color: 'rgba(244,114,182,0.2)', size: 420, top: '60%', left: '4%', duration: 21 },
  { color: 'rgba(52,211,153,0.18)', size: 380, top: '2%', left: '68%', duration: 26 },
]

const AuthAurora = ({ children }: { children: ReactNode }) => (
  <>
    <div className="pointer-events-none fixed inset-0 overflow-hidden bg-canvas">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            background: b.color,
            filter: 'blur(110px)',
          }}
          animate={{ x: [0, 50, -30, 0], y: [0, -40, 25, 0], scale: [1, 1.12, 0.94, 1] }}
          transition={{ duration: b.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Lưới điểm rất mờ phủ toàn trang — thêm kết cấu mà không cạnh tranh với nội dung. */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
    </div>

    <div className="relative z-10">{children}</div>
  </>
)

export default AuthAurora
