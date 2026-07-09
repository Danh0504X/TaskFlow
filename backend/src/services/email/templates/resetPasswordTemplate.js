import { baseLayout } from './baseLayout.js'
import { EMAIL_TOKEN_EXPIRES_MINUTES } from '../../../utils/constants.js'

// Email gửi link đổi mật khẩu. Data: { resetUrl, expiresInMinutes }
export const resetPasswordTemplate = ({
  resetUrl,
  expiresInMinutes = EMAIL_TOKEN_EXPIRES_MINUTES,
} = {}) => ({
  subject: 'Yêu cầu đặt lại mật khẩu TaskFlow',
  html: baseLayout(`
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Bạn vừa yêu cầu đặt lại mật khẩu. Nhấn nút bên dưới để tiếp tục:
    </p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 28px;border-radius:10px;">
        Đặt lại mật khẩu
      </a>
    </p>
    <p style="color:#64748b;font-size:14px;line-height:1.6;text-align:center;">
      Liên kết chỉ có hiệu lực trong <strong>${expiresInMinutes} phút</strong>.
      Nếu bạn không yêu cầu, vui lòng bỏ qua email này.
    </p>
  `),
})
