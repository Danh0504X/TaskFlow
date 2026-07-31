import { z } from 'zod'
import { ISSUE_PRIORITY } from '@/features/issues/issue.types'
import { AI_DRAFT_TYPE } from './ai.types'

// Schema validate form "Sinh Epic từ yêu cầu" — chặn rỗng/quá ngắn ở FE trước khi gọi BE
// (BE cũng tự kiểm lại, xem aiGeneration.service.js#createGeneration).
export const generateFromRequirementSchema = z.object({
  inputPrompt: z
    .string()
    .trim()
    .min(20, 'Mô tả yêu cầu tối thiểu 20 ký tự để AI có đủ ngữ cảnh')
    .max(5000, 'Yêu cầu tối đa 5000 ký tự'),
})
export type GenerateFromRequirementValues = z.infer<typeof generateFromRequirementSchema>

// Schema validate form "Sinh Task từ Epic".
export const generateFromEpicSchema = z.object({
  sourceEntityId: z.string().min(1, 'Vui lòng chọn 1 epic'),
})
export type GenerateFromEpicValues = z.infer<typeof generateFromEpicSchema>

const priorityEnum = z.enum([
  ISSUE_PRIORITY.LOW,
  ISSUE_PRIORITY.MEDIUM,
  ISSUE_PRIORITY.HIGH,
  ISSUE_PRIORITY.URGENT,
])

// Sửa draft tại màn duyệt (DraftEditModal) — khớp ràng buộc editDraft ở BE.
export const draftEditSchema = z.object({
  title: z.string().trim().min(1, 'Tiêu đề là bắt buộc').max(200, 'Tiêu đề tối đa 200 ký tự'),
  description: z.string().trim().max(5000, 'Mô tả tối đa 5000 ký tự').optional(),
  priority: priorityEnum,
})
export type DraftEditValues = z.infer<typeof draftEditSchema>

// PM tự thêm 1 draft tay (AddDraftModal).
export const addDraftSchema = z.object({
  title: z.string().trim().min(1, 'Tiêu đề là bắt buộc').max(200, 'Tiêu đề tối đa 200 ký tự'),
  description: z.string().trim().max(5000, 'Mô tả tối đa 5000 ký tự').optional(),
  type: z.enum([AI_DRAFT_TYPE.EPIC, AI_DRAFT_TYPE.TASK]),
  priority: priorityEnum,
  // Chỉ dùng khi type=TASK — gắn vào 1 epic (AI hoặc tay) đã có trong cùng mẻ.
  parentTempId: z.string().optional(),
})
export type AddDraftValues = z.infer<typeof addDraftSchema>
