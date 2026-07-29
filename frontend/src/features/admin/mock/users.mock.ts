// Pool tên giả dùng làm "chủ sở hữu" cho dữ liệu mock của Giám sát AI (mock/ai.mock.ts).
// KHÔNG phải nguồn dữ liệu cho tab "Tài khoản" — tab đó đã dùng API thật (xem admin.api.ts).
// Giữ file này tối giản, chỉ đủ field mà ai.mock.ts cần để gán lượt sinh AI cho 1 "người dùng".

export interface MockPoolUser {
  _id: string
  fullName: string
  role: 'admin' | 'user'
}

const mulberry32 = (seed: number) => {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260129)
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]

const FIRST_NAMES = [
  'Nguyễn Văn', 'Trần Thị', 'Lê Hoàng', 'Phạm Minh', 'Hoàng Thu', 'Vũ Đức', 'Đặng Gia',
  'Bùi Khánh', 'Đỗ Ngọc', 'Ngô Thanh', 'Dương Bảo', 'Lý Anh', 'Trịnh Quốc', 'Phan Tuấn',
]
const LAST_NAMES = [
  'An', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hà', 'Khoa', 'Linh', 'Minh', 'Nam', 'Oanh',
  'Phúc', 'Quân', 'Sang', 'Thảo', 'Uyên', 'Vy', 'Xuân', 'Yến', 'Đạt',
]

const buildName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`

const generated: MockPoolUser[] = Array.from({ length: 20 }, (_, i) => ({
  _id: `mock-pool-user-${i + 3}`,
  fullName: buildName(),
  role: 'user',
}))

export const mockUsers: MockPoolUser[] = [
  { _id: 'mock-pool-user-admin-1', fullName: 'System Admin', role: 'admin' },
  { _id: 'mock-pool-user-admin-2', fullName: 'Lê Quản Trị', role: 'admin' },
  { _id: 'mock-pool-user-3', fullName: 'Trần Thị Owner', role: 'user' },
  { _id: 'mock-pool-user-4', fullName: 'Người Dùng Mới', role: 'user' },
  ...generated,
]
