import { baseLayout } from './baseLayout.js'

// Email thông báo được thêm vào project. Data: { inviterName, projectName, projectUrl }
export const projectInviteTemplate = ({ inviterName, projectName, projectUrl } = {}) => ({
  subject: `${inviterName || 'Một thành viên'} đã thêm bạn vào project "${projectName}"`,
  html: baseLayout(`
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Xin chào,
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      <strong>${inviterName || 'Một thành viên'}</strong> vừa thêm bạn vào project
      <strong>${projectName}</strong> trên TaskFlow.
    </p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${projectUrl}" style="background:#4f46e5;color:#ffffff;text-decoration:none;
        padding:12px 24px;border-radius:10px;font-weight:bold;font-size:14px;display:inline-block;">
        Xem project ngay
      </a>
    </p>
  `),
})
