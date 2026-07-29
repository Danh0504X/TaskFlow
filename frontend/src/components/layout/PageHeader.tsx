import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}

/**
 * Header dùng chung cho các trang cấp cao (Tổng quan / Dự án / Việc của tôi).
 * Đứng yên khi cuộn trang (sticky); nền lặp lại đúng gradient của AppBackground
 * bằng background-attachment: fixed nên khớp pixel-perfect với nền phía sau khi
 * cuộn thay vì "vá" ra một mảng màu lệch tông. Mỗi trang chỉ khác nhau ở
 * title/subtitle/actions truyền vào — phần khung, khoảng cách, kiểu chữ dùng chung.
 */
const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => (
  <header
    className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-8 md:px-12 pt-8 md:pt-10 pb-5 border-b border-hairline"
    style={{
      background: `radial-gradient(circle at 0% 0%, rgba(255,255,255,0.05) 0%, transparent 55%),
                  radial-gradient(circle at 100% 100%, rgba(255,255,255,0.03) 0%, transparent 55%),
                  #232326`,
      backgroundAttachment: 'fixed',
    }}
  >
    <div>
      <h2 className="font-editorial text-3xl font-medium text-ink tracking-tight">{title}</h2>
      {subtitle && <p className="text-muted mt-1.5 text-sm">{subtitle}</p>}
    </div>

    {actions && <div className="flex items-center gap-1.5 self-start sm:self-auto">{actions}</div>}
  </header>
)

export default PageHeader
