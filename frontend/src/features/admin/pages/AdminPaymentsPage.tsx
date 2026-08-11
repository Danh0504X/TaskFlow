import { useState, useEffect, type CSSProperties } from 'react'
import { Search, Check, Filter, ShieldCheck, UserCheck } from 'lucide-react'
import AdminPageLayout from '../components/AdminPageLayout'
import PageHeaderButton from '@/components/layout/PageHeaderButton'
import Tabs, { type TabItem } from '@/components/ui/Tabs'
import AdminSelect from '../components/AdminSelect'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import { SectionCard, TableEmpty, TableError, TableLoading } from '../components/TableStates'
import { toast } from '@/components/ui/toast/toastStore'
import { paymentApi, type WebhookLogItem } from '@/features/payment/payment.api'

type PaymentsTab = 'pending' | 'webhook_logs'

export function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState<PaymentsTab>('pending')

  // Data
  const [pendingTxList, setPendingTxList] = useState<any[]>([])
  const [unhandledCount, setUnhandledCount] = useState<number>(0)
  const [webhookLogs, setWebhookLogs] = useState<WebhookLogItem[]>([])
  const [logFilterStatus, setLogFilterStatus] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [isError, setIsError] = useState<boolean>(false)

  // Modal Xử lý thủ công (PAY-09)
  const [selectedTx, setSelectedTx] = useState<any | null>(null)
  const [userQuery, setUserQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [daysToAdd, setDaysToAdd] = useState<number>(30)
  const [adminNote, setAdminNote] = useState<string>('')
  const [referenceCode, setReferenceCode] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false)

  useEffect(() => {
    fetchData()
  }, [activeTab, logFilterStatus])

  const fetchData = async () => {
    setLoading(true)
    setIsError(false)
    try {
      if (activeTab === 'pending') {
        const res = await paymentApi.getAdminPendingResolutions()
        setPendingTxList(res.transactions || [])
        setUnhandledCount(res.unhandledCount || 0)
      } else {
        const res = await paymentApi.getAdminWebhookLogs(logFilterStatus)
        setWebhookLogs(res.logs || [])
        setUnhandledCount(res.unmatchedCount || 0)
      }
    } catch (err) {
      console.error('Failed to fetch admin payment data:', err)
      setIsError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchUser = async (q: string) => {
    setUserQuery(q)
    if (!q.trim()) {
      setSearchResults([])
      return
    }
    try {
      const res = await paymentApi.searchUsers(q)
      setSearchResults(res || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleOpenResolveModal = (tx?: any) => {
    setSelectedTx(tx || null)
    setSelectedUser(tx?.userId || null)
    setUserQuery(tx?.userId?.email || '')
    setSearchResults([])
    setDaysToAdd(30)
    setAdminNote(tx ? `Admin duyệt đơn lỗi #${tx.paymentCode}` : '')
    setReferenceCode(tx?.referenceCode || '')
    setIsManualModalOpen(true)
  }

  const handleSubmitResolve = async () => {
    if (!selectedUser) {
      toast.error('Vui lòng chọn tài khoản người dùng cần cấp/gỡ PRO.')
      return
    }
    if (!adminNote.trim()) {
      toast.error('Bắt buộc phải nhập lý do xử lý (PAY-09).')
      return
    }

    try {
      setSubmitting(true)
      await paymentApi.resolveTransactionManually({
        transactionId: selectedTx?._id,
        userId: selectedUser._id,
        daysToAdd: Number(daysToAdd),
        adminNote: adminNote.trim(),
        referenceCode: referenceCode.trim(),
      })
      toast.success('Đã xử lý thủ công thành công.')
      setIsManualModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xử lý thủ công.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const tabItems: TabItem<PaymentsTab>[] = [
    { value: 'pending', label: unhandledCount > 0 ? `Đơn lỗi chờ xử lý (${unhandledCount})` : 'Đơn lỗi chờ xử lý' },
    { value: 'webhook_logs', label: 'Nhật ký webhook SePay' },
  ]

  return (
    <AdminPageLayout
      title="Quản trị thanh toán & webhook"
      subtitle="Đối soát các giao dịch lỗi, duyệt 1-click và cấp/gỡ gói PRO thủ công."
      actions={
        <PageHeaderButton icon={UserCheck} variant="primary" onClick={() => handleOpenResolveModal()}>
          Cấp / gỡ PRO thủ công
        </PageHeaderButton>
      }
      headerExtra={<Tabs items={tabItems} value={activeTab} onChange={setActiveTab} layoutGroupId="payments-subtabs-pill" className="w-fit" />}
    >
      {activeTab === 'pending' ? (
        /* TAB 1: DANH SÁCH ĐƠN LỖI CHỜ XỬ LÝ */
        <SectionCard>
          <div className="flex items-center justify-between p-4 border-b border-hairline">
            <span className="text-xs text-subtle">
              Danh sách các giao dịch chuyển sai nội dung, chuyển thiếu tiền hoặc cần đối soát.
            </span>
            <Button variant="secondary" size="sm" onClick={fetchData}>
              Làm mới
            </Button>
          </div>

          {loading && <TableLoading label="Đang tải danh sách đơn lỗi..." />}
          {!loading && isError && <TableError />}
          {!loading && !isError && pendingTxList.length === 0 && (
            <TableEmpty title="Không có giao dịch lỗi nào cần xử lý." description="Mọi giao dịch SePay gần đây đều đã khớp tự động." />
          )}

          {!loading && !isError && pendingTxList.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-hairline text-[10px] font-semibold text-subtle uppercase tracking-wider">
                    <th className="py-2.5 px-4">Mã đơn gốc</th>
                    <th className="py-2.5 px-4">Khách hàng</th>
                    <th className="py-2.5 px-4">Số tiền</th>
                    <th className="py-2.5 px-4">Ghi chú sự cố</th>
                    <th className="py-2.5 px-4">Mã tham chiếu</th>
                    <th className="py-2.5 px-4">Thời gian</th>
                    <th className="py-2.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline text-[13px]">
                  {pendingTxList.map((tx, idx) => (
                    <tr key={tx._id} className="animate-fade-up hover:bg-canvas/60 transition-colors" style={{ '--stagger': idx } as CSSProperties}>
                      <td className="py-2.5 px-4 font-mono font-bold text-ink">{tx.paymentCode}</td>
                      <td className="py-2.5 px-4">
                        {tx.userId ? (
                          <div>
                            <p className="font-semibold text-ink">{tx.userId.fullName}</p>
                            <p className="text-[11px] text-subtle">{tx.userId.email}</p>
                          </div>
                        ) : (
                          <Badge color="red">Chưa gán user</Badge>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-ink">{tx.amount?.toLocaleString('vi-VN')} đ</td>
                      <td className="py-2.5 px-4 text-pastel-red-ink font-medium">{tx.adminNote || 'Chờ đối soát'}</td>
                      <td className="py-2.5 px-4 font-mono text-subtle">{tx.referenceCode || '—'}</td>
                      <td className="py-2.5 px-4 font-mono text-xs text-subtle">{formatDate(tx.createdAt)}</td>
                      <td className="py-2.5 px-4 text-right">
                        <Button size="sm" onClick={() => handleOpenResolveModal(tx)}>
                          <ShieldCheck size={13} /> Duyệt 1-click
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      ) : (
        /* TAB 2: NHẬT KÝ WEBHOOK LOGS (PAY-08) */
        <SectionCard>
          <div className="flex items-center justify-between p-4 border-b border-hairline">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-subtle" />
              <AdminSelect value={logFilterStatus} onChange={(e) => setLogFilterStatus(e.target.value)}>
                <option value="">Tất cả kết quả</option>
                <option value="UNMATCHED">Chưa / không khớp (UNMATCHED)</option>
                <option value="MATCHED">Khớp đơn chuẩn (MATCHED)</option>
                <option value="FAILED_AUTH">Lỗi Auth (FAILED_AUTH)</option>
              </AdminSelect>
            </div>

            <span className="text-xs text-subtle">Hiển thị số tài khoản dạng che (BR-21, ví dụ: 098****123)</span>
          </div>

          {loading && <TableLoading label="Đang tải nhật ký webhook..." />}
          {!loading && isError && <TableError />}
          {!loading && !isError && webhookLogs.length === 0 && (
            <TableEmpty title="Không có nhật ký webhook nào." description="Thử đổi bộ lọc kết quả." />
          )}

          {!loading && !isError && webhookLogs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-hairline text-[10px] font-semibold text-subtle uppercase tracking-wider">
                    <th className="py-2.5 px-4">Thời gian</th>
                    <th className="py-2.5 px-4">Kết quả</th>
                    <th className="py-2.5 px-4">Số tiền</th>
                    <th className="py-2.5 px-4">Nội dung chuyển khoản gốc</th>
                    <th className="py-2.5 px-4">Mã tham chiếu NH</th>
                    <th className="py-2.5 px-4">STK người gửi (BR-21)</th>
                    <th className="py-2.5 px-4">Đơn đã khớp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline text-[13px]">
                  {webhookLogs.map((log, idx) => (
                    <tr key={log._id} className="animate-fade-up hover:bg-canvas/60 transition-colors" style={{ '--stagger': idx } as CSSProperties}>
                      <td className="py-2.5 px-4 font-mono text-xs text-subtle">{formatDate(log.createdAt)}</td>
                      <td className="py-2.5 px-4">
                        <Badge color={log.resultStatus === 'MATCHED' ? 'green' : 'red'}>{log.resultStatus}</Badge>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-ink">{log.amount?.toLocaleString('vi-VN')} đ</td>
                      <td className="py-2.5 px-4 font-mono text-[11px]">{log.contentRaw || '—'}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-subtle">{log.bankReferenceCode || '—'}</td>
                      <td className="py-2.5 px-4 font-mono text-subtle">{log.maskedAccountNumber || '—'}</td>
                      <td className="py-2.5 px-4 font-mono text-ink">{log.matchedTransactionId?.paymentCode || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* MODAL CẤP / GỠ PRO THỦ CÔNG (PAY-09) */}
      <Modal
        open={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Cấp / gỡ gói PRO thủ công"
        tone="premium"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsManualModalOpen(false)} disabled={submitting}>
              Huỷ bỏ
            </Button>
            <Button onClick={handleSubmitResolve} loading={submitting}>
              Xác nhận cấp / gỡ PRO
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Tìm kiếm chọn tài khoản */}
          <div>
            <label className="block text-subtle font-semibold mb-1.5">1. Tìm & chọn tài khoản người dùng</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
              <input
                type="text"
                value={userQuery}
                onChange={(e) => handleSearchUser(e.target.value)}
                placeholder="Gõ email hoặc tên người dùng..."
                className="w-full pl-9 pr-3 py-2 bg-canvas border border-hairline rounded-lg text-xs focus:ring-2 focus:ring-brand/20 outline-none transition-colors"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="mt-1.5 border border-hairline rounded-lg bg-surface max-h-36 overflow-y-auto divide-y divide-hairline">
                {searchResults.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => {
                      setSelectedUser(u)
                      setUserQuery(u.email)
                      setSearchResults([])
                    }}
                    className="p-2.5 hover:bg-canvas cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-ink">{u.fullName}</p>
                      <p className="text-[11px] text-subtle">{u.email}</p>
                    </div>
                    <Badge color={u.plan === 'PRO' ? 'amber' : 'slate'}>{u.plan}</Badge>
                  </div>
                ))}
              </div>
            )}

            {selectedUser && (
              <div className="mt-1.5 p-2.5 bg-pastel-green text-pastel-green-ink rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-semibold">{selectedUser.fullName}</p>
                  <p className="text-[11px] opacity-80">{selectedUser.email}</p>
                </div>
                <Check size={16} />
              </div>
            )}
          </div>

          {/* Số ngày PRO (Hỗ trợ ngày âm để gỡ PRO) */}
          <div>
            <Input
              label="2. Số ngày PRO (nhập số âm để gỡ quyền)"
              type="number"
              value={daysToAdd}
              onChange={(e) => setDaysToAdd(Number(e.target.value))}
              className="font-mono"
              placeholder="30 (hoặc -30 để gỡ)"
            />
            <span className="text-[11px] text-subtle mt-1 block">
              Ví dụ: 30 = cộng thêm 30 ngày PRO · -30 = trừ 30 ngày PRO (gỡ quyền)
            </span>
          </div>

          {/* Mã tham chiếu giao dịch */}
          <Input
            label="3. Mã tham chiếu giao dịch / ngân hàng (nếu có)"
            type="text"
            value={referenceCode}
            onChange={(e) => setReferenceCode(e.target.value)}
            className="font-mono"
            placeholder="Ví dụ: FT24080912345"
          />

          {/* Bắt buộc Lý do xử lý */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              4. Lý do xử lý <span className="text-red-500">(bắt buộc)</span>
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-line/40 bg-surface px-3 py-2 text-sm text-ink transition placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand/30"
              placeholder="Nhập lý do chi tiết..."
            />
          </div>
        </div>
      </Modal>
    </AdminPageLayout>
  )
}
