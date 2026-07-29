import { mockUsers } from './users.mock'
import type {
  AiDailyStat,
  AiGenerationLog,
  AiGenerationStatus,
  AiGenerationType,
  AiLeaderboardRow,
  AiLogsQuery,
  AiLogsResponse,
  AiOverviewStats,
  AiQuotaResponse,
  QuotaTimeframe,
} from '../admin.types'

let seed = 42
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return seed / 0x7fffffff
}
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
const minutesAgoIso = (min: number) => new Date(Date.now() - min * 60_000).toISOString()
const daysAgoIso = (days: number, extraMin = 0) => new Date(Date.now() - days * 86_400_000 - extraMin * 60_000).toISOString()

const TYPES: AiGenerationType[] = ['REQ_TO_EPIC', 'EPIC_TO_TASK', 'TASK_TO_SUBTASK']
const MODELS = ['claude-sonnet-5', 'claude-haiku-4-5']
const normalUsers = mockUsers.filter((u) => u.role === 'user')

// ---------- Tổng quan AI ----------

const buildDaily30d = (): AiDailyStat[] => {
  const out: AiDailyStat[] = []
  for (let i = 29; i >= 0; i--) {
    const spike = i === 8
    const errorDay = i === 19
    const baseTokens = 22000 + Math.round(Math.sin(i * 0.9) * 4000)
    const tokens = spike ? baseTokens * 3.4 : baseTokens
    const costUsd = Number((tokens * 0.000018).toFixed(2))
    const errorsCount = errorDay ? 14 : Math.round(rand() * 2)
    out.push({ date: new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10), tokens: Math.round(tokens), costUsd, errorsCount })
  }
  return out
}

export const mockAiOverview: AiOverviewStats = {
  costThisMonth: { current: 128.42, previous: 96.1 },
  acceptanceRate7d: 0.64,
  errorRate7d: 0.081,
  generationsToday: 17,
  funnel: [
    { label: 'Lượt sinh', value: 120 },
    { label: 'Draft', value: 480 },
    { label: 'Chấp nhận', value: 310 },
    { label: 'Issue thật', value: 310 },
  ],
  wastedDrafts: 170,
  wastedDraftsRate: 170 / 480,
  daily30d: buildDaily30d(),
  byType: [
    { type: 'REQ_TO_EPIC', count: 120, avgTokens: 3400, acceptanceRate: 0.72 },
    { type: 'EPIC_TO_TASK', count: 268, avgTokens: 1850, acceptanceRate: 0.61 },
    { type: 'TASK_TO_SUBTASK', count: 312, avgTokens: 780, acceptanceRate: 0.58 },
  ],
  alerts: [
    {
      id: 'alert-stuck-1',
      kind: 'STUCK_PROCESSING',
      message: '1 generation đang kẹt ở trạng thái PROCESSING hơn 12 phút (log #gen-stuck-01, user Trần Thị Owner).',
      createdAt: minutesAgoIso(12),
    },
    {
      id: 'alert-quota-1',
      kind: 'QUOTA_CAPPED',
      message: '3 user đã chạm trần quota AI hôm nay và đang bị chặn tạo thêm.',
      createdAt: minutesAgoIso(40),
    },
    {
      id: 'alert-error-1',
      kind: 'ERROR_SPIKE',
      message: 'Tỉ lệ lỗi ngày 19 ngày trước tăng đột biến lên 14 lỗi/ngày (bình thường 0-2 lỗi/ngày).',
      createdAt: daysAgoIso(19),
    },
  ],
}

export const fetchAiOverview = (): Promise<AiOverviewStats> =>
  new Promise((resolve) => setTimeout(() => resolve(mockAiOverview), 450))

// ---------- Nhật ký sinh ----------

const ERROR_MESSAGES = [
  'Lỗi phân tích JSON từ model (JSON parse lỗi)',
  'Hết thời gian chờ phản hồi model (Timeout)',
  'Model trả về schema không hợp lệ',
]

