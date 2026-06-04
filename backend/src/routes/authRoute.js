import express from 'express'
import {
  signUp,
  signIn,
  googleSignIn,
  signOut,
  refreshToken,
} from '../controllers/authController.js'

const router = express.Router()

router.post('/sign-up', signUp)

router.post('/sign-in', signIn)

router.post('/google', googleSignIn)

router.post('/refresh-token', refreshToken)

router.post('/sign-out', signOut)

export default router
