import api from '@/lib/api'
import type { ApiResponse } from '@/lib/http'
import type {
  AcceptDraftsResponse,
  AddDraftPayload,
  AiDraftIssue,
  AiGeneration,
  AiGenerationDetail,
  AiQuota,
  ClarifyRequirementPayload,
  ClarifyRequirementResponse,
  CreateGenerationPayload,
  CreateGenerationResponse,
  EditDraftPayload,
  EpicTaskDrafts,
} from './ai.types'

// Lớp gọi API cho AI Lab. Đa số endpoint nested dưới project: /projects/:projectId/ai/...,
// riêng getMyQuota gọi /me/ai-quota (hạn mức tính theo USER, không theo project — xem
// backend/src/middlewares/checkAiLimit.js). Backend luôn trả { message, data } -> ta bóc lấy
// `data` trả về cho hook dùng.
export const aiApi = {
  /** GET /me/ai-quota — số lượt sinh AI user hiện tại đã dùng hôm nay / hạn mức (widget "Hạn
   * mức AI" ở trang Hồ sơ). PRO còn hạn -> isPro=true, used luôn là 0 (không giới hạn). */
  getMyQuota: async (): Promise<AiQuota> => {
    const res = await api.get<ApiResponse<AiQuota>>('/me/ai-quota')
    return res.data.data
  },

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

  /** POST /projects/:projectId/ai/clarify — AI hỏi làm rõ TRƯỚC khi tạo lượt REQ_TO_EPIC thật,
   * xử lý đồng bộ (200 ngay, không phải 202 nền như createGeneration). */
  clarify: async (
    projectId: string,
    payload: ClarifyRequirementPayload,
  ): Promise<ClarifyRequirementResponse> => {
    const res = await api.post<ApiResponse<ClarifyRequirementResponse>>(
      `/projects/${projectId}/ai/clarify`,
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

  /** DELETE .../ai/epics/:epicId/task-drafts — "Xoá tất cả & sinh lại từ đầu": xoá HẲN mọi task
   * nháp chưa duyệt của 1 epic THẬT (không phải từ chối) — task đã duyệt (đã là issue thật)
   * không bị ảnh hưởng. */
  clearEpicTaskDrafts: async (projectId: string, epicId: string): Promise<{ deletedCount: number }> => {
    const res = await api.delete<ApiResponse<{ deletedCount: number }>>(
      `/projects/${projectId}/ai/epics/${epicId}/task-drafts`,
    )
    return res.data.data
  },

  /** GET .../ai/epics/:epicId/task-drafts — task nháp hiện có của 1 epic thật, gọi ngay khi mở
   * modal "Sinh Task bằng AI" để hiện thẳng bố cục quản lý draft, không cần màn hình chờ riêng. */
  getEpicTaskDrafts: async (projectId: string, epicId: string): Promise<EpicTaskDrafts> => {
    const res = await api.get<ApiResponse<EpicTaskDrafts>>(
      `/projects/${projectId}/ai/epics/${epicId}/task-drafts`,
    )
    return res.data.data
  },
}
