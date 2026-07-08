// Kiểu dữ liệu cho domain Project — khớp với models/projects.js ở backend.

// TS của dự án bật `erasableSyntaxOnly` -> KHÔNG dùng `enum`.
// Thay vào đó dùng object `as const` + union type suy ra từ nó.
export const PROJECT_STATUS = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const

export type ProjectStatus =
  (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS]

// Phương pháp quản trị — quyết định workspace hiển thị tab nào (xem ProjectWorkspacePage).
// Chọn 1 lần lúc tạo, không đổi được sau đó (đổi giữa chừng phá vỡ cấu trúc Sprint/Backlog).
export const PROJECT_METHODOLOGY = {
  SCRUM: 'SCRUM',
  KANBAN: 'KANBAN',
} as const

export type ProjectMethodology =
  (typeof PROJECT_METHODOLOGY)[keyof typeof PROJECT_METHODOLOGY]

export type ProjectMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER'
export type ProjectMemberStatus = 'PENDING' | 'ACTIVE' | 'REMOVED'

export interface ProjectMember {
  userId: string
  role: ProjectMemberRole
  status: ProjectMemberStatus
  joinedAt: string
}

/** Một project trả về từ backend. */
export interface Project {
  _id: string
  name: string
  key: string
  methodology: ProjectMethodology
  description: string
  deadline: string | null
  status: ProjectStatus
  createdBy: string
  members: ProjectMember[]
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

// ----- Payload gửi lên -----

/**
 * Body khi tạo project (POST /projects).
 * `key` bỏ trống -> backend tự sinh từ name. `methodology` bỏ trống -> backend mặc định KANBAN.
 */
export interface CreateProjectPayload {
  name: string
  key?: string
  methodology?: ProjectMethodology
  description?: string
  deadline?: string | null
}

/** Body khi cập nhật project (PUT /projects/:id) — mọi field đều optional. */
export interface UpdateProjectPayload {
  name?: string
  key?: string
  description?: string
  deadline?: string | null
  status?: ProjectStatus
}
