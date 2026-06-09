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

/** Body khi tạo project (POST /projects). */
export interface CreateProjectPayload {
  name: string
  description?: string
  deadline?: string | null
}

/** Body khi cập nhật project (PUT /projects/:id) — mọi field đều optional. */
export interface UpdateProjectPayload {
  name?: string
  description?: string
  deadline?: string | null
  status?: ProjectStatus
}
