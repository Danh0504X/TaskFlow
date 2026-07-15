import type { IssuePriority } from '@/features/issues/issue.types'

// CHƯA có backend cho các số liệu tổng quan này -> dữ liệu lấy từ dashboard.mock.ts.
// TODO: thay bằng API thật khi backend có endpoint dashboard/summary.

export interface DashboardStats {
  todo: number
  inProgress: number
  completedThisMonth: number
  overdue: number
}

export interface AssignedTaskPreview {
  id: string
  key: string
  summary: string
  projectName: string
  category: string
  priority: IssuePriority
  dueDate: string
  assigneeAvatars: string[]
}

export interface UpcomingEvent {
  id: string
  day: string
  month: string
  title: string
  time: string
  platform: string
}