const buildLogs = (): AiGenerationLog[] => {
  const logs: AiGenerationLog[] = []

  // Bắt buộc: 1 generation kẹt PROCESSING > 5 phút.
  logs.push({
    _id: 'gen-stuck-01',
    createdAt: minutesAgoIso(12),
    userId: 'mock-pool-user-3',
    userName: 'Trần Thị Owner',
    type: 'EPIC_TO_TASK',
    status: 'PROCESSING',
    draftCount: 0,
    acceptedCount: 0,
    tokenCount: 0,
    processingTimeMs: 0,
    model: 'claude-sonnet-5',
    inputPrompt: 'Chia epic "Xây dựng module thanh toán" thành các task chi tiết cho sprint tới, ưu tiên phần tích hợp cổng thanh toán VNPay.',
    rawOutput: '',
  })

  const total = 148
  let failedCount = 0
  const targetFailed = Math.round(total * 0.08)

  for (let i = 0; i < total; i++) {
    const user = pick(normalUsers)
    const type = pick(TYPES)
    let status: AiGenerationStatus = 'COMPLETED'
    if (failedCount < targetFailed && rand() < 0.1) {
      status = 'FAILED'
      failedCount++
    } else if (rand() < 0.02) {
      status = 'PROCESSING'
    }

    const draftCount = status === 'COMPLETED' ? Math.round(2 + rand() * 6) : 0
    const acceptedCount = status === 'COMPLETED' ? Math.round(draftCount * (0.3 + rand() * 0.6)) : 0
    const errIdx = status === 'FAILED' ? Math.floor(rand() * 2) : -1 // chỉ dùng 2 nhóm lỗi chính để gom nhóm rõ ràng

    logs.push({
      _id: `gen-${i + 1}`,
      createdAt: daysAgoIso(Math.floor(rand() * 14), Math.floor(rand() * 1440)),
      userId: user._id,
      userName: user.fullName,
      type,
      status,
      draftCount,
      acceptedCount,
      tokenCount: Math.round(400 + rand() * 4200),
      processingTimeMs: status === 'PROCESSING' ? 0 : Math.round(900 + rand() * 9000),
      model: pick(MODELS),
      errorMessage: errIdx >= 0 ? ERROR_MESSAGES[errIdx] : undefined,
      inputPrompt: `Yêu cầu sinh nội dung cho dự án của ${user.fullName} — chi tiết nội bộ dự án, không hiển thị mặc định.`,
      rawOutput: status === 'COMPLETED' ? `{"drafts": ${draftCount}, "accepted": ${acceptedCount}}` : '',
    })
  }

  return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

const allLogs = buildLogs()

const p95 = (values: number[]): number => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.ceil(0.95 * sorted.length) - 1)
  return sorted[idx]
}

export const fetchAiLogs = (query: AiLogsQuery = {}): Promise<AiLogsResponse> => {
  const { page = 1, limit = 20, status, type, userId, dateFrom, dateTo } = query

  let filtered = allLogs
  if (status) filtered = filtered.filter((l) => l.status === status)
  if (type) filtered = filtered.filter((l) => l.type === type)
  if (userId) filtered = filtered.filter((l) => l.userId === userId)
  if (dateFrom) filtered = filtered.filter((l) => l.createdAt >= dateFrom)
  if (dateTo) filtered = filtered.filter((l) => l.createdAt <= dateTo)

  const start = (page - 1) * limit
  const pageItems = filtered.slice(start, start + limit)

  const failed = filtered.filter((l) => l.errorMessage)
  const groups = new Map<string, number>()
  failed.forEach((l) => {
    const key = l.errorMessage!
    groups.set(key, (groups.get(key) ?? 0) + 1)
  })

  const processingTimes = filtered.filter((l) => l.status === 'COMPLETED').map((l) => l.processingTimeMs)

  const response: AiLogsResponse = {
    logs: pageItems,
    total: filtered.length,
    page,
    limit,
    p95ProcessingTimeMs: p95(processingTimes),
    errorGroups: Array.from(groups.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count),
  }

  return new Promise((resolve) => setTimeout(() => resolve(response), 350))
}

// ---------- Hạn mức & xếp hạng ----------

const SCALE: Record<QuotaTimeframe, number> = { '7d': 0.28, '30d': 1, all: 2.6 }

