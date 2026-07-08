// Kiểu dữ liệu cho domain Issue (công việc trong project: epic/task/subtask/bug).
// CHƯA có backend cho domain này -> dữ liệu lấy từ issue.mock.ts (xem hooks/useIssues.ts).
// Khi backend bổ sung endpoint issues, chỉ cần đổi phần queryFn trong hook, giữ nguyên type này
// nếu khớp response, hoặc chỉnh theo DTO thật lúc đó.

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

export interface Issue {
  _id: string
  key: string
  summary: string
  description?: string
  type: IssueType
  status: IssueStatus
  priority: IssuePriority
  projectId: string
  projectName?: string
  epicName?: string
  assignee?: IssueMember
  createdAt: string
  updatedAt: string
}
