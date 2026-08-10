import { useMemo, useState, type CSSProperties } from 'react'
import { ArrowDown, ArrowUp, Eye } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Tabs from '@/components/ui/Tabs'
import { useAiQuota } from '../../hooks/useAiQuota'
import { SectionCard, TableEmpty, TableError, TableLoading } from '../../components/TableStates'
import type { AiLeaderboardRow, QuotaTimeframe } from '../../admin.types'

const TIMEFRAME_ITEMS: { value: QuotaTimeframe; label: string }[] = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: 'all', label: 'Toàn thời gian' },
]

type SortColumn = 'generations' | 'tokens' | 'acceptanceRate'
type SortDir = 'asc' | 'desc'

const SortHeader = ({
  label,
  column,
  sortColumn,
  sortDir,
  onSort,
}: {
  label: string
  column: SortColumn
  sortColumn: SortColumn
  sortDir: SortDir
  onSort: (c: SortColumn) => void
}) => (
  <th className="py-2.5 px-4">
    <button type="button" onClick={() => onSort(column)} className="flex items-center gap-1 hover:text-ink transition-colors">
      {label}
      {sortColumn === column && (sortDir === 'desc' ? <ArrowDown size={11} /> : <ArrowUp size={11} />)}
    </button>
  </th>
)

/** Bảng xếp hạng token/lượt sinh AI theo user — CHỈ đọc dữ liệu thật, không có thao tác kiểm
 * soát (khoá AI/user, trần quota riêng, tắt AI toàn hệ thống) — những việc đó cần thêm field +
 * logic chặn mới ở backend, để quyết định riêng, không thuộc phạm vi trang giám sát này. */
const AiQuotaTab = () => {
  const [timeframe, setTimeframe] = useState<QuotaTimeframe>('30d')
  const [sortColumn, setSortColumn] = useState<SortColumn>('tokens')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [detailRow, setDetailRow] = useState<AiLeaderboardRow | null>(null)

  const { data, isLoading, isError } = useAiQuota(timeframe)

  const handleSort = (col: SortColumn) => {
    if (col === sortColumn) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else {
      setSortColumn(col)
      setSortDir('desc')
    }
  }

  const sortedRows = useMemo(() => {
    if (!data) return []
    const rows = [...data]
    rows.sort((a, b) => {
      const va = a[sortColumn]
      const vb = b[sortColumn]
      return sortDir === 'desc' ? vb - va : va - vb
    })
    return rows
  }, [data, sortColumn, sortDir])

  return (
    <div className="space-y-4">
      <Tabs items={TIMEFRAME_ITEMS} value={timeframe} onChange={setTimeframe} layoutGroupId="quota-timeframe-pill" className="w-fit" />

      {isLoading && <TableLoading label="Đang tải bảng hạn mức..." />}
      {isError && <TableError />}

      {data && (
        <SectionCard>
          {sortedRows.length === 0 ? (
            <TableEmpty title="Chưa có dữ liệu sử dụng AI trong khoảng thời gian này." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-hairline text-[10px] font-semibold text-subtle uppercase tracking-wider">
                    <th className="py-2.5 px-4 w-10">#</th>
                    <th className="py-2.5 px-4">User</th>
                    <SortHeader label="Lượt sinh" column="generations" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Token" column="tokens" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Chấp nhận" column="acceptanceRate" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} />
                    <th className="py-2.5 px-4">Quota hôm nay</th>
                    <th className="py-2.5 px-4 text-right">·</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline text-[13px]">
                  {sortedRows.map((row, idx) => {
                    const acceptanceRedFlag = row.generations >= 10 && row.acceptanceRate < 0.2
                    return (
                      <tr
                        key={row.userId}
                        className="group animate-fade-up hover:bg-canvas/60 transition-colors"
                        style={{ '--stagger': idx } as CSSProperties}
                      >
                        <td className="py-2.5 px-4 font-mono text-xs text-subtle">{idx + 1}</td>
                        <td className="py-2.5 px-4">
                          <span className={row.userDeleted ? 'italic text-subtle' : 'font-semibold text-ink'}>
                            {row.userName ?? 'Tài khoản đã xoá'}
                          </span>
                          {row.isPro && (
                            <Badge color="blue" className="ml-2">
                              PRO
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-xs text-subtle">{row.generations.toLocaleString('vi-VN')}</td>
                        <td className="py-2.5 px-4 font-mono text-xs text-subtle">{row.tokens.toLocaleString('vi-VN')}</td>
                        <td className={`py-2.5 px-4 font-semibold ${acceptanceRedFlag ? 'text-red-500' : 'text-ink'}`}>
                          {(row.acceptanceRate * 100).toFixed(0)}%
                        </td>
                        <td className="py-2.5 px-4 font-mono text-xs text-subtle">
                          {row.isPro ? 'Vô hạn' : `${row.quotaUsedToday}/${row.quotaLimitToday}`}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button
                              onClick={() => setDetailRow(row)}
                              className="p-1.5 text-muted hover:text-pastel-blue-ink hover:bg-pastel-blue rounded-md transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* Chi tiết 1 dòng — chỉ số AI, không phải hồ sơ tài khoản. */}
      <Modal open={!!detailRow} onClose={() => setDetailRow(null)} title={detailRow ? `Chi tiết AI — ${detailRow.userName ?? 'Tài khoản đã xoá'}` : ''}>
        {detailRow && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-[10px] font-semibold text-subtle uppercase tracking-wide">Lượt sinh</span>
              <p className="font-semibold text-ink">{detailRow.generations.toLocaleString('vi-VN')}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-subtle uppercase tracking-wide">Token</span>
              <p className="font-semibold text-ink">{detailRow.tokens.toLocaleString('vi-VN')}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-subtle uppercase tracking-wide">Tỉ lệ chấp nhận</span>
              <p className="font-semibold text-ink">{(detailRow.acceptanceRate * 100).toFixed(0)}%</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-subtle uppercase tracking-wide">Draft đã chấp nhận</span>
              <p className="font-semibold text-ink">{detailRow.acceptedCount.toLocaleString('vi-VN')}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-subtle uppercase tracking-wide">Quota hôm nay</span>
              <p className="font-semibold text-ink">
                {detailRow.isPro ? 'Vô hạn (PRO)' : `${detailRow.quotaUsedToday}/${detailRow.quotaLimitToday}`}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AiQuotaTab
