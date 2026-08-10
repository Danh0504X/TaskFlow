export interface NotificationItem {
  _id: string
  userId: string
  actorId: {
    _id: string
    fullName: string
    avatarUrl?: string | null
  } | null
  projectId: string | null
  type:
    | 'INVITATION'
    | 'SPRINT_STARTED'
    | 'SPRINT_COMPLETED'
    | 'TASK_ASSIGNED'
    | 'MENTIONED'
    | 'AI_COMPLETED'
    | 'TASK_REJECTED'
    | 'TASK_COMMENTED'
  entityType: 'PROJECT' | 'SPRINT' | 'ISSUE'
  entityId: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export interface PaginationInfo {
  page: number
  limit: number
  totalItems: number
  totalPages: number
}

export interface GetNotificationsResponse {
  notifications: NotificationItem[]
  pagination: PaginationInfo
}
