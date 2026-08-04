import api from '@/lib/api'
import type { ApiResponse } from '@/lib/http'
import type {
  AcceptDraftsResponse,
  AddDraftPayload,
  AiDraftIssue,
  AiGeneration,
  AiGenerationDetail,
  CreateGenerationPayload,
  CreateGenerationResponse,
  EditDraftPayload,
} from './ai.types'

// Lớp gọi API cho AI Lab. Mọi endpoint nested dưới project: /projects/:projectId/ai/...
// Backend luôn trả { message, data } -> ta bóc lấy `data` trả về cho hook dùng.
export const aiApi = {
  /** POST /projects/:projectId/ai/generations — trả 202 ngay, xử lý AI ở nền. */
  createGeneration: async (
    projectId: string,
    payload: CreateGenerationPayload,
  ): Promise<CreateGenerationResponse> => {
    const res = await api.post<ApiResponse<CreateGenerationResponse>>(
      `/projects/${projectId}/ai/generations`,
      payload,
    )
    return res.data.data
  },

  /** GET /projects/:projectId/ai/generations — lịch sử các lượt sinh của project. */
  getGenerations: async (projectId: string): Promise<AiGeneration[]> => {
    const res = await api.get<ApiResponse<AiGeneration[]>>(
      `/projects/${projectId}/ai/generations`,
    )
    return res.data.data
  },

  /** GET /projects/:projectId/ai/generations/:genId — chi tiết + drafts, dùng để poll. */
  getGeneration: async (projectId: string, generationId: string): Promise<AiGenerationDetail> => {
    const res = await api.get<ApiResponse<AiGenerationDetail>>(
      `/projects/${projectId}/ai/generations/${generationId}`,
    )
    return res.data.data
  },

  /** POST .../generations/:genId/drafts — PM tự thêm 1 draft tay (origin=MANUAL). */
  addDraft: async (
    projectId: string,
    generationId: string,
    payload: AddDraftPayload,
  ): Promise<AiDraftIssue> => {
    const res = await api.post<ApiResponse<AiDraftIssue>>(
      `/projects/${projectId}/ai/generations/${generationId}/drafts`,
      payload,
    )
    return res.data.data
  },

  /** PATCH .../ai/drafts/:draftId — sửa title/description/priority (chỉ khi SUGGESTED). */
  editDraft: async (
    projectId: string,
    draftId: string,
    payload: EditDraftPayload,
  ): Promise<AiDraftIssue> => {
    const res = await api.patch<ApiResponse<AiDraftIssue>>(
      `/projects/${projectId}/ai/drafts/${draftId}`,
      payload,
    )
    return res.data.data
  },

  /** DELETE .../ai/drafts/:draftId — xoá 1 draft chưa được chấp nhận. */
  deleteDraft: async (projectId: string, draftId: string): Promise<AiDraftIssue> => {
    const res = await api.delete<ApiResponse<AiDraftIssue>>(
      `/projects/${projectId}/ai/drafts/${draftId}`,
    )
    return res.data.data
  },

  /** POST .../generations/:genId/accept — tạo issue THẬT từ các draft đã chọn (tempIds). */
  acceptDrafts: async (
    projectId: string,
    generationId: string,
    tempIds: string[],
  ): Promise<AcceptDraftsResponse> => {
    const res = await api.post<ApiResponse<AcceptDraftsResponse>>(
      `/projects/${projectId}/ai/generations/${generationId}/accept`,
      { tempIds },
    )
    return res.data.data
  },

  /** POST .../generations/:genId/reject — từ chối các draft đã chọn (ids của AiDraftIssue). */
  rejectDrafts: async (
    projectId: string,
    generationId: string,
    ids: string[],
  ): Promise<{ rejected: string[] }> => {
    const res = await api.post<ApiResponse<{ rejected: string[] }>>(
      `/projects/${projectId}/ai/generations/${generationId}/reject`,
      { ids },
    )
    return res.data.data
  },
}
