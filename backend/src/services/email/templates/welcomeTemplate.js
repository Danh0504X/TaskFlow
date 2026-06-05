import { baseLayout } from './baseLayout.js'

// Email chào mừng. Data: { name }
export const welcomeTemplate = ({ name } = {}) => ({
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
})
