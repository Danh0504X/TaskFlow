// Beta/Demo — AI Lab. Đọc trực tiếp process.env (dotenv đã được nạp bởi
// backend/src/config/environment.js lúc server khởi động) thay vì sửa file environment.js
// hiện có — module AI là additive-only, không đụng cấu hình chung của app.
export const aiEnv = {
  AI_PROVIDER: (process.env.AI_PROVIDER || 'stub').toLowerCase(),
  AI_MODEL: process.env.AI_MODEL || 'gemini-2.5-flash',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  AI_DAILY_LIMIT: Number(process.env.AI_DAILY_LIMIT) > 0 ? Number(process.env.AI_DAILY_LIMIT) : 5,
}
