import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/components/ui/toast/toastStore'
import { getApiErrorMessage } from '@/lib/http'
import { projectApi } from '../project.api'
import { projectKeys } from '../project.keys'
import type { CreateProjectPayload, InviteMemberInput, UpdateProjectPayload } from '../project.types'

/**
 * Mỗi mutation sau khi thành công sẽ:
 * 1. invalidate cache list -> bảng tự refetch & cập nhật.
 * 2. hiện toast báo kết quả.
 * Lỗi được bắt tập trung -> hiện toast lỗi, không để component tự xử lý.
 */

export const useCreateProject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => projectApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.lists() })
      toast.success('Tạo project thành công')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export const useUpdateProject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateProjectPayload
    }) => projectApi.update(id, payload),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: projectKeys.lists() })
      qc.invalidateQueries({ queryKey: projectKeys.detail(updated._id) })
      toast.success('Cập nhật project thành công')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export const useInviteMembers = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      invites,
    }: {
      projectId: string
      invites: InviteMemberInput[]
    }) => projectApi.inviteMembers(projectId, invites),
    onSuccess: (result, { projectId }) => {
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      if (result.added.length > 0) {
        toast.success(`Đã mời ${result.added.length} thành viên vào project`)
      }
      result.skipped.forEach((item) => toast.error(`${item.email}: ${item.reason}`))
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export const useDeleteProject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.lists() })
      qc.invalidateQueries({ queryKey: ['archived-projects'] })
      toast.success('Đã xoá project')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export const useLeaveProject = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (projectId: string) => projectApi.leave(projectId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: projectKeys.lists() })
      toast.success(data.message || 'Rời dự án thành công')
      navigate('/projects')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export const useAcceptInvitation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, token }: { projectId: string; token: string }) =>
      projectApi.acceptInvitation(projectId, token),
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: projectKeys.lists() })
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      toast.success('Chấp nhận lời mời tham gia dự án thành công')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export const useDeclineInvitation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, token }: { projectId: string; token: string }) =>
      projectApi.declineInvitation(projectId, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.lists() })
      toast.success('Đã từ chối lời mời tham gia dự án')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export const useRestoreProject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: projectApi.restore,
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: projectKeys.lists() })
      qc.invalidateQueries({ queryKey: ['archived-projects'] })
      toast.success(`Đã khôi phục dự án "${project.name}" thành công.`)
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}

export const usePermanentDeleteProject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: projectApi.deletePermanently,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.lists() })
      qc.invalidateQueries({ queryKey: ['archived-projects'] })
      toast.success('Đã xóa vĩnh viễn dự án thành công.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
}


