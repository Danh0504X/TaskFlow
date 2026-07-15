import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast/toastStore'
import { getApiErrorMessage } from '@/lib/http'
import { issueApi } from '../issue.api'
import { issueKeys } from '../issue.keys'
import type {
  CreateIssuePayload,
  UpdateIssuePayload,
  UpdateIssueStatusPayload,
} from '../issue.types'

/**
 * Mỗi mutation sau khi thành công sẽ:
 * 1. invalidate cache list/detail liên quan -> Board/List/Backlog tự refetch.
 * 2. hiện toast báo kết quả.
 * Lỗi được bắt tập trung -> hiện toast lỗi, không để component tự xử lý.
 */

export const useCreateIssue = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateIssuePayload) =>
      issueApi.create(projectId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.lists() })
      toast.success('Tạo issue thành công')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export const useUpdateIssue = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      issueId,
      payload,
    }: {
      issueId: string
      payload: UpdateIssuePayload
    }) => issueApi.update(projectId, issueId, payload),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: issueKeys.lists() })
      qc.invalidateQueries({
        queryKey: issueKeys.detail(projectId, updated._id),
      })
      toast.success('Cập nhật issue thành công')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

/** Đổi status (vd kéo-thả trên Board). Không toast khi thành công để tránh làm phiền lúc kéo-thả liên tục. */
export const useUpdateIssueStatus = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      issueId,
      payload,
    }: {
      issueId: string
      payload: UpdateIssueStatusPayload
    }) => issueApi.updateStatus(projectId, issueId, payload),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: issueKeys.lists() })
      qc.invalidateQueries({
        queryKey: issueKeys.detail(projectId, updated._id),
      })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export const useDeleteIssue = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (issueId: string) => issueApi.remove(projectId, issueId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.lists() })
      toast.success('Đã xoá issue')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
