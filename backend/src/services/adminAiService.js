import AiGeneration from '../models/aiGenerations.js'
import AiDraftIssue from '../models/aiDraftIssues.js'
import User from '../models/users.js'
import { aiEnv } from '../modules/ai/config/aiEnv.js'

// [Admin] Giám sát AI — CHỈ đọc dữ liệu thật (AiGeneration/AiDraftIssue), không có counter
// riêng, không có $ chi phí (hệ thống không lưu giá tiền, chỉ có token — bịa giá sẽ sai khi
// provider đổi bảng giá). Chỉ tính trên REQ_TO_EPIC/EPIC_TO_TASK ("nội dung thật") cho các số
// liệu chất lượng (tỉ lệ lỗi/chấp nhận/phễu/theo-loại) — CLARIFY là bước phụ trợ, không có draft
// nên không có ý nghĩa "chấp nhận"; nhưng vẫn tính CLARIFY vào biểu đồ token/ngày và vào
// quotaUsedToday vì nó tốn token thật và tính vào hạn mức thật (khớp checkAiLimit.js).
const CONTENT_TYPES = ['REQ_TO_EPIC', 'EPIC_TO_TASK']
const AI_TYPE_LABEL = { REQ_TO_EPIC: 'Yêu cầu → Epic', EPIC_TO_TASK: 'Epic → Task' }
const STUCK_PROCESSING_MINUTES = 10
const TIMEFRAME_DAYS = { '7d': 7, '30d': 30, all: null }

const startOfTodayUtc = () => {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)

const isProUser = (user) =>
  !!(user?.plan === 'PRO' && user?.currentPlanExpiresAt && new Date(user.currentPlanExpiresAt) > new Date())

/**
 * Cảnh báo AI cần admin chú ý ngay: lượt sinh kẹt ở PROCESSING quá lâu, user chạm trần quota hôm
 * nay. Tách riêng khỏi getOverview() để trang Tổng quan (dashboard toàn hệ thống) gọi được mà
 * không phải tính kèm phễu/theo loại/token 30 ngày — những phần chỉ tab AI mới cần.
 */
const getAiAlerts = async () => {
  const today = startOfTodayUtc()

  const [stuckProcessing, quotaCappedGroups] = await Promise.all([
    AiGeneration.find({
      status: 'PROCESSING',
      updatedAt: { $lt: new Date(Date.now() - STUCK_PROCESSING_MINUTES * 60 * 1000) },
    })
      .select('_id requestedBy updatedAt')
      .populate('requestedBy', 'fullName')
      .sort({ updatedAt: 1 })
      .limit(5)
      .lean(),

    AiGeneration.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: '$requestedBy', count: { $sum: 1 } } },
      { $match: { count: { $gte: aiEnv.AI_DAILY_LIMIT } } },
    ]),
  ])

  // PRO còn hạn không thật sự bị chặn (checkAiLimit bỏ qua) -> loại khỏi cảnh báo "chạm trần",
  // kẻo báo nhầm cho user không hề bị ảnh hưởng.
  const cappedUserIds = quotaCappedGroups.map((r) => r._id).filter(Boolean)
  const cappedUsers = await User.find({ _id: { $in: cappedUserIds } }).select('plan currentPlanExpiresAt').lean()
  const cappedCount = cappedUsers.filter((u) => !isProUser(u)).length

  const alerts = []
  stuckProcessing.forEach((g) => {
    const minutesAgo = Math.round((Date.now() - new Date(g.updatedAt).getTime()) / 60000)
    alerts.push({
      id: `stuck-${g._id}`,
      kind: 'STUCK_PROCESSING',
      message: `1 lượt sinh của ${g.requestedBy?.fullName || 'user đã xoá'} đang kẹt ở PROCESSING hơn ${minutesAgo} phút.`,
      createdAt: g.updatedAt,
    })
  })
  if (cappedCount > 0) {
    alerts.push({
      id: 'quota-capped-today',
      kind: 'QUOTA_CAPPED',
      message: `${cappedCount} user đã chạm trần quota AI hôm nay và đang bị chặn tạo thêm.`,
      createdAt: new Date().toISOString(),
    })
  }
  return alerts
}

/**
 * Số liệu tab "Tổng quan" — mọi con số tính trực tiếp trên AiGeneration/AiDraftIssue tại thời
 * điểm gọi, không lưu sẵn (giống cách getAiUsageToday đang làm), nên luôn khớp dữ liệu gốc.
 */
