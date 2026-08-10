import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { env } from './config/environment.js'
import { corsOptions } from './config/cors.js'
import { connectDB } from './lib/db.js'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware.js'
import apiRoutes from './routes/api.js'

import { initDueReminderJob } from './services/dueReminderJob.js'

const START_SERVER = () => {
  const app = express()

  // Core middlewares
  app.use(cors(corsOptions))
  app.use(express.json({ limit: '100kb' }))
  app.use(express.urlencoded({ extended: true, limit: '100kb' }))
  app.use(cookieParser())

  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  // Routes
  app.use('/api', apiRoutes)

  // Error handling middleware (phải đặt sau cùng, sau tất cả routes)
  app.use(errorHandlingMiddleware)

  app.listen(env.PORT, () => {
    console.log(`🚀 Server is running on port ${env.PORT} [${env.BUILD_MODE}]`)
    // Khởi động job quét nhắc deadline định kỳ
    initDueReminderJob()
  })
}

  // Kết nối database trước, kết nối thành công mới khởi động server
  ; (async () => {
    try {
      await connectDB()
      START_SERVER()
    } catch (error) {
      console.error('❌ Failed to start server:', error)
      process.exit(1)
    }
  })()
