import type { ReactNode } from 'react'

/**
 * Nền tĩnh dùng chung cho toàn bộ app: warm charcoal (#18181b) với 2 quầng sáng tím rất nhạt
 * ở góc để giữ chút bản sắc thương hiệu, cố định theo viewport (`fixed inset-0`) nên luôn phủ
 * kín trang dù nội dung cuộn dài tới đâu. Cố tình KHÔNG có particle bay hay theo dõi chuột —
 * đây là dashboard thao tác hàng ngày, nền động liên tục gây nhiễu thị giác hơn là giá trị.
 */
const AppBackground = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{
          background: `radial-gradient(circle at 0% 0%, rgba(255,255,255,0.05) 0%, transparent 55%),
                      radial-gradient(circle at 100% 100%, rgba(255,255,255,0.03) 0%, transparent 55%),
                      #232326`,
        }}
      />

      <div className="relative z-10">{children}</div>
    </>
  )
}

export default AppBackground
