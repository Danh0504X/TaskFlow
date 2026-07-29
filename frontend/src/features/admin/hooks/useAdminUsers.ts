import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../admin.api'
import { adminKeys } from '../admin.keys'
import type { GetUsersQuery, UpdateUserPayload } from '../admin.types'

export const useAdminUsers = (query: GetUsersQuery) => {
  return useQuery({
    queryKey: adminKeys.usersList(query),
    queryFn: () => adminApi.getUsers(query),
  })
}

export const useAdminUserDetail = (userId: string | null) => {
  return useQuery({
    queryKey: adminKeys.userDetail(userId ?? ''),
    queryFn: () => adminApi.getUserById(userId!),
    enabled: !!userId,
  })
}

/** Tổng số admin hiện có trong toàn hệ thống (không chỉ trang đang xem) — dùng để chặn
 * khoá/xoá/hạ quyền admin cuối cùng. */
export const useAdminCount = () => {
  return useQuery({
    queryKey: adminKeys.usersList({ role: 'admin', limit: 1 }),
    queryFn: () => adminApi.getUsers({ role: 'admin', limit: 1 }),
    select: (data) => data.total,
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateUserPayload }) =>
      adminApi.updateUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all })
    },
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all })
    },
  })
}
