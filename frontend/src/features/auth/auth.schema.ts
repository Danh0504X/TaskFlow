import { z } from 'zod'

// Họ tên: chỉ cho phép chữ cái (kể cả có dấu tiếng Việt) và khoảng trắng.
// \p{L} = mọi chữ cái Unicode, cần flag "u" — khớp quy tắc backend (common.validation.js).
const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Tên phải có ít nhất 2 ký tự.')
  .max(100, 'Tên tối đa 100 ký tự.')
  .regex(/^[\p{L}\s]+$/u, 'Tên chỉ được chứa chữ cái và khoảng trắng, không chứa số hoặc ký tự đặc biệt.')

// Policy mật khẩu mạnh thống nhất cho toàn bộ hệ thống (đăng ký, đặt lại mật khẩu, đổi/thiết lập mật khẩu).
export const strongPasswordSchema = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự.')

// Schema validate form đăng ký. Quy tắc khớp ràng buộc backend (/auth/sign-up).
export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    email: z.string().trim().email('Email không đúng định dạng.'),
    password: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmPassword'],
  })

// Kiểu giá trị form suy ra trực tiếp từ schema -> không khai báo 2 lần.
export type RegisterFormValues = z.infer<typeof registerSchema>

// Schema validate form đăng nhập. Không ràng buộc độ dài mật khẩu ở đây
// (server kiểm tra thông tin đăng nhập) -> chỉ cần không bỏ trống.
export const loginSchema = z.object({
  email: z.string().trim().email('Email không đúng định dạng.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

// Schema validate form quên mật khẩu.
export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Email không đúng định dạng.'),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

// Schema validate form đặt lại mật khẩu (Reset password).
export const resetPasswordSchema = z
  .object({
    newPassword: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmPassword'],
  })

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

// Schema validate form đổi / thiết lập mật khẩu khi đã đăng nhập (trang Profile & tài khoản Google).
export const changePasswordSchema = z
  .object({
    // Sử dụng .optional() thay vì .min(1) để form có thể submit khi ô này bị ẩn
    currentPassword: z.string().optional(),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmPassword'],
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>