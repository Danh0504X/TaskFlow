import { useState, type CSSProperties } from 'react'
import { Eye } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import { formatDate } from '@/lib/format'
import { useAiLogs } from '../../hooks/useAiLogs'
import AiLogDetailModal from '../../components/AiLogDetailModal'
import AdminSelect from '../../components/AdminSelect'
import Pagination from '../../components/Pagination'
import { SectionCard, TableEmpty, TableError, TableLoading } from '../../components/TableStates'
import { AI_STATUS_COLOR, AI_STATUS_LABEL, AI_TYPE_LABEL } from '../../ai.constants'
import { allNormalUsersForFilter } from '../../mock/ai.mock'
import type { AiGenerationLog, AiGenerationStatus, AiGenerationType } from '../../admin.types'

const LIMIT = 20

const AiLogsTab = () => {
  const [status, setStatus] = useState<AiGenerationStatus | ''>('')
  const [type, setType] = useState<AiGenerationType | ''>('')
  const [userId, setUserId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [detailLog, setDetailLog] = useState<AiGenerationLog | null>(null)

  const { data, isLoading, isError } = useAiLogs({
    page,
    limit: LIMIT,
    status,
    type,
    userId,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
  })

  const resetPage = () => setPage(1)

  return (
    <div className="space-y-4">
      <SectionCard className="p-4 flex flex-wrap items-end gap-3">
        <AdminSelect
          label="Trạng thái"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as AiGenerationStatus | '')
            resetPage()
          }}
        >
          <option value="">Tất cả</option>
          <option value="PROCESSING">Đang xử lý</option>
          <option value="COMPLETED">Hoàn tất</option>
          <option value="FAILED">Thất bại</option>
        </AdminSelect>

        <AdminSelect
          label="Loại"
          value={type}
          onChange={(e) => {
            setType(e.target.value as AiGenerationType | '')
            resetPage()
          }}
        >
          <option value="">Tất cả</option>
          <option value="REQ_TO_EPIC">{AI_TYPE_LABEL.REQ_TO_EPIC}</option>
          <option value="EPIC_TO_TASK">{AI_TYPE_LABEL.EPIC_TO_TASK}</option>
          <option value="TASK_TO_SUBTASK">{AI_TYPE_LABEL.TASK_TO_SUBTASK}</option>
        </AdminSelect>

        <AdminSelect
          label="Người dùng"
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value)
            resetPage()
          }}
          className="max-w-[180px]"
        >
          <option value="">Tất cả</option>
          {allNormalUsersForFilter.map((u) => (
            <option key={u._id} value={u._id}>
              {u.fullName}
            </option>
          ))}
        </AdminSelect>

        <Input
          label="Từ ngày"
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value)
            resetPage()
          }}
          className="!py-2"
        />
        <Input
          label="Đến ngày"
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value)
            resetPage()
          }}
          className="!py-2"
        />
      </SectionCard>

      {isLoading && <TableLoading label="Đang tải nhật ký sinh..." />}
      {isError && <TableError />}

      {data && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <SectionCard className="px-3.5 py-2.5">
              <span className="text-[10px] font-semibold text-subtle uppercase tracking-wide">p95 thời gian xử lý</span>
              <p className="text-sm font-bold text-ink">{(data.p95ProcessingTimeMs / 1000).toFixed(1)}s</p>
            </SectionCard>

            {data.errorGroups.length > 0 && (
              <SectionCard className="px-3.5 py-2.5 flex-1 min-w-[240px]">
                <span className="text-[10px] font-semibold text-subtle uppercase tracking-wide">Lỗi gộp nhóm</span>
                <p className="text-xs font-semibold text-ink mt-0.5">
                  {data.errorGroups.map((g) => `${g.message} ×${g.count}`).join(' · ')}
                </p>
              </SectionCard>
            )}
          </div>

          <SectionCard>
            {data.logs.length === 0 ? (
              <TableEmpty title="Không có nhật ký nào khớp bộ lọc." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-hairline text-[10px] font-semibold text-subtle uppercase tracking-wider">
                      <th className="py-2.5 px-4">Thời gian</th>
                      <th className="py-2.5 px-4">Người dùng</th>
                      <th className="py-2.5 px-4">Loại</th>
                      <th className="py-2.5 px-4">Trạng thái</th>
                      <th className="py-2.5 px-4">Draft</th>
                      <th className="py-2.5 px-4">Chấp nhận</th>
                      <th className="py-2.5 px-4">Token</th>
                      <th className="py-2.5 px-4">Xử lý</th>
                      <th className="py-2.5 px-4">Model</th>
                      <th className="py-2.5 px-4 text-right">·</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline text-[13px]">
                    {data.logs.map((log, idx) => (
                      <tr
                        key={log._id}
                        className="group animate-fade-up hover:bg-canvas/60 transition-colors"
                        style={{ '--stagger': idx } as CSSProperties}
                      >
                        <td className="py-2.5 px-4 font-mono text-xs text-subtle">{formatDate(log.createdAt)}</td>
                        <td className="py-2.5 px-4 text-ink">{log.userName}</td>
                        <td className="py-2.5 px-4 text-muted">{AI_TYPE_LABEL[log.type]}</td>
                        <td className="py-2.5 px-4">
                          <Badge color={AI_STATUS_COLOR[log.status]}>{AI_STATUS_LABEL[log.status]}</Badge>
                        </td>
                        <td className="py-2.5 px-4 text-muted">{log.draftCount || '—'}</td>
                        <td className="py-2.5 px-4 text-muted">{log.acceptedCount || '—'}</td>
                        <td className="py-2.5 px-4 font-mono text-xs text-subtle">{log.tokenCount.toLocaleString('vi-VN')}</td>
                        <td className="py-2.5 px-4 font-mono text-xs text-subtle">
                          {log.processingTimeMs > 0 ? `${(log.processingTimeMs / 1000).toFixed(1)}s` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-muted text-xs">{log.model}</td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => setDetailLog(log)}
                            className="p-1.5 text-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-pastel-blue-ink hover:bg-pastel-blue rounded-md transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination page={page} limit={LIMIT} total={data.total} currentCount={data.logs.length} onChange={setPage} />
          </SectionCard>
        </>
      )}

      <AiLogDetailModal log={detailLog} onClose={() => setDetailLog(null)} />
    </div>
  )
}

export default AiLogsTab
