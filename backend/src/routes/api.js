import express from 'express'
import authRoute from './authRoute.js'
import projectRoute from './projectRoute.js'
import emailRoute from './emailRoute.js'

const router = express.Router()

// Health check / API root
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API!' })
})

// Feature routers
router.use('/auth', authRoute)
router.use('/projects', projectRoute)
router.use('/email', emailRoute)

export default router
