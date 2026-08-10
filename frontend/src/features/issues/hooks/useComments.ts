import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast/toastStore'
import { getApiErrorMessage } from '@/lib/http'
import { commentApi } from '../comment.api'
import { commentKeys } from '../comment.keys'
import type { CreateCommentPayload, UpdateCommentPayload } from '../comment.types'

export const useIssueComments = (
  projectId: string | undefined,
  issueId: string | undefined,
) => {
  return useQuery({
    queryKey: commentKeys.list(projectId ?? '', issueId ?? ''),
    queryFn: () => commentApi.getByIssue(projectId as string, issueId as string),
    enabled: !!projectId && !!issueId,
  })
}

export const useCreateComment = (projectId: string, issueId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCommentPayload) =>
      commentApi.create(projectId, issueId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentKeys.list(projectId, issueId) })
      toast.success('Thêm bình luận thành công')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export const useUpdateComment = (projectId: string, issueId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      commentId,
      payload,
    }: {
      commentId: string
      payload: UpdateCommentPayload
    }) => commentApi.update(projectId, issueId, commentId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentKeys.list(projectId, issueId) })
      toast.success('Cập nhật bình luận thành công')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export const useDeleteComment = (projectId: string, issueId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) =>
      commentApi.remove(projectId, issueId, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentKeys.list(projectId, issueId) })
      toast.success('Đã xoá bình luận')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}