const buildLeaderboard = (timeframe: QuotaTimeframe): AiLeaderboardRow[] => {
  const scale = SCALE[timeframe]
  const rows: Omit<AiLeaderboardRow, 'acceptedCount'>[] = normalUsers.slice(0, 14).map((u) => {
    const generations = Math.max(1, Math.round((6 + rand() * 40) * scale))
    const tokens = Math.round(generations * (600 + rand() * 2200))
    const acceptanceRate = 0.35 + rand() * 0.5
    return {
      userId: u._id,
      userName: u.fullName,
      userDeleted: false,
      generations,
      tokens,
      costUsd: Number((tokens * 0.000018).toFixed(2)),
      acceptanceRate,
      quotaUsedToday: Math.min(15, Math.floor(rand() * 16)),
      quotaLimitToday: 15,
      aiDisabled: false,
    }
  })

  // Bắt buộc: user top chi tiêu nhưng tỉ lệ chấp nhận ~9% (đối lập với top 1 ~88%).
  rows[0] = {
    userId: 'mock-pool-user-3',
    userName: 'Trần Thị Owner',
    userDeleted: false,
    generations: Math.round(210 * scale),
    tokens: Math.round(480000 * scale),
    costUsd: Number((480000 * scale * 0.000018).toFixed(2)),
    acceptanceRate: 0.88,
    quotaUsedToday: 12,
    quotaLimitToday: 15,
    aiDisabled: false,
  }
  rows[1] = {
    userId: 'mock-pool-user-5',
    userName: pick(normalUsers).fullName + ' (chi nhiều, chấp nhận thấp)',
    userDeleted: false,
    generations: Math.round(198 * scale),
    tokens: Math.round(455000 * scale),
    costUsd: Number((455000 * scale * 0.000018).toFixed(2)),
    acceptanceRate: 0.09,
    quotaUsedToday: 15,
    quotaLimitToday: 15,
    aiDisabled: false,
  }

  // Bắt buộc: tài khoản đã xoá vẫn còn chi phí trong hoá đơn.
  rows.push({
    userId: 'mock-pool-user-deleted-1',
    userName: 'Tài khoản đã xoá',
    userDeleted: true,
    generations: Math.round(34 * scale),
    tokens: Math.round(61000 * scale),
    costUsd: Number((61000 * scale * 0.000018).toFixed(2)),
    acceptanceRate: 0.41,
    quotaUsedToday: 0,
    quotaLimitToday: 15,
    aiDisabled: false,
  })

  // Bắt buộc: user mới, 2 lượt sinh, 0% chấp nhận — kiểm chứng ngưỡng mẫu ≥ 10.
  rows.push({
    userId: 'mock-pool-user-4',
    userName: 'Người Dùng Mới',
    userDeleted: false,
    generations: 2,
    tokens: 3100,
    costUsd: 0.06,
    acceptanceRate: 0,
    quotaUsedToday: 2,
    quotaLimitToday: 15,
    aiDisabled: false,
  })

  // Áp lại các chỉnh sửa admin đã làm trong phiên (trần riêng / tạm khoá AI) lên mọi khung
  // thời gian, để đổi bộ lọc 7d/30d/all không "quên" thao tác vừa thực hiện.
  const withOverrides: AiLeaderboardRow[] = rows.map((row) => ({
    ...row,
    acceptedCount: Math.round(row.generations * row.acceptanceRate),
    quotaLimitToday: quotaOverrides.get(row.userId) ?? row.quotaLimitToday,
    aiDisabled: aiDisabledOverrides.get(row.userId) ?? row.aiDisabled,
  }))

  return withOverrides.sort((a, b) => b.tokens - a.tokens)
}

let aiEnabledGlobally = true
const quotaOverrides = new Map<string, number>()
const aiDisabledOverrides = new Map<string, boolean>()

export const fetchAiQuota = (timeframe: QuotaTimeframe = '30d'): Promise<AiQuotaResponse> => {
  const response: AiQuotaResponse = {
    timeframe,
    rows: buildLeaderboard(timeframe),
    aiEnabledGlobally,
  }
  return new Promise((resolve) => setTimeout(() => resolve(response), 350))
}

export const setAiEnabledGlobally = (enabled: boolean): Promise<{ aiEnabledGlobally: boolean }> => {
  aiEnabledGlobally = enabled
  return new Promise((resolve) => setTimeout(() => resolve({ aiEnabledGlobally }), 300))
}

export const setUserQuotaLimit = (userId: string, limit: number): Promise<{ userId: string; limit: number }> => {
  quotaOverrides.set(userId, limit)
  return new Promise((resolve) => setTimeout(() => resolve({ userId, limit }), 300))
}

export const setUserAiDisabled = (userId: string, disabled: boolean): Promise<{ userId: string; disabled: boolean }> => {
  aiDisabledOverrides.set(userId, disabled)
  return new Promise((resolve) => setTimeout(() => resolve({ userId, disabled }), 300))
}

export const allNormalUsersForFilter = normalUsers.map((u) => ({ _id: u._id, fullName: u.fullName }))
