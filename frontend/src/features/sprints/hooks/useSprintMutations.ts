import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast/toastStore'
import { getApiErrorMessage } from '@/lib/http'
import { issueKeys } from '@/features/issues/issue.keys'
import { sprintApi } from '../sprint.api'
import { sprintKeys } from '../sprint.keys'
import type { CompleteSprintPayload, CreateSprintPayload, UpdateSprintPayload } from '../sprint.types'

/**
 * Mỗi mutation sau khi thành công sẽ:
 * 1. invalidate cache sprint list liên quan -> Backlog/Board tự refetch.
 * 2. hiện toast báo kết quả.
 * start/complete/delete còn invalidate thêm issueKeys.lists() vì các thao tác này có
 * thể dịch chuyển issue (sprintId đổi) — Board/Backlog/List cần refetch theo.
 * Lỗi được bắt tập trung -> hiện toast lỗi, không để component tự xử lý.
 */

export const useCreateSprint = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSprintPayload) => sprintApi.create(projectId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintKeys.list(projectId) })
      toast.success('Tạo sprint thành công')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export const useUpdateSprint = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sprintId, payload }: { sprintId: string; payload: UpdateSprintPayload }) =>
      sprintApi.update(projectId, sprintId, payload),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: sprintKeys.list(projectId) })
      qc.invalidateQueries({ queryKey: sprintKeys.detail(projectId, updated._id) })
      toast.success('Cập nhật sprint thành công')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export const useDeleteSprint = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sprintId: string) => sprintApi.remove(projectId, sprintId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintKeys.list(projectId) })
      qc.invalidateQueries({ queryKey: issueKeys.lists() })
      toast.success('Đã xoá sprint')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export const useStartSprint = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sprintId: string) => sprintApi.start(projectId, sprintId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintKeys.list(projectId) })
      qc.invalidateQueries({ queryKey: issueKeys.lists() })
      toast.success('Sprint đã bắt đầu')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export const useCompleteSprint = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sprintId, payload }: { sprintId: string; payload: CompleteSprintPayload }) =>
      sprintApi.complete(projectId, sprintId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sprintKeys.list(projectId) })
      qc.invalidateQueries({ queryKey: issueKeys.lists() })
      toast.success('Sprint đã kết thúc')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
