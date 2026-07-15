import { env } from './environment.js'

const ALLOWED_ORIGINS = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174'
]

// Cấu hình CORS cơ bản cho dự án
export const corsOptions = {
  // Origin của frontend được phép gọi API (đặt qua biến môi trường CLIENT_URL)
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'))
  },

  // Cho phép gửi kèm cookie / credentials trong request
  credentials: true,

  optionsSuccessStatus: 200,
}
