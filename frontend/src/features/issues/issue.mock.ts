import type { Issue, IssueMember } from './issue.types'

// Dữ liệu mock cho domain Issue — CHƯA có backend, xem ghi chú ở issue.types.ts.
// Toàn bộ ảnh đại diện dùng placeholder Unsplash (giữ đúng phong cách bản demo Stitch).

const members: Record<string, IssueMember> = {
  alex: { _id: 'm-alex', fullName: 'Alex Chen', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80' },
  sarah: { _id: 'm-sarah', fullName: 'Sarah Miller', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80' },
  james: { _id: 'm-james', fullName: 'James Wilson', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80' },
  emily: { _id: 'm-emily', fullName: 'Emily Blunt', avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=80&q=80' },
}

/** Pool mock dùng chung cho Board/List/Backlog của bất kỳ project nào đang mở. */
const MOCK_ISSUES: Issue[] = [
  {
    _id: 'mock-i1', key: 'NEB-01', summary: 'EPIC 01: Lập kế hoạch dự án & Khảo sát nghiệp vụ',
    type: 'EPIC', status: 'IN_PROGRESS', priority: 'HIGH',
    projectId: '', assignee: members.alex, reporter: members.sarah,
    dueDate: '2026-10-24', createdAt: '2026-06-01', updatedAt: '2026-07-08',
  },
  {
    _id: 'mock-i2', key: 'NEB-02', summary: 'Thiết kế giao diện Dark mode cho ứng dụng di động',
    type: 'TASK', status: 'TODO', priority: 'MEDIUM', epicName: 'UI/UX Design', storyPoints: 5,
    projectId: '', assignee: members.alex, reporter: members.sarah,
    dueDate: '2026-07-15', createdAt: '2026-06-10', updatedAt: '2026-07-05',
  },
  {
    _id: 'mock-i3', key: 'NEB-03', summary: 'Tích hợp xác thực đa yếu tố Multi-Factor Auth (MFA)',
    type: 'TASK', status: 'IN_PROGRESS', priority: 'URGENT', epicName: 'Security', storyPoints: 8,
    projectId: '', assignee: members.sarah, reporter: members.james,
    dueDate: '2026-07-20', createdAt: '2026-06-12', updatedAt: '2026-07-08',
  },
  {
    _id: 'mock-i4', key: 'NEB-04', summary: 'Sửa lỗi không nhận diện được Slack API Signature Token',
    type: 'BUG', status: 'IN_REVIEW', priority: 'HIGH', epicName: 'Slack Integration', storyPoints: 3,
    projectId: '', assignee: members.james, reporter: members.emily,
    dueDate: '2026-07-12', createdAt: '2026-06-20', updatedAt: '2026-07-07',
  },
  {
    _id: 'mock-i5', key: 'NEB-05', summary: 'Viết bộ khung kiểm thử đơn vị cho API Middleware Auth',
    type: 'TASK', status: 'DONE', priority: 'LOW', epicName: 'Testing Unit', storyPoints: 1,
    projectId: '', assignee: members.emily, reporter: members.alex,
    dueDate: '2026-06-30', createdAt: '2026-06-05', updatedAt: '2026-06-29',
  },
  {
    _id: 'mock-i6', key: 'NEB-06', summary: 'Tinh chỉnh lại các thành phần giao diện kính mờ (Glassmorphism)',
    type: 'SUBTASK', status: 'IN_REVIEW', priority: 'HIGH', storyPoints: 2,
    projectId: '', assignee: members.sarah, reporter: members.emily,
    dueDate: '2026-07-09', createdAt: '2026-06-18', updatedAt: '2026-07-06',
  },
  {
    _id: 'mock-i7', key: 'NEB-07', summary: 'Thiết lập hạ tầng thanh toán Stripe Webhook để đồng bộ trạng thái đăng ký',
    type: 'TASK', status: 'TODO', priority: 'HIGH', epicName: 'Payment Flow', storyPoints: 8,
    projectId: '', assignee: undefined, reporter: members.alex,
    dueDate: '2026-07-25', createdAt: '2026-06-22', updatedAt: '2026-06-22',
  },
  {
    _id: 'mock-i8', key: 'NEB-08', summary: 'Tối ưu hóa dung lượng ảnh chụp màn hình tải lên qua cơ chế nén ảnh tự động',
    type: 'TASK', status: 'TODO', priority: 'MEDIUM', storyPoints: 3,
    projectId: '', assignee: undefined, reporter: members.james,
    dueDate: '2026-07-28', createdAt: '2026-06-25', updatedAt: '2026-06-25',
  },
]

/** Trả về pool issue mock, gắn projectId thật của project đang mở. */
export const getIssuesForProject = (projectId: string): Issue[] =>
  MOCK_ISSUES.map((issue) => ({ ...issue, projectId }))

/** Tìm 1 issue theo key trong pool mock (dùng cho panel chi tiết). */
export const findMockIssueByKey = (key: string): Issue | undefined =>
  MOCK_ISSUES.find((issue) => issue.key === key)

/** Việc được giao cho "tôi" — dùng cho trang My Tasks, trải trên nhiều project khác nhau. */
export const MOCK_MY_TASKS: Issue[] = [
  {
    _id: 'mock-t1', key: 'WEB-42', summary: 'Thiết kế lại khu vực Hero Section giao diện trang chủ',
    type: 'TASK', status: 'IN_PROGRESS', priority: 'MEDIUM',
    projectId: 'mock-web', projectName: 'Website Revamp',
    dueDate: '2026-07-15', createdAt: '2026-07-01', updatedAt: '2026-07-08',
  },
  {
    _id: 'mock-t2', key: 'CORE-108', summary: 'Tích hợp cổng thanh toán trực tuyến API Stripe Layer',
    type: 'TASK', status: 'TODO', priority: 'HIGH',
    projectId: 'mock-core', projectName: 'TaskFlow Core',
    dueDate: '2026-07-20', createdAt: '2026-07-02', updatedAt: '2026-07-02',
  },
  {
    _id: 'mock-t3', key: 'OPS-12', summary: 'Phân tích & lập báo cáo tiến độ tăng trưởng doanh nghiệp Quý 3',
    type: 'TASK', status: 'IN_REVIEW', priority: 'LOW',
    projectId: 'mock-ops', projectName: 'Operations',
    dueDate: '2026-07-25', createdAt: '2026-06-28', updatedAt: '2026-07-06',
  },
  {
    _id: 'mock-t4', key: 'BUG-99', summary: 'Sửa lỗi rò rỉ bộ nhớ khi thực hiện đóng tab trình duyệt',
    type: 'BUG', status: 'DONE', priority: 'URGENT',
    projectId: 'mock-core', projectName: 'TaskFlow Core',
    dueDate: null, createdAt: '2026-06-20', updatedAt: '2026-06-30',
  },
]
