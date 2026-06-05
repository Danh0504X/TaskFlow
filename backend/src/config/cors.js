import { env } from './environment.js'

// Cấu hình CORS cơ bản cho dự án
export const corsOptions = {
  // Origin của frontend được phép gọi API (đặt qua biến môi trường CLIENT_URL)
  origin: env.CLIENT_URL,

  // Cho phép gửi kèm cookie / credentials trong request
  credentials: true,

  optionsSuccessStatus: 200,
}
