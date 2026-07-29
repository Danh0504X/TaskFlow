import type { CSSProperties } from 'react'
import { useAdminOverview } from '../hooks/useAdminOverview'
import AdminPageLayout from '../components/AdminPageLayout'
import AdminStatCard from '../components/AdminStatCard'
import AreaChart from '../components/AreaChart'
import { SectionCard, TableError, TableLoading } from '../components/TableStates'

const AdminOverviewPage = () => {
  const { data, isLoading, isError } = useAdminOverview()

  return (
    <AdminPageLayout title="Tổng quan" subtitle="Sức khoẻ hệ thống ở mức nhìn nhanh — không độn số liệu.">
      {isLoading && <TableLoading label="Đang tải số liệu tổng quan..." />}
      {isError && <TableError />}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AdminStatCard label="User hoạt động 7 ngày qua" value={data.activeUsers7d.current} trend={data.activeUsers7d} staggerIndex={0} />
            <AdminStatCard
              label="Chi phí AI tháng này"
              value={`$${data.aiCostThisMonth.current.toFixed(2)}`}
              trend={data.aiCostThisMonth}
              invertTrendColor
              dangerAboveTrendPct={20}
              staggerIndex={1}
            />
          </div>

          <SectionCard className="p-5 animate-fade-up" style={{ '--stagger': 2 } as CSSProperties}>
            <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-4">Tăng trưởng user 30 ngày</h3>
            <AreaChart data={data.userGrowth30d} formatValue={(v) => `${v} user mới`} />
          </SectionCard>
        </>
      )}
    </AdminPageLayout>
  )
}

export default AdminOverviewPage
