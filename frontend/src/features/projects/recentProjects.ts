// Theo dõi các project user vừa truy cập (client-side, theo từng trình duyệt) để hiển thị
// mục "Dự án gần đây" ở trang danh sách. Không cần API backend riêng — chỉ là gợi ý UX,
// không phải nguồn dữ liệu chính (dữ liệu project thật vẫn lấy từ `useProjects`).

const STORAGE_KEY = 'taskflow_recent_projects'
const MAX_ENTRIES_PER_USER = 20

interface RecentEntry {
  projectId: string
  visitedAt: number
}

type RecentStore = Record<string, RecentEntry[]>

const readStore = (): RecentStore => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const writeStore = (store: RecentStore) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

/** Ghi nhận user vừa mở 1 project — gọi khi vào trang chi tiết project (workspace). */
export const recordProjectVisit = (userId: string, projectId: string) => {
  const store = readStore()
  const entries = (store[userId] ?? []).filter((entry) => entry.projectId !== projectId)
  entries.unshift({ projectId, visitedAt: Date.now() })
  store[userId] = entries.slice(0, MAX_ENTRIES_PER_USER)
  writeStore(store)
}

/** Danh sách projectId đã truy cập, sắp theo gần nhất -> xa nhất. */
export const getRecentProjectIds = (userId: string): string[] =>
  (readStore()[userId] ?? []).map((entry) => entry.projectId)
