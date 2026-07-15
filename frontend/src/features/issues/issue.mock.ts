import type { Issue } from './issue.types'

// Dữ liệu mock cho trang "Việc của tôi" — CHƯA có backend endpoint tổng hợp issue theo
// nhiều project (xem TODO ở features/tasks/hooks/useMyTasks.ts). Domain issue trong
// từng project riêng lẻ đã dùng API thật (xem features/issues/issue.api.ts).

/** Việc được giao cho "tôi" — dùng cho trang My Tasks, trải trên nhiều project khác nhau. */
export const MOCK_MY_TASKS: Issue[] = [
  {
    _id: 'mock-t1', key: 'WEB-42', title: 'Thiết kế lại khu vực Hero Section giao diện trang chủ',
    type: 'TASK', status: 'IN_PROGRESS', priority: 'MEDIUM',
    projectId: 'mock-web', projectName: 'Website Revamp',
    createdAt: '2026-07-01', updatedAt: '2026-07-08',
  },
  {
    _id: 'mock-t2', key: 'CORE-108', title: 'Tích hợp cổng thanh toán trực tuyến API Stripe Layer',
    type: 'TASK', status: 'TODO', priority: 'HIGH',
    projectId: 'mock-core', projectName: 'TaskFlow Core',
    createdAt: '2026-07-02', updatedAt: '2026-07-02',
  },
  {
    _id: 'mock-t3', key: 'OPS-12', title: 'Phân tích & lập báo cáo tiến độ tăng trưởng doanh nghiệp Quý 3',
    type: 'TASK', status: 'IN_REVIEW', priority: 'LOW',
    projectId: 'mock-ops', projectName: 'Operations',
    createdAt: '2026-06-28', updatedAt: '2026-07-06',
  },
  {
    _id: 'mock-t4', key: 'BUG-99', title: 'Sửa lỗi rò rỉ bộ nhớ khi thực hiện đóng tab trình duyệt',
    type: 'BUG', status: 'DONE', priority: 'URGENT',
    projectId: 'mock-core', projectName: 'TaskFlow Core',
    createdAt: '2026-06-20', updatedAt: '2026-06-30',
  },
]
