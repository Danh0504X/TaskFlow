import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Check,
  Filter,
  ShieldCheck,
  FileText,
  UserCheck,
} from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import { paymentApi, type WebhookLogItem } from '@/features/payment/payment.api'

export function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'webhook_logs'>('pending')

  // Data
  const [pendingTxList, setPendingTxList] = useState<any[]>([])
  const [unhandledCount, setUnhandledCount] = useState<number>(0)
  const [webhookLogs, setWebhookLogs] = useState<WebhookLogItem[]>([])
  const [logFilterStatus, setLogFilterStatus] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

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
    setDaysToAdd(30)
    setAdminNote(tx ? `Admin duyệt đơn lỗi #${tx.paymentCode}` : '')
    setReferenceCode(tx?.referenceCode || '')
    setIsManualModalOpen(true)
  }

  const handleSubmitResolve = async () => {
    if (!selectedUser) {
      alert('Vui lòng chọn tài khoản người dùng cần cấp/gỡ PRO!')
      return
    }
    if (!adminNote.trim()) {
      alert('Bắt buộc phải nhập Lý do xử lý (PAY-09)!')
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
      alert('Đã xử lý thủ công thành công!')
      setIsManualModalOpen(false)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xử lý thủ công.')
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

  return (
    <div className="max-w-7xl mx-auto flex flex-col space-y-6">
      <PageHeader
        title="Quản trị Thanh toán & Webhook Log"
        subtitle="Đối soát các giao dịch lỗi, duyệt 1-click và cấp/gỡ gói PRO thủ công."
      />

      {/* Nav Tabs với Badge chỉ báo số đơn chưa khớp (PAY-08 item 4) */}
      <div className="px-8 flex items-center justify-between border-b border-hairline">
        <div className="flex gap-6 text-sm">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-3 font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'border-brand text-brand'
                : 'border-transparent text-subtle hover:text-ink'
            }`}
          >
            <AlertTriangle size={16} /> Đơn Lỗi Chờ Xử Lý
            {unhandledCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                {unhandledCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('webhook_logs')}
            className={`py-3 font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'webhook_logs'
                ? 'border-brand text-brand'
                : 'border-transparent text-subtle hover:text-ink'
            }`}
          >
            <FileText size={16} /> Nhật ký Webhook SePay (Logs)
          </button>
        </div>

        <button
          onClick={() => handleOpenResolveModal()}
          className="py-2 px-3 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <UserCheck size={14} /> Cấp / Gỡ PRO Thủ Công (PAY-09)
        </button>
      </div>

      {/* Tab Content */}
      <div className="px-8 pb-12">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-subtle">
            <RefreshCw size={24} className="animate-spin text-brand" />
            <span className="text-xs">Đang tải dữ liệu quản trị...</span>
          </div>
        ) : activeTab === 'pending' ? (
          /* TAB 1: DANH SÁCH ĐƠN LỖI CHỜ XỬ LÝ */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-subtle">
                Danh sách các giao dịch chuyển sai nội dung, chuyển thiếu tiền hoặc cần đối soát.
              </span>
              <button
                onClick={fetchData}
                className="p-1.5 text-subtle hover:text-ink transition-colors rounded-lg border border-hairline bg-surface"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {pendingTxList.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-hairline rounded-2xl bg-canvas text-subtle space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
                <p className="text-xs font-medium">Không có giao dịch lỗi nào cần xử lý!</p>
              </div>
            ) : (
              <div className="border border-hairline rounded-2xl overflow-hidden bg-surface shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-canvas border-b border-hairline text-subtle uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">Mã đơn gốc</th>
                      <th className="p-3">Khách hàng</th>
                      <th className="p-3">Số tiền</th>
                      <th className="p-3">Ghi chú sự cố</th>
                      <th className="p-3">Mã tham chiếu</th>
                      <th className="p-3">Thời gian</th>
                      <th className="p-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {pendingTxList.map((tx) => (
                      <tr key={tx._id} className="hover:bg-canvas/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-600">{tx.paymentCode}</td>
                        <td className="p-3">
                          {tx.userId ? (
                            <div>
                              <p className="font-semibold text-ink">{tx.userId.fullName}</p>
                              <p className="text-[10px] text-subtle">{tx.userId.email}</p>
                            </div>
                          ) : (
                            <span className="text-red-500 italic text-[11px]">Chưa gán User</span>
                          )}
                        </td>
                        <td className="p-3 font-semibold">{tx.amount?.toLocaleString('vi-VN')} đ</td>
                        <td className="p-3 text-red-500 font-medium">{tx.adminNote || 'Chờ đối soát'}</td>
                        <td className="p-3 font-mono text-subtle">{tx.referenceCode || '—'}</td>
                        <td className="p-3 text-subtle">{formatDate(tx.createdAt)}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleOpenResolveModal(tx)}
                            className="py-1.5 px-3 bg-brand text-white font-medium text-[11px] rounded-lg shadow-sm hover:bg-brand/90 cursor-pointer transition-all inline-flex items-center gap-1"
                          >
                            <ShieldCheck size={13} /> Duyệt 1-Click
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: NHẬT KÝ WEBHOOK LOGS (PAY-08) */
          <div className="space-y-4">
            {/* Bộ lọc ResultStatus */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Filter size={14} className="text-subtle" />
                <span className="text-subtle font-medium">Lọc theo kết quả:</span>
                <select
                  value={logFilterStatus}
                  onChange={(e) => setLogFilterStatus(e.target.value)}
                  className="px-3 py-1.5 bg-surface border border-hairline rounded-xl text-xs font-semibold text-ink"
                >
                  <option value="">Tất cả kết quả</option>
                  <option value="UNMATCHED">🔴 Chưa / Không khớp (UNMATCHED)</option>
                  <option value="MATCHED">🟢 Khớp đơn chuẩn (MATCHED)</option>
                  <option value="FAILED_AUTH">⚠️ Lỗi Auth (FAILED_AUTH)</option>
                </select>
              </div>

              <span className="text-xs text-subtle">
                Hiển thị số tài khoản dạng che (BR-21, ví dụ: 098****123)
              </span>
            </div>

            <div className="border border-hairline rounded-2xl overflow-hidden bg-surface shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas border-b border-hairline text-subtle uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Thời gian</th>
                    <th className="p-3">Kết quả</th>
                    <th className="p-3">Số tiền</th>
                    <th className="p-3">Nội dung chuyển khoản gốc</th>
                    <th className="p-3">Mã tham chiếu NH</th>
                    <th className="p-3">STK người gửi (BR-21)</th>
                    <th className="p-3">Đơn đã khớp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {webhookLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-canvas/50 transition-colors">
                      <td className="p-3 text-subtle">{formatDate(log.createdAt)}</td>
                      <td className="p-3">
                        {log.resultStatus === 'MATCHED' ? (
                          <span className="text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                            MATCHED
                          </span>
                        ) : (
                          <span className="text-red-600 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                            UNMATCHED
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-ink">{log.amount?.toLocaleString('vi-VN')} đ</td>
                      <td className="p-3 font-mono text-[11px]">{log.contentRaw || '—'}</td>
                      <td className="p-3 font-mono text-[11px] text-subtle">{log.bankReferenceCode || '—'}</td>
                      <td className="p-3 font-mono text-subtle">{log.maskedAccountNumber || '—'}</td>
                      <td className="p-3 font-mono text-amber-600">
                        {log.matchedTransactionId?.paymentCode || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CẤP / GỠ PRO THỦ CÔNG (PAY-09) */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-surface border border-hairline rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 text-ink">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck size={20} className="text-brand" /> Cấp / Gỡ Gói PRO Thủ Công (PAY-09)
            </h3>

            <div className="space-y-3 text-xs">
              {/* Tìm kiếm chọn tài khoản */}
              <div>
                <label className="block text-subtle font-semibold mb-1">
                  1. Tìm & Chọn tài khoản người dùng:
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-subtle" />
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => handleSearchUser(e.target.value)}
                    placeholder="Gõ email hoặc tên người dùng..."
                    className="w-full pl-9 pr-3 py-2 bg-canvas border border-hairline rounded-xl text-xs"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-1 border border-hairline rounded-xl bg-surface max-h-36 overflow-y-auto divide-y divide-hairline">
                    {searchResults.map((u) => (
                      <div
                        key={u._id}
                        onClick={() => {
                          setSelectedUser(u)
                          setUserQuery(u.email)
                          setSearchResults([])
                        }}
                        className="p-2 hover:bg-brand/10 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold">{u.fullName}</p>
                          <p className="text-[10px] text-subtle">{u.email}</p>
                        </div>
                        <span className="text-[10px] font-bold bg-canvas px-2 py-0.5 rounded-md">
                          {u.plan}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedUser && (
                  <div className="mt-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-emerald-600">{selectedUser.fullName}</p>
                      <p className="text-[10px] text-subtle">{selectedUser.email}</p>
                    </div>
                    <Check size={16} className="text-emerald-500" />
                  </div>
                )}
              </div>

              {/* Số ngày PRO (Hỗ trợ ngày âm để gỡ PRO) */}
              <div>
                <label className="block text-subtle font-semibold mb-1">
                  2. Số ngày PRO (Nhập số âm để gỡ quyền):
                </label>
                <input
                  type="number"
                  value={daysToAdd}
                  onChange={(e) => setDaysToAdd(Number(e.target.value))}
                  className="w-full p-2 bg-canvas border border-hairline rounded-xl text-xs font-mono"
                  placeholder="30 (hoặc -30 để gỡ)"
                />
                <span className="text-[10px] text-subtle mt-0.5 block">
                  Ví dụ: 30 = Cộng thêm 30 ngày PRO | -30 = Trừ 30 ngày PRO (gỡ quyền)
                </span>
              </div>

              {/* Mã tham chiếu giao dịch */}
              <div>
                <label className="block text-subtle font-semibold mb-1">
                  3. Mã tham chiếu giao dịch / Ngân hàng (Nếu có):
                </label>
                <input
                  type="text"
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  className="w-full p-2 bg-canvas border border-hairline rounded-xl text-xs font-mono"
                  placeholder="Ví dụ: FT24080912345"
                />
              </div>

              {/* Bắt buộc Lý do xử lý */}
              <div>
                <label className="block text-subtle font-semibold mb-1">
                  4. Lý do xử lý <strong className="text-red-500">(Bắt buộc)</strong>:
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={2}
                  className="w-full p-2 bg-canvas border border-hairline rounded-xl text-xs"
                  placeholder="Nhập lý do chi tiết..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="px-4 py-2 border border-hairline rounded-xl text-xs text-subtle hover:text-ink cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSubmitResolve}
                disabled={submitting}
                className="px-5 py-2 bg-brand hover:bg-brand/90 text-white font-medium text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Đang cập nhật...' : 'Xác nhận Cấp / Gỡ PRO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
