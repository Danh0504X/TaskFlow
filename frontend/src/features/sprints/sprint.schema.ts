import { z } from 'zod'

// Schema validate form tạo sprint (SprintFormModal, mode create). Chặn startDate trong
// quá khứ — chỉ áp dụng lúc TẠO MỚI, không hồi tố kiểm tra lại khi sửa sprint đã tồn tại.
export const createSprintFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Tên sprint là bắt buộc').max(100, 'Tên sprint tối đa 100 ký tự'),
    goal: z.string().trim().max(1000, 'Mục tiêu tối đa 1000 ký tự').optional(),
    startDate: z
      .string()
      .min(1, 'Ngày bắt đầu là bắt buộc')
      .refine((val) => {
        const date = new Date(val)
        date.setHours(0, 0, 0, 0)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return date.getTime() >= today.getTime()
      }, 'Ngày bắt đầu không được là ngày trong quá khứ'),
    endDate: z.string().min(1, 'Ngày kết thúc là bắt buộc'),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
    path: ['endDate'],
  })

// Schema sửa sprint đã tồn tại — không kiểm tra lại startDate quá khứ (dữ liệu cũ hợp lệ).
export const editSprintFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Tên sprint là bắt buộc').max(100, 'Tên sprint tối đa 100 ký tự'),
    goal: z.string().trim().max(1000, 'Mục tiêu tối đa 1000 ký tự').optional(),
    startDate: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
    endDate: z.string().min(1, 'Ngày kết thúc là bắt buộc'),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
    path: ['endDate'],
  })

export type SprintFormValues = z.infer<typeof editSprintFormSchema>
