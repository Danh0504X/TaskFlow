import type { GetUsersQuery, QuotaTimeframe } from './admin.types'

export const adminKeys = {
  all: ['admin'] as const,

  overview: () => [...adminKeys.all, 'overview'] as const,

  users: () => [...adminKeys.all, 'users'] as const,
  usersList: (query: GetUsersQuery) => [...adminKeys.users(), 'list', query] as const,
  userDetail: (id: string) => [...adminKeys.users(), 'detail', id] as const,

  ai: () => [...adminKeys.all, 'ai'] as const,
  aiOverview: () => [...adminKeys.ai(), 'overview'] as const,
  aiQuota: (timeframe: QuotaTimeframe) => [...adminKeys.ai(), 'quota', timeframe] as const,
}
