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
  .min(8, 'Password must be at least 8 characters long')

// Họ tên: chỉ cho phép chữ cái (kể cả có dấu) và khoảng trắng — không số, không ký tự đặc biệt.
// \p{L} = mọi chữ cái Unicode (khớp cả tiếng Việt có dấu), cần flag "u".
export const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Full name must be at least 2 characters')
  .max(100, 'Full name must be at most 100 characters')
  .regex(/^[\p{L}\s]+$/u, 'Full name can only contain letters and spaces')

// page/limit dùng chung cho mọi query phân trang. z.coerce vì query string luôn là string.
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// Escape ký tự đặc biệt của regex trước khi đưa giá trị người dùng nhập vào $regex,
// tránh lỗi cú pháp regex và rủi ro ReDoS từ input tuỳ ý.
export const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
