import type { AdminOverview, DailyPoint } from '../admin.types'

const isoDate = (daysAgo: number) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

/** Tăng trưởng user 30 ngày — cố tình KHÔNG mượt: có 1 ngày tăng vọt (chiến dịch mời) và dao
 * động tự nhiên quanh baseline, để biểu đồ trông thật thay vì đường thẳng lý tưởng. */
const buildUserGrowth30d = (): DailyPoint[] => {
  const points: DailyPoint[] = []
  let base = 3
  for (let i = 29; i >= 0; i--) {
    const spikeDay = i === 11
    const weekendDip = i % 7 === 0
    const noise = Math.round(Math.sin(i * 1.3) * 1.5)
    let value = base + noise + (weekendDip ? -1 : 0)
    if (spikeDay) value = base + 14
    value = Math.max(0, value)
    points.push({ date: isoDate(i), value })
    base = base + (rand() < 0.5 ? 0 : 1) * (rand() < 0.7 ? 1 : 0)
  }
  return points
}

// PRNG nhỏ, seed cố định để chart không đổi hình mỗi lần reload.
let seed = 987654321
function rand() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return seed / 0x7fffffff
}

export const mockOverview: AdminOverview = {
  activeUsers7d: { current: 57, previous: 49 },
  aiCostThisMonth: { current: 128.42, previous: 96.1 },
  userGrowth30d: buildUserGrowth30d(),
}

export const fetchAdminOverview = (): Promise<AdminOverview> =>
  new Promise((resolve) => setTimeout(() => resolve(mockOverview), 400))
