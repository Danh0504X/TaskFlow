import type { AssignedTaskPreview, DashboardStats, UpcomingEvent } from './dashboard.types'

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  todo: 12,
  inProgress: 5,
  completedThisMonth: 48,
  overdue: 2,
}

export const MOCK_ASSIGNED_TASKS: AssignedTaskPreview[] = [
  {
    id: '1',
    key: 'WEB-42',
    summary: 'Thiết kế lại khu vực Hero Section',
    projectName: 'Website Revamp',
    category: 'UI Design',
    priority: 'MEDIUM',
    dueDate: '15 Th07, 2026',
    assigneeAvatars: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
    ],
  },
  {
    id: '2',
    key: 'CORE-108',
    summary: 'Tích hợp cổng thanh toán API Layer',
    projectName: 'TaskFlow Core',
    category: 'Backend',
    priority: 'HIGH',
    dueDate: '20 Th07, 2026',
    assigneeAvatars: ['https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80'],
  },
  {
    id: '3',
    key: 'OPS-12',
    summary: 'Lập báo cáo tăng trưởng Quý 3',
    projectName: 'Operations',
    category: 'Documentation',
    priority: 'LOW',
    dueDate: '25 Th07, 2026',
    assigneeAvatars: [],
  },
]

export const MOCK_UPCOMING_EVENTS: UpcomingEvent[] = [
  { id: 'e1', day: '24', month: 'TH07', title: 'Họp lấy phản hồi từ khách hàng', time: '10:30', platform: 'Zoom Meeting' },
  { id: 'e2', day: '27', month: 'TH07', title: 'Phát hành bản thử nghiệm Beta', time: 'Cả ngày', platform: 'Milestone' },
]
