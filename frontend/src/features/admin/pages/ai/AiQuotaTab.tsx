import { useMemo, useState, type CSSProperties } from 'react'
import { ArrowDown, ArrowUp, Ban, Eye, PauseCircle, PlayCircle, Settings2 } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Tabs from '@/components/ui/Tabs'
import { toast } from '@/components/ui/toast/toastStore'
import { useAiQuota, useSetAiEnabledGlobally, useSetUserAiDisabled, useSetUserQuotaLimit } from '../../hooks/useAiQuota'
import { SectionCard, TableEmpty, TableError, TableLoading } from '../../components/TableStates'
import type { AiLeaderboardRow, QuotaTimeframe } from '../../admin.types'

const TIMEFRAME_ITEMS: { value: QuotaTimeframe; label: string }[] = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: 'all', label: 'Toàn thời gian' },
]

type SortColumn = 'generations' | 'tokens' | 'costUsd' | 'acceptanceRate' | 'costPerIssue'
type SortDir = 'asc' | 'desc'

const costPerIssue = (row: AiLeaderboardRow) => (row.acceptedCount > 0 ? row.costUsd / row.acceptedCount : null)

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

const AiQuotaTab = () => {
  const [timeframe, setTimeframe] = useState<QuotaTimeframe>('30d')
  const [sortColumn, setSortColumn] = useState<SortColumn>('tokens')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [detailRow, setDetailRow] = useState<AiLeaderboardRow | null>(null)
  const [editQuotaRow, setEditQuotaRow] = useState<AiLeaderboardRow | null>(null)
  const [toggleDisableRow, setToggleDisableRow] = useState<AiLeaderboardRow | null>(null)
  const [globalToggleOpen, setGlobalToggleOpen] = useState(false)

  const { data, isLoading, isError } = useAiQuota(timeframe)
  const setGlobal = useSetAiEnabledGlobally()
  const setUserDisabled = useSetUserAiDisabled()

  const handleSort = (col: SortColumn) => {
    if (col === sortColumn) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else {
      setSortColumn(col)
      setSortDir('desc')
    }
  }

  const sortedRows = useMemo(() => {
    if (!data) return []
    const rows = [...data.rows]
    rows.sort((a, b) => {
      const va = sortColumn === 'costPerIssue' ? (costPerIssue(a) ?? -1) : a[sortColumn]
      const vb = sortColumn === 'costPerIssue' ? (costPerIssue(b) ?? -1) : b[sortColumn]
      return sortDir === 'desc' ? vb - va : va - vb
    })
    return rows
  }, [data, sortColumn, sortDir])

  const handleConfirmGlobalToggle = async () => {
    if (!data) return
    const next = !data.aiEnabledGlobally
    await setGlobal.mutateAsync(next)
    toast.success(next ? 'Đã bật lại AI cho toàn hệ thống.' : 'Đã tắt AI cho toàn hệ thống.')
    setGlobalToggleOpen(false)
  }

  const handleConfirmToggleDisable = async () => {
    if (!toggleDisableRow) return
    const next = !toggleDisableRow.aiDisabled
    await setUserDisabled.mutateAsync({ userId: toggleDisableRow.userId, disabled: next })
    toast.success(next ? `Đã tạm khoá AI của ${toggleDisableRow.userName}.` : `Đã mở lại AI cho ${toggleDisableRow.userName}.`)
    setToggleDisableRow(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Tabs items={TIMEFRAME_ITEMS} value={timeframe} onChange={setTimeframe} layoutGroupId="quota-timeframe-pill" className="w-fit" />

        {data && (
          <Button
            variant={data.aiEnabledGlobally ? 'danger' : 'secondary'}
            size="sm"
            onClick={() => setGlobalToggleOpen(true)}
          >
            {data.aiEnabledGlobally ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
            {data.aiEnabledGlobally ? 'Tắt AI toàn hệ thống' : 'Bật lại AI toàn hệ thống'}
          </Button>
        )}
      </div>

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
                    <SortHeader label="Chi phí" column="costUsd" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Chấp nhận" column="acceptanceRate" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="Chi phí/issue" column="costPerIssue" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} />
                    <th className="py-2.5 px-4">Quota hôm nay</th>
                    <th className="py-2.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline text-[13px]">
                  {sortedRows.map((row, idx) => {
                    const cpi = costPerIssue(row)
                    const acceptanceRedFlag = row.generations >= 10 && row.acceptanceRate < 0.2
                    return (
                      <tr
                        key={row.userId}
                        className="group animate-fade-up hover:bg-canvas/60 transition-colors"
                        style={{ '--stagger': idx } as CSSProperties}
                      >
                        <td className="py-2.5 px-4 font-mono text-xs text-subtle">{idx + 1}</td>
                        <td className="py-2.5 px-4">
                          <span className={row.userDeleted ? 'italic text-subtle' : 'font-semibold text-ink'}>{row.userName}</span>
                          {row.aiDisabled && (
                            <Badge color="amber" className="ml-2">
                              AI tạm khoá
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-xs text-subtle">{row.generations.toLocaleString('vi-VN')}</td>
                        <td className="py-2.5 px-4 font-mono text-xs text-subtle">{row.tokens.toLocaleString('vi-VN')}</td>
                        <td className="py-2.5 px-4 font-mono text-xs text-ink font-semibold">${row.costUsd.toFixed(2)}</td>
                        <td className={`py-2.5 px-4 font-semibold ${acceptanceRedFlag ? 'text-red-500' : 'text-ink'}`}>
                          {(row.acceptanceRate * 100).toFixed(0)}%
                        </td>
                        <td className="py-2.5 px-4 font-mono text-xs text-subtle">{cpi === null ? '—' : `$${cpi.toFixed(2)}`}</td>
                        <td className="py-2.5 px-4 font-mono text-xs text-subtle">
                          {row.quotaUsedToday}/{row.quotaLimitToday}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button
                              onClick={() => setDetailRow(row)}
                              className="p-1.5 text-muted hover:text-pastel-blue-ink hover:bg-pastel-blue rounded-md transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => setEditQuotaRow(row)}
                              disabled={row.userDeleted}
                              className="p-1.5 text-muted hover:text-pastel-blue-ink hover:bg-pastel-blue rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                              title="Chỉnh trần riêng"
                            >
                              <Settings2 size={15} />
                            </button>
                            <button
                              onClick={() => setToggleDisableRow(row)}
                              disabled={row.userDeleted}
                              className="p-1.5 text-muted hover:text-pastel-red-ink hover:bg-pastel-red rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                              title={row.aiDisabled ? 'Mở lại AI cho user này' : 'Tạm khoá AI của user này'}
                            >
                              <Ban size={15} />
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
      <Modal open={!!detailRow} onClose={() => setDetailRow(null)} title={detailRow ? `Chi tiết AI — ${detailRow.userName}` : ''}>
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
              <span className="text-[10px] font-semibold text-subtle uppercase tracking-wide">Chi phí</span>
              <p className="font-semibold text-ink">${detailRow.costUsd.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-subtle uppercase tracking-wide">Tỉ lệ chấp nhận</span>
              <p className="font-semibold text-ink">{(detailRow.acceptanceRate * 100).toFixed(0)}%</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-subtle uppercase tracking-wide">Chi phí/issue</span>
              <p className="font-semibold text-ink">{costPerIssue(detailRow) === null ? '—' : `$${costPerIssue(detailRow)!.toFixed(2)}`}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-subtle uppercase tracking-wide">Quota hôm nay</span>
              <p className="font-semibold text-ink">
                {detailRow.quotaUsedToday}/{detailRow.quotaLimitToday}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* key theo userId -> remount mỗi lần đổi dòng, tránh input giữ giá trị cũ của dòng trước. */}
      <EditQuotaModal key={editQuotaRow?.userId ?? 'none'} row={editQuotaRow} onClose={() => setEditQuotaRow(null)} />

      <ConfirmDialog
        open={!!toggleDisableRow}
        title={toggleDisableRow?.aiDisabled ? 'Mở lại AI cho user' : 'Tạm khoá AI của user'}
        message={
          toggleDisableRow?.aiDisabled
            ? `${toggleDisableRow?.userName} sẽ dùng lại được tính năng AI.`
            : `${toggleDisableRow?.userName} sẽ không thể dùng tính năng AI cho tới khi được mở lại.`
        }
        confirmText="Xác nhận"
        danger={!toggleDisableRow?.aiDisabled}
        loading={setUserDisabled.isPending}
        onClose={() => setToggleDisableRow(null)}
        onConfirm={handleConfirmToggleDisable}
      />

      <ConfirmDialog
        open={globalToggleOpen}
        title={data?.aiEnabledGlobally ? 'Tắt AI toàn hệ thống' : 'Bật lại AI toàn hệ thống'}
        message={
          data?.aiEnabledGlobally
            ? 'Toàn bộ tính năng AI (sinh epic/task/subtask) sẽ ngừng hoạt động cho mọi user cho tới khi được bật lại.'
            : 'Mọi user sẽ dùng lại được tính năng AI.'
        }
        confirmText="Xác nhận"
        danger={data?.aiEnabledGlobally}
        loading={setGlobal.isPending}
        onClose={() => setGlobalToggleOpen(false)}
        onConfirm={handleConfirmGlobalToggle}
      />
    </div>
  )
}

const EditQuotaModal = ({ row, onClose }: { row: AiLeaderboardRow | null; onClose: () => void }) => {
  const [value, setValue] = useState(row?.quotaLimitToday ?? 15)
  const mutation = useSetUserQuotaLimit()

  return (
    <Modal
      open={!!row}
      onClose={onClose}
      title={row ? `Chỉnh trần quota — ${row.userName}` : ''}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Huỷ
          </Button>
          <Button
            loading={mutation.isPending}
            onClick={async () => {
              if (!row) return
              await mutation.mutateAsync({ userId: row.userId, limit: value })
              toast.success(`Đã đổi trần quota của ${row.userName} thành ${value}/ngày.`)
              onClose()
            }}
          >
            Lưu
          </Button>
        </>
      }
    >
      {row && (
        <Input
          label="Trần lượt sinh AI mỗi ngày"
          type="number"
          min={0}
          max={100}
          defaultValue={row.quotaLimitToday}
          onChange={(e) => setValue(Number(e.target.value))}
        />
      )}
    </Modal>
  )
}

export default AiQuotaTab
