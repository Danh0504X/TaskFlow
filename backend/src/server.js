import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { env } from './config/enviroment.js'
import { corsOptions } from './config/cors.js'
import { connectDB } from './lib/db.js'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware.js'
import apiRoutes from './routes/api.js'

const START_SERVER = () => {
  const app = express()

  // Core middlewares
  app.use(cors(corsOptions))
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())

  // Routes
  app.use('/api', apiRoutes)

  // Error handling middleware (phải đặt sau cùng, sau tất cả routes)
  app.use(errorHandlingMiddleware)

  app.listen(env.PORT, () => {
    console.log(`🚀 Server is running on port ${env.PORT} [${env.BUILD_MODE}]`)
  })
}

// Kết nối database trước, kết nối thành công mới khởi động server
;(async () => {
  try {
    await connectDB()
    START_SERVER()
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
})()
