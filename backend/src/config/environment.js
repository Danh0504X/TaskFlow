import dotenv from 'dotenv'

dotenv.config()

export const env = {
  BUILD_MODE: process.env.BUILD_MODE || 'dev',
  PORT: process.env.PORT || 5001,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MONGODB_CONNECTION_STRING: process.env.MONGODB_CONNECTION_STRING,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || '15m',
  REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL || '14d',
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: process.env.EMAIL_PORT || 587,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  EMAIL_TOKEN_SECRET: process.env.EMAIL_TOKEN_SECRET,
  // Dùng để build link reset password; fallback về CLIENT_URL nếu chưa khai báo riêng
  FRONTEND_URL:
    process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,

  // SePay Configurations
  SEPAY_BANK_ACC: process.env.SEPAY_BANK_ACC || '0906555367',
  SEPAY_BANK_NAME: process.env.SEPAY_BANK_NAME || 'MBBank',
  SEPAY_API_KEY: process.env.SEPAY_API_KEY || '',
  SEPAY_PRO_PRICE: Number(process.env.SEPAY_PRO_PRICE) || 2000,
}
