import type { ReactNode } from 'react'

/**
 * Nền tĩnh dùng chung cho toàn bộ app: một lớp gradient nhạt, cố định theo viewport
 * (`fixed inset-0`) nên luôn phủ kín trang dù nội dung cuộn dài tới đâu.
 * Cố tình KHÔNG có particle bay hay theo dõi chuột — đây là dashboard thao tác hàng
 * ngày (board, bảng dữ liệu), nền động liên tục gây nhiễu thị giác và tốn hiệu năng
 * hơn là mang lại giá trị. Giữ một chút sắc thương hiệu (brand) rất nhạt là đủ.
 */
const AppBackground = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{
          background: `radial-gradient(circle at 0% 0%, #f3effc 0%, transparent 55%),
                      radial-gradient(circle at 100% 100%, #fdf2f8 0%, transparent 55%),
                      #fafafa`,
        }}
      />

      <div className="relative z-10">{children}</div>
    </>
  )
}

export default AppBackground
