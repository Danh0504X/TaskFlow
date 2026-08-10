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
  createdAt: string
  updatedAt: string
  /** Tổng token AI đã dùng (cộng dồn mọi lượt sinh AI, mọi project) — tính trực tiếp từ
   * AiGeneration.tokensUsed ở backend, không phải counter lưu sẵn. */
  aiTokensUsed: number
}

/** newest/oldest theo ngày tạo; tokensDesc/tokensAsc xếp hạng theo tổng token AI đã dùng
 * (aiTokensUsed) — tính ở backend bằng $lookup trước khi phân trang, xem userService.js. */
export type AdminUserSort = 'newest' | 'oldest' | 'tokensDesc' | 'tokensAsc'

export interface GetUsersQuery {
  page?: number
  limit?: number
  search?: string
  role?: UserRole | ''
  status?: UserStatus | ''
  sort?: AdminUserSort
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
// Chỉ giữ số liệu tính được TRỰC TIẾP từ dữ liệu thật (AiGeneration/AiDraftIssue) — không có $
// chi phí (hệ thống không lưu giá tiền), không có "Nhật ký sinh" (đã bỏ khỏi phạm vi), không có
// các thao tác kiểm soát (khoá AI/user, trần quota riêng, tắt AI toàn hệ thống — cần thêm field
// + logic chặn mới ở backend, để quyết định riêng sau, không phải việc của trang GIÁM SÁT).

export type AiGenerationType = 'REQ_TO_EPIC' | 'EPIC_TO_TASK'

export interface AiFunnelStage {
  label: string
  value: number
}

export interface AiDailyStat {
  date: string
  tokens: number
  errorsCount: number
}

export interface AiTypeBreakdown {
  type: AiGenerationType
  label: string
  count: number
  avgTokens: number
  acceptanceRate: number
}

export type AiAlertKind = 'STUCK_PROCESSING' | 'QUOTA_CAPPED'

export interface AiAlert {
  id: string
  kind: AiAlertKind
  message: string
  createdAt: string
}

export interface AiOverviewStats {
  acceptanceRate7d: number
  errorRate7d: number
  generationsToday: number
  funnel: AiFunnelStage[]
  daily30d: AiDailyStat[]
  byType: AiTypeBreakdown[]
  alerts: AiAlert[]
}

export type QuotaTimeframe = '7d' | '30d' | 'all'

export interface AiLeaderboardRow {
  userId: string
  /** null nếu tài khoản đã bị xoá nhưng lượt sinh cũ vẫn còn (userDeleted=true). */
  userName: string | null
  userDeleted: boolean
  isPro: boolean
  generations: number
  tokens: number
  acceptanceRate: number
  acceptedCount: number
  quotaUsedToday: number
  quotaLimitToday: number
}

// ---------- Nhật ký hệ thống ----------

export type AuditAction =
  | 'USER_LOCK'
  | 'USER_UNLOCK'
  | 'USER_ROLE_CHANGE'
  | 'USER_DELETE'
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
