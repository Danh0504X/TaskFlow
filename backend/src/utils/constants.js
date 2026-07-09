// Regex kiểm tra định dạng email hợp lệ (vd: user@gmail.com)
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// Vai trò của tài khoản. USER là mặc định khi đăng ký, ADMIN cấp thủ công.
export const USER_ROLE = {
  ADMIN: 'admin',
  USER: 'user',
}

// Mục đích của email/token. VERIFY_EMAIL & RESET_PASSWORD khớp enum trong
// model EmailToken/EmailRateLimit; WELCOME chỉ là template gửi trực tiếp
// (không lưu token, không qua rate limit).
export const EMAIL_PURPOSE = {
  VERIFY_EMAIL: 'VERIFY_EMAIL',
  RESET_PASSWORD: 'RESET_PASSWORD',
  WELCOME: 'WELCOME',
}

// Token/mã xác thực chỉ có hiệu lực trong 10 phút
export const EMAIL_TOKEN_EXPIRES_MINUTES = 10

// Rate limit gửi email theo cặp email + purpose
export const EMAIL_RATE_LIMIT = {
  MAX_ATTEMPTS: 5,
  WINDOW_MS: 30 * 60 * 1000, // 30 phút
  BLOCK_MS: 60 * 60 * 1000, // 1 tiếng
}
