// Pool tên người dùng thực tế cho Giám sát AI (mock/ai.mock.ts) khớp với dữ liệu thật trong MongoDB Atlas.

export interface MockPoolUser {
  _id: string
  fullName: string
  role: 'admin' | 'user'
}

export const mockUsers: MockPoolUser[] = [
  { _id: 'user-admin-1', fullName: 'Danh Admin', role: 'admin' },
  { _id: 'user-khoa-1', fullName: 'Khoa Đoàn', role: 'user' },
  { _id: 'user-khoa-2', fullName: 'Đoàn Công Khoa', role: 'user' },
]
