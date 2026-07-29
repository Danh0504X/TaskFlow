export type UserStatus = 'active' | 'inactive' | 'banned'
export type UserRole = 'admin' | 'user'

export interface AdminUserItem {
  _id: string
  email: string
  fullName: string
  avatarUrl: string | null
  authProvider: 'local' | 'google'
  isEmailVerified: boolean
  status: UserStatus
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface GetUsersQuery {
  page?: number
  limit?: number
  search?: string
  role?: UserRole | ''
  status?: UserStatus | ''
}

export interface GetUsersResponse {
  users: AdminUserItem[]
  total: number
  page: number
  limit: number
}

export interface UpdateUserPayload {
  fullName?: string
  email?: string
  role?: UserRole
  status?: UserStatus
  password?: string
}
