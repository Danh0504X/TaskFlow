import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Clock, CreditCard, type LucideIcon } from 'lucide-react'
import { useAdminOverview } from '../hooks/useAdminOverview'
import AdminPageLayout from '../components/AdminPageLayout'
import AdminStatCard from '../components/AdminStatCard'
import AreaChart from '../components/AreaChart'
import { SectionCard, TableError, TableLoading } from '../components/TableStates'
import { formatDate } from '@/lib/format'
import type { AiAlertKind } from '../admin.types'

const ALERT_ICON: Record<AiAlertKind, LucideIcon> = { STUCK_PROCESSING: Clock, QUOTA_CAPPED: AlertTriangle }

const formatVnd = (amount: number) => `${amount.toLocaleString('vi-VN')} đ`

/** Việc cần admin xử lý ngay — gộp cảnh báo AI (kẹt xử lý, chạm trần quota) và giao dịch thanh
 * toán chờ duyệt thủ công vào 1 luồng duy nhất, có link đi thẳng tới trang liên quan. */
interface AttentionItem {
  id: string
  icon: LucideIcon
  message: string
  createdAt?: string
  to: string
}

const AdminOverviewPage = () => {
  const { data, isLoading, isError } = useAdminOverview()

  const attentionItems: AttentionItem[] = data
    ? [
        ...(data.pendingPayments > 0
          ? [
              {
                id: 'pending-payments',
                icon: CreditCard,
                message: `${data.pendingPayments} giao dịch thanh toán SePay đang chờ admin duyệt thủ công.`,
                to: '/admin/payments',
              },
            ]
          : []),
        ...data.alerts.map((alert) => ({
          id: alert.id,
          icon: ALERT_ICON[alert.kind],
          message: alert.message,
          createdAt: alert.createdAt,
          to: '/admin/ai',
        })),
      ]
    : []

  return (
    <AdminPageLayout title="Tổng quan" subtitle="Sức khoẻ hệ thống ở mức nhìn nhanh — không độn số liệu.">
      {isLoading && <TableLoading label="Đang tải số liệu tổng quan..." />}
      {isError && <TableError />}

      {data && (
        <>
          {/* Dải số liệu chính: quy mô + tăng trưởng user, doanh thu SePay tháng này. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AdminStatCard label="Tổng số user" value={data.totalUsers.toLocaleString('vi-VN')} staggerIndex={0} />
            <AdminStatCard label="User hoạt động 7 ngày qua" value={data.activeUsers7d.current} trend={data.activeUsers7d} staggerIndex={1} />
            <AdminStatCard
              label="Doanh thu tháng này"
              value={formatVnd(data.revenueThisMonth.current)}
              trend={data.revenueThisMonth}
              staggerIndex={2}
            />
          </div>

          {/* Cần chú ý: chỉ hiện khi có việc thật sự cần xử lý, giống tab Giám sát AI. */}
          {attentionItems.length > 0 && (
            <div className="space-y-2">
              {attentionItems.map((item, idx) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.id}
                    to={item.to}
                    className="animate-fade-up flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 transition-colors hover:bg-amber-500/15"
                    style={{ '--stagger': idx + 3 } as CSSProperties}
                  >
                    <Icon size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink">{item.message}</p>
                      {item.createdAt && <p className="text-[10px] text-subtle font-mono mt-0.5">{formatDate(item.createdAt)}</p>}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          <SectionCard className="p-5 animate-fade-up" style={{ '--stagger': attentionItems.length + 3 } as CSSProperties}>
            <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-4">Tăng trưởng user 30 ngày</h3>
            <AreaChart data={data.userGrowth30d} formatValue={(v) => `${v} user mới`} />
          </SectionCard>
        </>
      )}
    </AdminPageLayout>
  )
}

export default AdminOverviewPage
