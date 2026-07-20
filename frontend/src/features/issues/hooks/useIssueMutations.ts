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

/** `silent`: bỏ qua toast thành công (vd quick-add liên tục ở Backlog — toast dồn dập gây phiền,
 * giống lý do useUpdateIssueStatus bên dưới không toast lúc kéo-thả). Mặc định vẫn toast như cũ. */
export const useCreateIssue = (projectId: string, options?: { silent?: boolean }) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateIssuePayload) =>
      issueApi.create(projectId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.lists() })
      if (!options?.silent) {
        toast.success('Tạo issue thành công')
      }
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

/** `silent`: bỏ qua toast thành công — dùng cho các cập nhật "nhanh, tại chỗ" (đổi người
 * gán/độ ưu tiên qua dropdown, kéo-thả) mà toast liên tục sẽ gây phiền. Mặc định vẫn toast. */
export const useUpdateIssue = (projectId: string, options?: { silent?: boolean }) => {  
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
      if (!options?.silent) {
        toast.success('Cập nhật issue thành công')
      }
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
    // BE có thể từ chối (409, vd sprint vừa bị complete bởi người khác giữa lúc đang
    // kéo) -> invalidate để board tự đồng bộ lại đúng trạng thái server, không để
    // localIssues optimistic bị lệch vĩnh viễn.
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
      qc.invalidateQueries({ queryKey: issueKeys.lists() })
    },
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
