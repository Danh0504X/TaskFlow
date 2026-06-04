import express from 'express'
import authRoute from './authRoute.js'

const router = express.Router()

// Health check / API root
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API!' })
})

// Feature routers
router.use('/auth', authRoute)

export default router
