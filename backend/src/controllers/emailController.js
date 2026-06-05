import { StatusCodes } from 'http-status-codes'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { emailAccountService } from '../services/email/emailAccountService.js'


export const sendVerifyCode = asyncHandler(async (req, res) => {
  const result = await emailAccountService.sendVerifyCode(req.body)
  res.status(StatusCodes.OK).json(result)
})


export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await emailAccountService.verifyEmail(req.body)
  res.status(StatusCodes.OK).json(result)
})


export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await emailAccountService.forgotPassword(req.body)
  res.status(StatusCodes.OK).json(result)
})


export const resetPassword = asyncHandler(async (req, res) => {
  const result = await emailAccountService.resetPassword(req.body)
  res.status(StatusCodes.OK).json(result)
})


export const sendWelcome = asyncHandler(async (req, res) => {
  const result = await emailAccountService.sendWelcomeEmail({
    to: req.user.email,
    name: req.user.fullName,
  })
  res.status(StatusCodes.OK).json(result)
})
