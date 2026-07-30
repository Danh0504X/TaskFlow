// Kiểu dữ liệu cho tính năng AI Lab (Beta/Demo) — khớp với response thật từ
// backend/src/modules/ai/** (xem controllers/aiGeneration.controller.js).
// TS của dự án bật `erasableSyntaxOnly` -> KHÔNG dùng `enum`, dùng object `as const`.

import type { IssuePriority } from '@/features/issues/issue.types'

export const AI_GENERATION_TYPE = {
  REQ_TO_EPIC: 'REQ_TO_EPIC',
  EPIC_TO_TASK: 'EPIC_TO_TASK',
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
  scopePreview: string[]
  sourceQuote: string
  origin: AiDraftOrigin
  status: AiDraftStatus
  createdIssueId: string | null
}

/** 1 lượt sinh (PM bấm "Sinh Epic" từ requirement, hoặc "Sinh Task" từ 1 epic có sẵn). */
export interface AiGeneration {
  _id: string
  projectId: string
  generationType: AiGenerationType
  sourceEntityId: string | null
  status: AiGenerationStatus
  provider: string | null
  model: string | null
  tokensUsed: number
  errorMessage: string | null
  createdAt: string
}

/** GET /generations/:genId — chi tiết lượt sinh kèm toàn bộ draft, dùng để poll. */
export interface AiGenerationDetail extends AiGeneration {
  drafts: AiDraftIssue[]
}

// ----- Payload gửi lên -----

export interface CreateGenerationPayload {
  generationType: AiGenerationType
  /** Bắt buộc khi generationType = EPIC_TO_TASK (id của epic nguồn). */
  sourceEntityId?: string
  /** Bắt buộc khi generationType = REQ_TO_EPIC. */
  inputPrompt?: string
  /** Câu trả lời làm rõ dạng đóng (select/checkbox), đi kèm requirement — tuỳ chọn. */
  clarifications?: Record<string, unknown> | null
}

export interface CreateGenerationResponse {
  generationId: string
  status: AiGenerationStatus
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
