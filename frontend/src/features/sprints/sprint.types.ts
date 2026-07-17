// Kiểu dữ liệu cho domain Sprint — khớp với models/sprints.js ở backend.
// Sprint chỉ có ý nghĩa với project SCRUM (xem project.types.ts: PROJECT_METHODOLOGY).

export const SPRINT_STATUS = {
  PLANNED: 'PLANNED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const
export type SprintStatus = (typeof SPRINT_STATUS)[keyof typeof SPRINT_STATUS]

export interface Sprint {
  _id: string
  projectId: string
  name: string
  goal: string
  startDate: string
  endDate: string
  status: SprintStatus
  orderIndex: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ----- Payload gửi lên -----

/** Body khi tạo sprint (POST /projects/:projectId/sprints). */
export interface CreateSprintPayload {
  name: string
  goal?: string
  startDate: string
  endDate: string
  orderIndex?: number
}

/** Body khi cập nhật sprint (PUT /projects/:projectId/sprints/:sprintId) — mọi field optional.
 * Lưu ý: `startDate` chỉ sửa được khi sprint đang PLANNED (backend từ chối nếu sprint ACTIVE). */
export type UpdateSprintPayload = Partial<CreateSprintPayload>

export const SPRINT_COMPLETE_RESOLUTION = {
  BACKLOG: 'BACKLOG',
  MOVE_TO_SPRINT: 'MOVE_TO_SPRINT',
  NEW_SPRINT: 'NEW_SPRINT',
} as const
export type SprintCompleteResolution =
  (typeof SPRINT_COMPLETE_RESOLUTION)[keyof typeof SPRINT_COMPLETE_RESOLUTION]

/**
 * Body khi kết thúc sprint (PATCH /projects/:projectId/sprints/:sprintId/complete).
 * `resolution` chỉ bắt buộc khi sprint còn task chưa DONE — backend sẽ báo lỗi nếu thiếu.
 */
export interface CompleteSprintPayload {
  resolution?: SprintCompleteResolution
  targetSprintId?: string
  newSprint?: {
    name: string
    startDate: string
    endDate: string
    goal?: string
  }
}

/** Response từ PATCH .../complete. */
export interface CompleteSprintResult {
  sprint: Sprint
  movedCount: number
  newSprint: Sprint | null
}
