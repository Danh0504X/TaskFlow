// Kiểu dữ liệu cho tính năng AI Lab (Beta/Demo) — khớp với response thật từ
// backend/src/modules/ai/** (xem controllers/aiGeneration.controller.js).
// TS của dự án bật `erasableSyntaxOnly` -> KHÔNG dùng `enum`, dùng object `as const`.

import type { IssuePriority } from '@/features/issues/issue.types'

// CLARIFY chỉ để LỌC/HIỂN THỊ (1 lượt AI hỏi làm rõ cũng là 1 AiGeneration ở backend) — KHÔNG
// dùng làm generationType khi tạo lượt sinh từ FE, backend createGeneration không chấp nhận giá
// trị này (xem POST /projects/:id/ai/clarify — endpoint riêng, tự tạo generation phía server).
export const AI_GENERATION_TYPE = {
  REQ_TO_EPIC: 'REQ_TO_EPIC',
  EPIC_TO_TASK: 'EPIC_TO_TASK',
  CLARIFY: 'CLARIFY',
} as const
export type AiGenerationType = (typeof AI_GENERATION_TYPE)[keyof typeof AI_GENERATION_TYPE]

export const AI_GENERATION_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const
export type AiGenerationStatus = (typeof AI_GENERATION_STATUS)[keyof typeof AI_GENERATION_STATUS]

export const AI_DRAFT_TYPE = {
  EPIC: 'EPIC',
  TASK: 'TASK',
} as const
export type AiDraftType = (typeof AI_DRAFT_TYPE)[keyof typeof AI_DRAFT_TYPE]

export const AI_DRAFT_STATUS = {
  SUGGESTED: 'SUGGESTED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
} as const
export type AiDraftStatus = (typeof AI_DRAFT_STATUS)[keyof typeof AI_DRAFT_STATUS]

export const AI_DRAFT_ORIGIN = {
  AI: 'AI',
  MANUAL: 'MANUAL',
} as const
export type AiDraftOrigin = (typeof AI_DRAFT_ORIGIN)[keyof typeof AI_DRAFT_ORIGIN]

/** 1 draft (Epic/Task AI đề xuất, hoặc PM tự thêm tay) chờ duyệt — chưa phải issue thật. */
export interface AiDraftIssue {
  _id: string
  generationId: string
  tempId: string
  title: string
  description: string
  type: AiDraftType
  priority: IssuePriority
  parentTempId: string | null
  /** Cha là issue THẬT (khi draft này sinh từ 1 epic thật) — null nếu cha là draft khác (xem
   * parentTempId) hoặc chưa có cha. */
  parentIssueId: string | null
  scopePreview: string[]
  sourceQuote: string
  origin: AiDraftOrigin
  status: AiDraftStatus
  createdIssueId: string | null
}

/** Thực thể/tính năng AI trích ra từ requirement TRƯỚC khi gom epic (Stage A của REQ_TO_EPIC ở
 * backend, xem aiRunner.js) — chỉ để tham khảo/audit, không phải dữ liệu chỉnh sửa được. */
export interface ExtractedEntity {
  key: string
  name: string
  description: string
  sourceQuote: string
}

/** 1 câu hỏi AI sinh ra khi PM gọi POST /ai/clarify trước lúc tạo lượt REQ_TO_EPIC thật. */
export interface ClarifyingQuestion {
  key: string
  question: string
  options: string[]
}

/** 1 lượt sinh (PM bấm "Sinh Epic" từ requirement, hoặc "Sinh Task" từ 1 epic có sẵn — hoặc 1
 * lượt CLARIFY hỏi làm rõ, xem AI_GENERATION_TYPE.CLARIFY). */
export interface AiGeneration {
  _id: string
  projectId: string
  generationType: AiGenerationType
  sourceEntityId: string | { _id: string; title: string } | null
  status: AiGenerationStatus
  /** Yêu cầu gốc PM nhập (rỗng với EPIC_TO_TASK — cha lúc đó là sourceEntityId, không phải văn bản). */
  inputPrompt: string
  provider: string | null
  model: string | null
  tokensUsed: number
  errorMessage: string | null
  extractedEntities: ExtractedEntity[]
  clarifyingQuestions: ClarifyingQuestion[]
  createdAt: string
}

/** GET /generations/:genId — chi tiết lượt sinh kèm toàn bộ draft, dùng để poll. */
export interface AiGenerationDetail extends AiGeneration {
  drafts: AiDraftIssue[]
}

/** GET /me/ai-quota — hạn mức sinh AI của user hiện tại, tính theo NGÀY (UTC), không theo
 * project (xem backend/src/middlewares/checkAiLimit.js). PRO còn hạn -> isPro=true, used luôn
 * là 0 (không giới hạn thật, chỉ để hiển thị "Vô hạn" ở FE thay vì 1 con số cụ thể). */
export interface AiQuota {
  used: number
  limit: number
  isPro: boolean
}

// ----- Payload gửi lên -----

export interface CreateGenerationPayload {
  generationType: AiGenerationType
  /** Epic nguồn khi generationType = EPIC_TO_TASK. Đúng 1 trong 2: sourceEntityId (epic đã là
   * issue thật) HOẶC sourceDraftId (epic còn là nháp, chưa duyệt) — không truyền cả hai. */
  sourceEntityId?: string
  /** Epic nháp nguồn (id của AiDraftIssue) — dùng cùng parentGenerationId khi sinh Task ngay
   * trong lúc epic còn ở trạng thái SUGGESTED (chưa duyệt), không phải đợi duyệt epic trước. */
  sourceDraftId?: string
  /** Id của phiên (generation gốc, parentGenerationId=null) đang chứa epic nháp — bắt buộc khi
   * có sourceDraftId, để task mới lồng đúng vào cây draft đang xem. */
  parentGenerationId?: string
  /** Bắt buộc khi generationType = REQ_TO_EPIC. */
  inputPrompt?: string
  /** Câu trả lời làm rõ dạng đóng (select/checkbox), đi kèm requirement — tuỳ chọn. */
  clarifications?: Record<string, unknown> | null
}

export interface CreateGenerationResponse {
  generationId: string
  status: AiGenerationStatus
}

export interface ClarifyRequirementPayload {
  inputPrompt: string
}

/** Response POST /ai/clarify — questions rỗng nghĩa là requirement đã đủ rõ, không cần hỏi thêm. */
export interface ClarifyRequirementResponse {
  generationId: string
  questions: ClarifyingQuestion[]
}

export interface AddDraftPayload {
  title: string
  description?: string
  type: AiDraftType
  priority?: IssuePriority
  parentTempId?: string | null
}

export interface EditDraftPayload {
  title?: string
  description?: string
  priority?: IssuePriority
}

export interface AcceptedIssue {
  draftId: string
  issueId: string
  type: AiDraftType
  title: string
  parentIssueId: string | null
}

export interface SkippedDraft {
  draftId: string
  tempId: string
  reason: 'REJECTED' | 'PARENT_NOT_ACCEPTED'
}

/** Response từ POST /generations/:genId/accept. */
export interface AcceptDraftsResponse {
  created: AcceptedIssue[]
  skipped: SkippedDraft[]
}
