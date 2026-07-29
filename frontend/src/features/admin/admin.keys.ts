import type { GetUsersQuery } from './admin.types'

export const adminKeys = {
  all: ['admin'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  usersList: (query: GetUsersQuery) => [...adminKeys.users(), 'list', query] as const,
  userDetail: (id: string) => [...adminKeys.users(), 'detail', id] as const,
}
