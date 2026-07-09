import { baseLayout } from './baseLayout.js'
import { EMAIL_TOKEN_EXPIRES_MINUTES } from '../../../utils/constants.js'

// Email gửi mã xác thực. Data: { code, expiresInMinutes }
export const verifyEmailTemplate = ({
  code,
  expiresInMinutes = EMAIL_TOKEN_EXPIRES_MINUTES,
} = {}) => ({
  subject: 'Mã xác thực email TaskFlow',
  html: baseLayout(`
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Sử dụng mã bên dưới để xác thực địa chỉ email của bạn:
    </p>
    <p style="text-align:center;margin:24px 0;">
      <span style="display:inline-block;font-size:32px;letter-spacing:8px;font-weight:bold;color:#4f46e5;background:#eef2ff;padding:12px 24px;border-radius:12px;">
        ${code}
      </span>
    </p>
    <p style="color:#64748b;font-size:14px;line-height:1.6;text-align:center;">
      Mã chỉ có hiệu lực trong <strong>${expiresInMinutes} phút</strong>.
      Nếu bạn không yêu cầu, vui lòng bỏ qua email này.
    </p>
  `),
})
