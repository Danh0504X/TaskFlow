import mongoose from 'mongoose'
import { z } from 'zod'
import { EMAIL_REGEX } from '../utils/constants.js'

// ObjectId hợp lệ (dùng cho params như :projectId, :issueId...).
export const objectIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: 'Invalid id format',
  })

// Email: giữ đúng EMAIL_REGEX đang dùng trong service để không đổi hành vi hiện tại.
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(EMAIL_REGEX, 'Invalid email format')

// Policy mật khẩu thống nhất cho toàn bộ luồng auth (signUp/changePassword/resetPassword).
export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters long')

// page/limit dùng chung cho mọi query phân trang. z.coerce vì query string luôn là string.
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// Escape ký tự đặc biệt của regex trước khi đưa giá trị người dùng nhập vào $regex,
// tránh lỗi cú pháp regex và rủi ro ReDoS từ input tuỳ ý.
export const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