const getOverview = async () => {
  const today = startOfTodayUtc()
  const since7d = daysAgo(7)
  const since30d = daysAgo(30)

  const [
    generationsToday,
    errorStats7d,
    funnelGenerations30d,
    funnelDrafts30d,
    byTypeAgg,
    daily30dAgg,
    alerts,
  ] = await Promise.all([
    AiGeneration.countDocuments({ generationType: { $in: CONTENT_TYPES }, createdAt: { $gte: today } }),

    AiGeneration.aggregate([
      { $match: { generationType: { $in: CONTENT_TYPES }, createdAt: { $gte: since7d } } },
      { $group: { _id: null, total: { $sum: 1 }, failed: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } } } },
    ]),

    AiGeneration.countDocuments({ generationType: { $in: CONTENT_TYPES }, status: 'COMPLETED', createdAt: { $gte: since30d } }),

    AiDraftIssue.aggregate([
      { $match: { createdAt: { $gte: since30d } } },
      { $group: { _id: null, total: { $sum: 1 }, accepted: { $sum: { $cond: [{ $eq: ['$status', 'ACCEPTED'] }, 1, 0] } } } },
    ]),

    // $lookup draft của từng generation TRƯỚC khi group theo loại, để ra được tỉ lệ chấp nhận
    // riêng cho từng loại (REQ_TO_EPIC vs EPIC_TO_TASK) trong cùng 1 lượt truy vấn.
    AiGeneration.aggregate([
      { $match: { generationType: { $in: CONTENT_TYPES }, createdAt: { $gte: since30d } } },
      { $lookup: { from: 'ai_draft_issues', localField: '_id', foreignField: 'generationId', as: 'drafts' } },
      {
        $group: {
          _id: '$generationType',
          count: { $sum: 1 },
          avgTokens: { $avg: '$tokensUsed' },
          totalDrafts: { $sum: { $size: '$drafts' } },
          acceptedDrafts: { $sum: { $size: { $filter: { input: '$drafts', cond: { $eq: ['$$this.status', 'ACCEPTED'] } } } } },
        },
      },
    ]),

    AiGeneration.aggregate([
      { $match: { createdAt: { $gte: since30d } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
          tokens: { $sum: '$tokensUsed' },
          errorsCount: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } },
        },
      },
    ]),

    getAiAlerts(),
  ])

  const errRow = errorStats7d[0] || { total: 0, failed: 0 }
  const draftRow30d = funnelDrafts30d[0] || { total: 0, accepted: 0 }

  const byType = CONTENT_TYPES.map((type) => {
    const row = byTypeAgg.find((r) => r._id === type)
    return {
      type,
      label: AI_TYPE_LABEL[type],
      count: row?.count || 0,
      avgTokens: Math.round(row?.avgTokens || 0),
      acceptanceRate: row?.totalDrafts ? row.acceptedDrafts / row.totalDrafts : 0,
    }
  })

  // Điền đủ 30 ngày (kể cả ngày không có hoạt động = 0) để trục thời gian trên biểu đồ không bị
  // co giãn sai khi có ngày trống — $group ở trên chỉ trả về ngày THẬT SỰ có dữ liệu.
  const dailyMap = new Map(daily30dAgg.map((d) => [d._id, d]))
  const daily30d = []
  for (let i = 29; i >= 0; i -= 1) {
    const dateStr = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    const row = dailyMap.get(dateStr)
    daily30d.push({ date: dateStr, tokens: row?.tokens || 0, errorsCount: row?.errorsCount || 0 })
  }

  return {
    generationsToday,
    errorRate7d: errRow.total ? errRow.failed / errRow.total : 0,
    acceptanceRate7d: draftRow30d.total ? draftRow30d.accepted / draftRow30d.total : 0,
    funnel: [
      { label: 'Lượt sinh', value: funnelGenerations30d },
      { label: 'Draft', value: draftRow30d.total },
      { label: 'Chấp nhận', value: draftRow30d.accepted },
    ],
    byType,
    daily30d,
    alerts,
  }
}

/**
 * Bảng xếp hạng token/lượt sinh theo user trong 1 khung thời gian — cùng cách đếm trực tiếp trên
 * AiGeneration như getAiUsageToday (checkAiLimit.js), chỉ khác là trả cho NHIỀU user cùng lúc,
 * có thêm tỉ lệ chấp nhận qua $lookup draft.
 */
const getQuotaLeaderboard = async (timeframe = '30d') => {
  const days = Object.prototype.hasOwnProperty.call(TIMEFRAME_DAYS, timeframe) ? TIMEFRAME_DAYS[timeframe] : TIMEFRAME_DAYS['30d']

  const match = { generationType: { $in: CONTENT_TYPES } }
  if (days !== null) match.createdAt = { $gte: daysAgo(days) }

  const rows = await AiGeneration.aggregate([
    { $match: match },
    { $lookup: { from: 'ai_draft_issues', localField: '_id', foreignField: 'generationId', as: 'drafts' } },
    {
      $group: {
        _id: '$requestedBy',
        generations: { $sum: 1 },
        tokens: { $sum: '$tokensUsed' },
        totalDrafts: { $sum: { $size: '$drafts' } },
        acceptedDrafts: { $sum: { $size: { $filter: { input: '$drafts', cond: { $eq: ['$$this.status', 'ACCEPTED'] } } } } },
      },
    },
    { $sort: { tokens: -1 } },
  ])

  const userIds = rows.map((r) => r._id).filter(Boolean)
  const [users, todayUsage] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select('fullName plan currentPlanExpiresAt').lean(),
    // Đếm TẤT CẢ loại (kể cả CLARIFY) — khớp đúng logic checkAiLimit.js thật đang chặn, không
    // chỉ riêng REQ_TO_EPIC/EPIC_TO_TASK như phần xếp hạng ở trên.
    AiGeneration.aggregate([
      { $match: { requestedBy: { $in: userIds }, createdAt: { $gte: startOfTodayUtc() } } },
      { $group: { _id: '$requestedBy', count: { $sum: 1 } } },
    ]),
  ])
  const userMap = new Map(users.map((u) => [String(u._id), u]))
  const todayUsageMap = new Map(todayUsage.map((r) => [String(r._id), r.count]))

  return rows.map((r) => {
    const userId = String(r._id)
    const user = userMap.get(userId)
    return {
      userId,
      userName: user?.fullName || null,
      userDeleted: !user,
      isPro: isProUser(user),
      generations: r.generations,
      tokens: r.tokens,
      acceptanceRate: r.totalDrafts ? r.acceptedDrafts / r.totalDrafts : 0,
      acceptedCount: r.acceptedDrafts,
      quotaUsedToday: todayUsageMap.get(userId) || 0,
      quotaLimitToday: aiEnv.AI_DAILY_LIMIT,
    }
  })
}

export const adminAiService = {
  getOverview,
  getQuotaLeaderboard,
  getAiAlerts,
}
