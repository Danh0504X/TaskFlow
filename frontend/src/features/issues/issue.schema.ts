import { z } from 'zod'
import { ISSUE_PRIORITY, ISSUE_STATUS, ISSUE_TYPE } from './issue.types'

// Schema validate form tạo/sửa issue. Quy tắc khớp với ràng buộc ở backend
// (models/issues.js + issueService.js): chỉ `title` bắt buộc, còn lại optional.
// `orderIndex` không nằm trong form — do hệ thống tự tính khi tạo/kéo-thả.
export const issueFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Tiêu đề là bắt buộc')
      .max(200, 'Tiêu đề tối đa 200 ký tự'),

    description: z
      .string()
      .trim()
      .max(5000, 'Mô tả tối đa 5000 ký tự')
      .optional(),

    type: z
      .enum([
        ISSUE_TYPE.EPIC,
        ISSUE_TYPE.TASK,
        ISSUE_TYPE.SUBTASK,
        ISSUE_TYPE.BUG,
      ])
      .optional(),

    status: z
      .enum([
        ISSUE_STATUS.TODO,
        ISSUE_STATUS.IN_PROGRESS,
        ISSUE_STATUS.IN_REVIEW,
        ISSUE_STATUS.DONE,
      ])
      .optional(),

    priority: z
      .enum([
        ISSUE_PRIORITY.LOW,
        ISSUE_PRIORITY.MEDIUM,
        ISSUE_PRIORITY.HIGH,
        ISSUE_PRIORITY.URGENT,
      ])
      .optional(),

    // sprintId bỏ trống = nằm trong Backlog (chưa gán sprint nào).
    // Chấp nhận cả '' (giá trị mặc định của <select>) lẫn undefined/null đều là "không chọn".
    sprintId: z.string().optional().nullable(),

    // parentIssueId: EPIC cha (khi type là TASK/BUG) hoặc TASK/BUG cha (khi type là SUBTASK).
    parentIssueId: z.string().optional().nullable(),

    assigneeId: z.string().optional().nullable(),
  })
  // Lưu ý: 2 rule dưới đây chỉ validate được ở client vì không cần tra cứu issue cha.
  // Việc "TASK/BUG chỉ được nhận EPIC làm cha, SUBTASK chỉ nhận TASK/BUG làm cha" cần biết
  // type của issue cha -> phải validate ở nơi có sẵn danh sách issue (component), hoặc ở backend.
  .refine((data) => data.type !== ISSUE_TYPE.EPIC || !data.parentIssueId, {
    message: 'Epic không thể có issue cha',
    path: ['parentIssueId'],
  })
  .refine((data) => data.type !== ISSUE_TYPE.SUBTASK || !!data.parentIssueId, {
    message: 'Subtask phải chọn 1 issue cha (Task/Bug)',
    path: ['parentIssueId'],
  })

export type IssueFormValues = z.infer<typeof issueFormSchema>
