import { z } from 'zod'
import { PROJECT_STATUS } from './project.types'

// Schema validate form sửa project (ProjectEditModal). Tạo project mới dùng
// trình hướng dẫn ở /projects/new (xem ProjectSetupWizard), không dùng schema này.
// Quy tắc khớp với ràng buộc ở backend (models/projects.js + projectService.js).
export const projectFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tên dự án là bắt buộc')
    .max(150, 'Tên dự án tối đa 150 ký tự'),

  key: z
    .string()
    .trim()
    .min(2, 'Mã dự án phải có ít nhất 2 ký tự')
    .max(10, 'Mã dự án tối đa 10 ký tự')
    .regex(/^[A-Z0-9]+$/, 'Mã dự án chỉ được chứa chữ in hoa và chữ số'),

  description: z
    .string()
    .trim()
    .max(2000, 'Mô tả tối đa 2000 ký tự')
    .optional(),

  // input type="date" trả chuỗi 'YYYY-MM-DD' hoặc '' (rỗng = không có deadline).
  deadline: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true
      const date = new Date(val)
      date.setHours(0, 0, 0, 0)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return date.getTime() >= today.getTime()
    }, 'Hạn chót không được là ngày trong quá khứ'),

  status: z.enum([
    PROJECT_STATUS.ACTIVE,
    PROJECT_STATUS.COMPLETED,
    PROJECT_STATUS.CANCELLED,
  ]),
})

// Kiểu giá trị form suy ra trực tiếp từ schema -> không phải khai báo 2 lần.
export type ProjectFormValues = z.infer<typeof projectFormSchema>

