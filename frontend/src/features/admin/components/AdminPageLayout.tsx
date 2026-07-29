import type { ReactNode } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { cn } from '@/lib/cn'

interface AdminPageLayoutProps {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  /** Chèn ngay dưới PageHeader, trước vùng nội dung chính — dùng cho thanh tab con (vd 3 tab
   * của "Giám sát AI"). Chỉ AdminAiPage cần tới prop này. */
  headerExtra?: ReactNode
  children: ReactNode
}

/** Khung trang dùng chung cho MỌI trang trong khu Admin: cùng độ rộng tối đa, cùng lề ngang,
 * cùng khoảng cách trên/dưới — để đổi trang không bị "nhảy" bố cục do mỗi trang tự chọn
 * max-w/padding riêng. Mọi trang admin (AdminOverviewPage, AdminUsersPage, AdminAiPage,
 * AdminAuditPage, AdminSettingsPage) đều phải bọc nội dung bằng component này thay vì tự viết
 * lại wrapper + PageHeader. */
const AdminPageLayout = ({ title, subtitle, actions, headerExtra, children }: AdminPageLayoutProps) => (
  <div className="max-w-7xl mx-auto flex flex-col">
    <PageHeader title={title} subtitle={subtitle} actions={actions} />

    {headerExtra && <div className="px-8 md:px-12 pt-6">{headerExtra}</div>}

    <div className={cn('px-8 md:px-12 pb-12 space-y-5', headerExtra ? 'pt-5' : 'pt-6')}>{children}</div>
  </div>
)

export default AdminPageLayout
