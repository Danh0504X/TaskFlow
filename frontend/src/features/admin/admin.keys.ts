import type { AiLogsQuery, AuditLogQuery, GetUsersQuery, QuotaTimeframe } from './admin.types'

export const adminKeys = {
  all: ['admin'] as const,

  overview: () => [...adminKeys.all, 'overview'] as const,

  users: () => [...adminKeys.all, 'users'] as const,
  usersList: (query: GetUsersQuery) => [...adminKeys.users(), 'list', query] as const,
  userDetail: (id: string) => [...adminKeys.users(), 'detail', id] as const,

  ai: () => [...adminKeys.all, 'ai'] as const,
  aiOverview: () => [...adminKeys.ai(), 'overview'] as const,
  aiLogs: (query: AiLogsQuery) => [...adminKeys.ai(), 'logs', query] as const,
  aiQuota: (timeframe: QuotaTimeframe) => [...adminKeys.ai(), 'quota', timeframe] as const,

  audit: () => [...adminKeys.all, 'audit'] as const,
  auditList: (query: AuditLogQuery) => [...adminKeys.audit(), 'list', query] as const,
}
