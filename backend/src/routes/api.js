import express from 'express'
import authRoute from './authRoute.js'
import projectRoute from './projectRoute.js'
import emailRoute from './emailRoute.js'
import userRoute from './userRoute.js'
import meRoute from './meRoute.js'
<<<<<<< HEAD
import notificationRoute from './notificationRoute.js'
=======
import aiRoute from '../modules/ai/routes/ai.routes.js'
>>>>>>> feature/ai-design

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
<<<<<<< HEAD
router.use('/notifications', notificationRoute)
=======
// Beta/Demo — AI Lab (modules/ai/**), additive-only: xem modules/ai/routes/ai.routes.js
router.use('/projects/:projectId/ai', aiRoute)
>>>>>>> feature/ai-design

export default router
