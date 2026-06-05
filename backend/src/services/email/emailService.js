import nodemailer from 'nodemailer'
import { StatusCodes } from 'http-status-codes'
import { env } from '../../config/environment.js'
import ApiError from '../../utils/ApiError.js'
import { emailTemplateService } from './emailTemplateService.js'

// Tạo transporter 1 lần (lazy) rồi tái sử dụng
let transporter = null

const getTransporter = () => {
  if (!transporter) {
    const port = Number(env.EMAIL_PORT) || 587
    transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port,
      secure: port === 465, // 465 = SSL, 587 = STARTTLS
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    })
  }
  return transporter
}

// Gửi email cấp thấp dùng chung
const sendEmail = async ({ to, subject, html }) => {
  try {
    await getTransporter().sendMail({
      from: env.EMAIL_FROM || env.EMAIL_USER,
      to,
      subject,
      html,
    })
  } catch (error) {
    // Không log nội dung (có thể chứa mã/token), chỉ log lý do kỹ thuật
    console.error('🔥 Email send failed:', error.message)
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Không thể gửi email, vui lòng thử lại sau.',
    )
  }
}

// Gửi email theo template + data
const sendEmailByTemplate = async ({ to, template, data }) => {
  const { subject, html } = emailTemplateService.render(template, data)
  await sendEmail({ to, subject, html })
}

export const emailService = {
  sendEmail,
  sendEmailByTemplate,
}
