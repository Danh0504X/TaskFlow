import { z } from 'zod'
import { PROJECT_STATUS } from './project.types'

// Schema validate form project (dùng chung cho cả Thêm và Sửa).
// Quy tắc khớp với ràng buộc ở backend (models/projects.js + projectService.js).
export const projectFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tên project là bắt buộc')
    .max(150, 'Tên project tối đa 150 ký tự'),

  description: z
    .string()
    .trim()
    .max(2000, 'Mô tả tối đa 2000 ký tự')
    .optional(),

  // input type="date" trả chuỗ 'YYYY-MM-DD' hoặc '' (rỗng = không có deadline).
  deadline: z.string().optional(),

  status: z.enum([
    PROJECT_STATUS.ACTIVE,
    PROJECT_STATUS.COMPLETED,
    PROJECT_STATUS.CANCELLED,
  ]),
})

// Kiểu giá trị form suy ra trực tiếp từ schema -> không phải khai báo 2 lần.
export type ProjectFormValues = z.infer<typeof projectFormSchema>
