import { useState, type CSSProperties } from 'react'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import { formatDate } from '@/lib/format'
import { useAuditLog } from '../hooks/useAuditLog'
import AdminSelect from '../components/AdminSelect'
import AdminPageLayout from '../components/AdminPageLayout'
import Pagination from '../components/Pagination'
import { SectionCard, TableEmpty, TableError, TableLoading } from '../components/TableStates'
import { AUDIT_ACTION_COLOR, AUDIT_ACTION_LABEL } from '../audit.constants'
import type { AuditAction } from '../admin.types'

const LIMIT = 20

const AdminAuditPage = () => {
  const [action, setAction] = useState<AuditAction | ''>('')
  const [adminEmail, setAdminEmail] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useAuditLog({
    page,
    limit: LIMIT,
    action,
    adminEmail,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
  })

  const resetPage = () => setPage(1)

  return (
    <AdminPageLayout title="Nhật ký hệ thống" subtitle="Nhật ký chỉ đọc — mọi hành động nhạy cảm của admin đều được ghi lại, không thể xoá.">
      <SectionCard className="p-4 flex flex-wrap items-end gap-3">
        <AdminSelect
          label="Hành động"
          value={action}
          onChange={(e) => {
            setAction(e.target.value as AuditAction | '')
            resetPage()
          }}
        >
          <option value="">Tất cả</option>
          {(Object.keys(AUDIT_ACTION_LABEL) as AuditAction[]).map((a) => (
            <option key={a} value={a}>
              {AUDIT_ACTION_LABEL[a]}
            </option>
          ))}
        </AdminSelect>

        <Input
          label="Email admin thực hiện"
          placeholder="vd: admin@gmail.com"
          value={adminEmail}
          onChange={(e) => {
            setAdminEmail(e.target.value)
            resetPage()
          }}
          className="max-w-[220px]"
        />

        <Input
          label="Từ ngày"
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value)
            resetPage()
          }}
        />
        <Input
          label="Đến ngày"
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value)
            resetPage()
          }}
        />
      </SectionCard>

      {isLoading && <TableLoading label="Đang tải nhật ký hệ thống..." />}
      {isError && <TableError />}

      {data && (
        <SectionCard>
          {data.items.length === 0 ? (
            <TableEmpty title="Không có bản ghi nào khớp bộ lọc." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-hairline text-[10px] font-semibold text-subtle uppercase tracking-wider">
                    <th className="py-2.5 px-4">Thời gian</th>
                    <th className="py-2.5 px-4">Admin thực hiện</th>
                    <th className="py-2.5 px-4">Hành động</th>
                    <th className="py-2.5 px-4">Đối tượng</th>
                    <th className="py-2.5 px-4">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline text-[13px]">
                  {data.items.map((item, idx) => (
                    <tr
                      key={item._id}
                      className="animate-fade-up hover:bg-canvas/60 transition-colors"
                      style={{ '--stagger': idx } as CSSProperties}
                    >
                      <td className="py-2.5 px-4 font-mono text-xs text-subtle whitespace-nowrap">{formatDate(item.createdAt)}</td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-ink">{item.adminName}</div>
                        <div className="text-[11px] text-subtle font-mono">{item.adminEmail}</div>
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge color={AUDIT_ACTION_COLOR[item.action]}>{AUDIT_ACTION_LABEL[item.action]}</Badge>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs text-ink">{item.targetLabel}</td>
                      <td className="py-2.5 px-4 text-muted max-w-md">{item.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination page={page} limit={LIMIT} total={data.total} currentCount={data.items.length} onChange={setPage} />
        </SectionCard>
      )}
    </AdminPageLayout>
  )
}

export default AdminAuditPage
