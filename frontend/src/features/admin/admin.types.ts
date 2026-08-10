// Type cho toàn bộ dữ liệu khu vực Admin.
// Phần "Tài khoản" (AdminUserItem và các type liên quan) dùng dữ liệu THẬT từ
// GET/PUT/DELETE /admin/users — khớp đúng response của backend (userService.js).
// Các phần còn lại (Tổng quan, Giám sát AI, Nhật ký hệ thống) vẫn dùng mock (xem mock/)
// vì backend chưa có — chỉ cần đổi queryFn trong hook khi có API thật, không đụng component.

export type UserStatus = 'active' | 'inactive' | 'banned'
export type UserRole = 'admin' | 'user'
export type AuthProviderType = 'local' | 'google'

export interface AdminUserItem {
  _id: string
  email: string
  fullName: string
  avatarUrl: string | null
  bio: string
  authProvider: AuthProviderType
  isEmailVerified: boolean
  hasPassword: boolean
  status: UserStatus
  role: UserRole
  plan?: 'FREE' | 'PRO'
  currentPlanExpiresAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface GetUsersQuery {
  page?: number
  limit?: number
  search?: string
  role?: UserRole | ''
  status?: UserStatus | ''
}

export interface GetUsersResponse {
  users: AdminUserItem[]
  total: number
  page: number
  limit: number
}

/** PUT /admin/users/:userId — chỉ gửi field thực sự thay đổi (backend chỉ áp field có mặt trong body). */
export interface UpdateUserPayload {
  fullName?: string
  role?: UserRole
  status?: UserStatus
}

// ---------- Tổng quan ----------

export interface TrendValue {
  current: number
  previous: number
}

export interface DailyPoint {
  date: string
  value: number
}

export interface AdminOverview {
  activeUsers7d: TrendValue
  aiCostThisMonth: TrendValue
  userGrowth30d: DailyPoint[]
}

// ---------- Giám sát AI ----------

export type AiGenerationType = 'REQ_TO_EPIC' | 'EPIC_TO_TASK' | 'TASK_TO_SUBTASK'
export type AiGenerationStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface AiFunnelStage {
  label: string
  value: number
}

export interface AiDailyStat {
  date: string
  tokens: number
  costUsd: number
  errorsCount: number
}

export interface AiTypeBreakdown {
  type: AiGenerationType
  count: number
  avgTokens: number
  acceptanceRate: number
}

export type AiAlertKind = 'STUCK_PROCESSING' | 'QUOTA_CAPPED' | 'ERROR_SPIKE'

export interface AiAlert {
  id: string
  kind: AiAlertKind
  message: string
  createdAt: string
}

export interface AiOverviewStats {
  costThisMonth: TrendValue
  acceptanceRate7d: number
  errorRate7d: number
  generationsToday: number
  funnel: AiFunnelStage[]
  wastedDrafts: number
  wastedDraftsRate: number
  daily30d: AiDailyStat[]
  byType: AiTypeBreakdown[]
  alerts: AiAlert[]
}

export interface AiGenerationLog {
  _id: string
  createdAt: string
  userId: string
  userName: string
  type: AiGenerationType
  status: AiGenerationStatus
  draftCount: number
  acceptedCount: number
  tokenCount: number
  processingTimeMs: number
  model: string
  errorMessage?: string
  inputPrompt: string
  rawOutput: string
}

export interface AiLogsQuery {
  page?: number
  limit?: number
  status?: AiGenerationStatus | ''
  type?: AiGenerationType | ''
  userId?: string | ''
  dateFrom?: string
  dateTo?: string
}

export interface AiLogsResponse {
  logs: AiGenerationLog[]
  total: number
  page: number
  limit: number
  p95ProcessingTimeMs: number
  errorGroups: { message: string; count: number }[]
}

export type QuotaTimeframe = '7d' | '30d' | 'all'

export interface AiLeaderboardRow {
  userId: string
  userName: string
  userDeleted: boolean
  generations: number
  tokens: number
  costUsd: number
  acceptanceRate: number
  acceptedCount: number
  quotaUsedToday: number
  quotaLimitToday: number
  aiDisabled: boolean
}

export interface AiQuotaResponse {
  timeframe: QuotaTimeframe
  rows: AiLeaderboardRow[]
  aiEnabledGlobally: boolean
}

// ---------- Nhật ký hệ thống ----------

export type AuditAction =
  | 'USER_LOCK'
  | 'USER_UNLOCK'
  | 'USER_ROLE_CHANGE'
  | 'USER_DELETE'
  | 'USER_PRO_GRANT'
  | 'USER_PRO_REVOKE'
  | 'PROJECT_OWNER_TRANSFER'
  | 'AI_PROMPT_VIEW'
  | 'SETTINGS_CHANGE'
  | 'AI_GLOBAL_TOGGLE'

export interface AuditLogItem {
  _id: string
  createdAt: string
  adminName: string
  adminEmail: string
  action: AuditAction
  targetLabel: string
  detail: string
}

export interface AuditLogQuery {
  page?: number
  limit?: number
  action?: AuditAction | ''
  adminEmail?: string
  dateFrom?: string
  dateTo?: string
}

export interface AuditLogResponse {
  items: AuditLogItem[]
  total: number
  page: number
  limit: number
}
