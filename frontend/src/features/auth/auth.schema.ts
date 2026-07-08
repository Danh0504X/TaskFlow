import { z } from 'zod'

// Schema validate form đăng ký. Quy tắc khớp ràng buộc backend (/auth/sign-up).
export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Tên phải có ít nhất 2 ký tự.'),
    email: z.string().trim().email('Email không đúng định dạng.'),
    password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự.'),
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

// Schema validate form đặt lại mật khẩu. Độ dài tối thiểu 6 ký tự khớp
// ràng buộc backend (emailAccountService.resetPassword).
export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmPassword'],
  })

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
