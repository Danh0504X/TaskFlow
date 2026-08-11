import User from '../models/users.js'
import UpgradeTransaction from '../models/UpgradeTransaction.js'
import { adminAiService } from './adminAiService.js'

// [Admin] Tổng quan hệ thống — gộp 3 mảng: Người dùng, Doanh thu (SePay), Cảnh báo AI. Mọi con
// số tính trực tiếp trên dữ liệu thật tại thời điểm gọi (không có counter lưu sẵn), cùng cách
// adminAiService đang làm, nên luôn khớp dữ liệu gốc.

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)

/** Đầu tháng dương lịch, UTC — dùng để so doanh thu tháng này với tháng trước. */
const startOfMonth = (monthsAgo = 0) => {
  const d = new Date()
  d.setUTCDate(1)
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCMonth(d.getUTCMonth() - monthsAgo)
  return d
}

const getOverview = async () => {
  const since7d = daysAgo(7)
  const since14d = daysAgo(14)
  const since30d = daysAgo(30)
  const thisMonthStart = startOfMonth(0)
  const lastMonthStart = startOfMonth(1)

  const [
    totalUsers,
    activeUsers7d,
    activeUsersPrev7d,
    userGrowthAgg,
    revenueThisMonthAgg,
    revenueLastMonthAgg,
    pendingPayments,
    alerts,
  ] = await Promise.all([
    User.countDocuments(),
    // "Hoạt động" = có gọi ít nhất 1 API cần đăng nhập trong khoảng thời gian (lastActiveAt, cập
    // nhật ở protectedRoute) — khác createdAt (ngày đăng ký), phản ánh đúng user đang thật sự dùng app.
    User.countDocuments({ lastActiveAt: { $gte: since7d } }),
    // 7 ngày liền trước đó (14d -> 7d) làm mốc so sánh cho trend, cùng khoảng ngày với kỳ hiện tại.
    User.countDocuments({ lastActiveAt: { $gte: since14d, $lt: since7d } }),

    User.aggregate([
      { $match: { createdAt: { $gte: since30d } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } }, count: { $sum: 1 } } },
    ]),

    // Doanh thu = tổng amount của giao dịch đã PAID thật (khớp trạng thái paymentService dùng),
    // không tính PENDING/UNMATCHED/CANCELLED.
    UpgradeTransaction.aggregate([
      { $match: { status: 'PAID', createdAt: { $gte: thisMonthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    UpgradeTransaction.aggregate([
      { $match: { status: 'PAID', createdAt: { $gte: lastMonthStart, $lt: thisMonthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),

    // Giao dịch lỗi/chưa khớp đang chờ admin xử lý thủ công — cùng điều kiện với
    // paymentService.getPendingResolutions().
    UpgradeTransaction.countDocuments({ resolutionStatus: 'MANUAL_PENDING' }),

    adminAiService.getAiAlerts(),
  ])

  // Điền đủ 30 ngày kể cả ngày không có user mới (=0) để trục thời gian trên chart không co giãn
  // sai — $group ở trên chỉ trả về ngày THẬT SỰ có user mới.
  const growthMap = new Map(userGrowthAgg.map((d) => [d._id, d.count]))
  const userGrowth30d = []
  for (let i = 29; i >= 0; i -= 1) {
    const dateStr = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    userGrowth30d.push({ date: dateStr, value: growthMap.get(dateStr) || 0 })
  }

  return {
    totalUsers,
    activeUsers7d: { current: activeUsers7d, previous: activeUsersPrev7d },
    userGrowth30d,
    revenueThisMonth: { current: revenueThisMonthAgg[0]?.total || 0, previous: revenueLastMonthAgg[0]?.total || 0 },
    pendingPayments,
    alerts,
  }
}

export const adminOverviewService = {
  getOverview,
}
