import express from 'express'
import authRoute from './authRoute.js'
import projectRoute from './projectRoute.js'
import emailRoute from './emailRoute.js'
import userRoute from './userRoute.js'
import meRoute from './meRoute.js'
import notificationRoute from './notificationRoute.js'
import aiRoute from '../modules/ai/routes/ai.routes.js'

const router = express.Router()

// Health check / API root
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API!' })
})

// Feature routers
router.use('/auth', authRoute)
router.use('/projects', projectRoute)
router.use('/email', emailRoute)
router.use('/admin/users', userRoute)
router.use('/me', meRoute)
router.use('/notifications', notificationRoute)
// Beta/Demo — AI Lab (modules/ai/**), additive-only: xem modules/ai/routes/ai.routes.js
router.use('/projects/:projectId/ai', aiRoute)

export default router
