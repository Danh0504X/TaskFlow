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

export type ProjectMemberRole = 'OWNER' | 'MEMBER'
export type ProjectMemberStatus = 'PENDING' | 'ACTIVE' | 'REMOVED'

/** Thông tin rút gọn của user gắn trên member — chỉ có khi backend đã populate (hiện tại
 * chỉ `GET /projects/:id`, xem projectService.getProjectById). */
export interface ProjectMemberUser {
  _id: string
  fullName: string
  avatarUrl: string | null
}

export interface ProjectMember {
  userId: string
  role: ProjectMemberRole
  status: ProjectMemberStatus
  joinedAt: string
    /** Chỉ có khi lấy chi tiết 1 project (GET /projects/:id) — dùng cho assignee picker... */
  user?: ProjectMemberUser
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

/** 1 lời mời gửi lên khi mời thành viên (POST /projects/:id/members/invite) — luôn thêm với vai trò MEMBER. */
export interface InviteMemberInput {
  email: string
}

/** Kết quả xử lý 1 email mời — thành công hoặc lý do thất bại (email không tồn tại, đã là thành viên...). */
export interface InviteMemberResult {
  email: string
  status: 'ADDED' | 'FAILED'
  reason?: string
  userId?: string
  fullName?: string
}

/** Response từ POST /projects/:id/members/invite. */
export interface InviteMembersResponse {
  added: InviteMemberResult[]
  skipped: InviteMemberResult[]
}

/** 1 lời mời tham gia dự án đang chờ user hiện tại xử lý (GET /projects/invitations). */
export interface ProjectInvitation {
  projectId: string
  name: string
  key: string
  methodology: ProjectMethodology
  invitedBy: { fullName: string; avatarUrl: string | null } | null
  invitedAt: string
}
