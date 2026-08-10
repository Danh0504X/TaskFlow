import { EMAIL_PURPOSE } from '../../../utils/constants.js'
import { welcomeTemplate } from './welcomeTemplate.js'
import { verifyEmailTemplate } from './verifyEmailTemplate.js'
import { resetPasswordTemplate } from './resetPasswordTemplate.js'
import { projectInviteTemplate } from './projectInviteTemplate.js'
import { paymentSuccessTemplate } from './paymentSuccessTemplate.js'

// Map mỗi purpose -> hàm dựng template { subject, html }.
// Thêm email mới: tạo 1 file template rồi khai báo thêm 1 dòng ở đây.
export const emailTemplates = {
  [EMAIL_PURPOSE.WELCOME]: welcomeTemplate,
  [EMAIL_PURPOSE.VERIFY_EMAIL]: verifyEmailTemplate,
  [EMAIL_PURPOSE.RESET_PASSWORD]: resetPasswordTemplate,
  [EMAIL_PURPOSE.PROJECT_INVITE]: projectInviteTemplate,
  [EMAIL_PURPOSE.PAYMENT_SUCCESS]: paymentSuccessTemplate,
}
