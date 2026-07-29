import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

export const useUpdateUserStatus = () => {
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
