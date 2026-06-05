import { StatusCodes } from 'http-status-codes'
import ApiError from '../../utils/ApiError.js'
import { EMAIL_PURPOSE, EMAIL_TOKEN_EXPIRES_MINUTES } from '../../utils/constants.js'

// Khung HTML chung cho mọi email, nhận phần body bên trong
const baseLayout = (innerHtml) => `
  <div style="background:#f1f5f9;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <h1 style="margin:0 0 24px;text-align:center;color:#1e293b;font-size:22px;">TaskFlow</h1>
      ${innerHtml}
      <p style="margin:32px 0 0;text-align:center;color:#94a3b8;font-size:12px;">
        Email được gửi tự động từ TaskFlow, vui lòng không trả lời email này.
      </p>
    </div>
  </div>
`

// Mỗi template trả về { subject, html } từ data truyền vào
const templates = {
  // 1. Email chào mừng
  [EMAIL_PURPOSE.WELCOME]: ({ name } = {}) => ({
    subject: 'Chào mừng bạn đến với TaskFlow 🎉',
    html: baseLayout(`
      <p style="color:#334155;font-size:15px;line-height:1.6;">
        Xin chào <strong>${name || 'bạn'}</strong>,
      </p>
      <p style="color:#334155;font-size:15px;line-height:1.6;">
        Cảm ơn bạn đã tham gia <strong>TaskFlow</strong>. Tài khoản của bạn đã sẵn sàng,
        bạn có thể bắt đầu tạo project, sprint và quản lý công việc ngay bây giờ.
      </p>
    `),
  }),

  // 2. Email gửi mã xác thực Gmail
  [EMAIL_PURPOSE.VERIFY_EMAIL]: ({
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
  }),

  // 3. Email gửi link đổi mật khẩu
  [EMAIL_PURPOSE.RESET_PASSWORD]: ({
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
  }),
}

// Render template theo key + data. Throw nếu template không tồn tại.
const render = (template, data = {}) => {
  const builder = templates[template]

  if (!builder) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Email template không hợp lệ: ${template}`,
    )
  }

  return builder(data)
}

export const emailTemplateService = {
  render,
}
