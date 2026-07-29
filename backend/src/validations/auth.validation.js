import { z } from 'zod'
import { emailSchema, passwordSchema, fullNameSchema } from './common.validation.js'

// POST /auth/sign-up
export const signUpSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    inviteToken: z.string().optional(),
  })
  .strict()

// POST /auth/check-email
export const checkEmailSchema = z
  .object({
    email: emailSchema,
  })
  .strict()

// POST /auth/sign-in — không áp policy độ dài của passwordSchema (không phải lúc
// tạo mật khẩu), chỉ cần không rỗng + chặn payload quá dài trước khi query DB.
export const signInSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required').max(200),
  })
  .strict()

// POST /auth/google
export const googleSignInSchema = z
  .object({
    accessToken: z.string().min(1, 'Google access token is required'),
  })
  .strict()

// PATCH /auth/change-password
export const changePasswordSchema = z
  .object({
    // Bỏ .min(1) và thay bằng .optional() để hỗ trợ tài khoản chưa có mật khẩu
    currentPassword: z.string().optional(),
    
    // Mật khẩu mới vẫn giữ nguyên quy tắc bảo mật
    newPassword: passwordSchema,
  })
  .strict()

// PATCH /auth/me — tự cập nhật hồ sơ cá nhân. Chỉ cho sửa fullName (email cố định,
// avatar/role/status do backend hoặc admin quản lý).
export const updateProfileSchema = z
  .object({
    fullName: fullNameSchema,
  })
  .strict()

// POST /email/verify-email
export const verifyEmailSchema = z
  .object({
    email: emailSchema,
    code: z.string().trim().regex(/^\d{6}$/, 'Verification code must be 6 digits'),
    inviteToken: z.string().optional(),
  })
  .strict()

// POST /email/send-verify-code, POST /email/forgot-password — cùng shape { email }.
export const emailOnlySchema = z
  .object({
    email: emailSchema,
  })
  .strict()

export const sendVerifyCodeSchema = emailOnlySchema
export const forgotPasswordSchema = emailOnlySchema

// POST /email/reset-password
export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    token: z.string().trim().min(1, 'Token is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
