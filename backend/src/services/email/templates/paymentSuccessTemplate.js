import { baseLayout } from './baseLayout.js'

export const paymentSuccessTemplate = (data) => {
  const { fullName, paymentCode, planName, amount, paidAt, expiresAt } = data

  const content = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #4F46E5; margin-bottom: 16px;">Xác nhận Thanh toán Thành công 🎉</h2>
      <p>Xin chào <strong>${fullName || 'Bạn'}</strong>,</p>
      <p>Cảm ơn bạn đã nâng cấp gói dịch vụ tại TaskFlow! Giao dịch của bạn đã được ghi nhận thành công.</p>
      
      <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #111827; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px;">Thông tin giao dịch</h3>
        <p style="margin: 6px 0;"><strong>Mã đơn hàng:</strong> <span style="font-family: monospace; color: #4F46E5;">${paymentCode}</span></p>
        <p style="margin: 6px 0;"><strong>Gói dịch vụ:</strong> ${planName || 'Gói PRO (30 Ngày)'}</p>
        <p style="margin: 6px 0;"><strong>Số tiền:</strong> ${Number(amount).toLocaleString('vi-VN')} VNĐ</p>
        <p style="margin: 6px 0;"><strong>Thời gian thanh toán:</strong> ${paidAt}</p>
        <p style="margin: 6px 0;"><strong>Ngày hết hạn gói PRO:</strong> <strong style="color: #059669;">${expiresAt}</strong></p>
      </div>

      <p>Bây giờ bạn có thể trải nghiệm các tính năng AI không giới hạn và các công cụ nâng cao của TaskFlow.</p>
      <p style="color: #6B7280; font-size: 13px;">Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi.</p>
    </div>
  `

  return {
    subject: `[TaskFlow] Xác nhận thanh toán thành công đơn hàng #${paymentCode}`,
    html: baseLayout({ content }),
  }
}
