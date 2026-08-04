// Kiểu dữ liệu cho domain Issue (công việc trong project: epic/task/subtask/bug).
// Khớp với response thật từ GET /projects/:projectId/issues (xem backend/src/services/issueService.js).
// `key` (vd "PROJ-12") và `assignee`/`epicName` (object đã populate) do backend tự sinh,
// không tồn tại trực tiếp trong models/issues.js.

export const ISSUE_TYPE = {
  EPIC: 'EPIC',
  TASK: 'TASK',
  SUBTASK: 'SUBTASK',
  BUG: 'BUG',
} as const
export type IssueType = (typeof ISSUE_TYPE)[keyof typeof ISSUE_TYPE]

export const ISSUE_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  IN_REVIEW: 'IN_REVIEW',
  DONE: 'DONE',
} as const
export type IssueStatus = (typeof ISSUE_STATUS)[keyof typeof ISSUE_STATUS]

export const ISSUE_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const
export type IssuePriority = (typeof ISSUE_PRIORITY)[keyof typeof ISSUE_PRIORITY]

/** Thông tin rút gọn của user gắn trên issue (assignee). */
export interface IssueMember {
  _id: string
  fullName: string
  avatarUrl: string | null
}

/** Bản rút gọn của issue cha, do backend populate vào `parentIssueId` khi trả về (xem PARENT_ISSUE_POPULATE). */
export interface IssueParentRef {
  _id: string
  title: string
  type: IssueType
}

export interface Issue {
  _id: string
  key: string
  title: string
  description?: string
  type: IssueType
  status: IssueStatus
  priority: IssuePriority
  projectId: string
  projectName?: string
  sprintId?: string | null
  // Lưu ý: backend KHÔNG chuẩn hoá field này về id như `assigneeId` — khi đã populate,
  // đây là object { _id, title, type } (xem toIssueDTO ở issueService.js). Chỉ là string
  // khi issue được tạo/gửi lên (payload) hoặc lấy thẳng từ model chưa populate.
  parentIssueId?: string | IssueParentRef | null
  epicName?: string
  assigneeId?: string | IssueMember | null
  assignee?: IssueMember
  orderIndex?: number
  aiGenerated?: boolean
  createdAt: string
  updatedAt: string
}

// ----- Payload gửi lên -----

/** Body khi tạo issue (POST /projects/:projectId/issues). Chỉ `title` bắt buộc. */
export interface CreateIssuePayload {
  title: string
  description?: string
  type?: IssueType
  status?: IssueStatus
  priority?: IssuePriority
  sprintId?: string | null
  parentIssueId?: string | null
  assigneeId?: string | null
  orderIndex?: number
}

/** Body khi cập nhật toàn bộ issue (PUT /projects/:projectId/issues/:issueId) — mọi field optional. */
export type UpdateIssuePayload = Partial<CreateIssuePayload>

/** Body khi chỉ đổi status (PATCH /projects/:projectId/issues/:issueId/status) — vd kéo-thả trên Board.
 * `orderIndex` optional: cho phép 1 lần gọi xử lý cả đổi cột lẫn đổi vị trí khi kéo-thả,
 * không cần dùng PUT (OWNER-only) chỉ để đổi vị trí. */
export interface UpdateIssueStatusPayload {
  status: IssueStatus
  orderIndex?: number
}

/** Query filter cho GET /projects/:projectId/issues (khớp issueService.getIssuesByProject). */
export interface GetIssuesFilter {
  sprintId?: string
  status?: IssueStatus
  type?: IssueType
  priority?: IssuePriority
  assigneeId?: string
}
