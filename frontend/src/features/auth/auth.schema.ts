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
