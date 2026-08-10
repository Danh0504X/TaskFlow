import api from '@/lib/api'
import type { ApiResponse } from '@/lib/http'
import type {
  CommentItem,
  CreateCommentPayload,
  UpdateCommentPayload,
} from './comment.types'

export const commentApi = {
  getByIssue: async (projectId: string, issueId: string): Promise<CommentItem[]> => {
    const res = await api.get<ApiResponse<CommentItem[]>>(
      `/projects/${projectId}/issues/${issueId}/comments`,
    )
    return res.data.data
  },

  create: async (
    projectId: string,
    issueId: string,
    payload: CreateCommentPayload,
  ): Promise<CommentItem> => {
    const res = await api.post<ApiResponse<CommentItem>>(
      `/projects/${projectId}/issues/${issueId}/comments`,
      payload,
    )
    return res.data.data
  },

  update: async (
    projectId: string,
    issueId: string,
    commentId: string,
    payload: UpdateCommentPayload,
  ): Promise<CommentItem> => {
    const res = await api.put<ApiResponse<CommentItem>>(
      `/projects/${projectId}/issues/${issueId}/comments/${commentId}`,
      payload,
    )
    return res.data.data
  },

  remove: async (
    projectId: string,
    issueId: string,
    commentId: string,
  ): Promise<{ _id: string; message: string }> => {
    const res = await api.delete<ApiResponse<{ _id: string; message: string }>>(
      `/projects/${projectId}/issues/${issueId}/comments/${commentId}`,
    )
    return res.data.data
  },
}
