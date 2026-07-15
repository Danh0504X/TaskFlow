// Khuôn HTML dùng chung cho mọi email (header + khung + footer).
// Mỗi template chỉ cần truyền phần nội dung bên trong (innerHtml).
export const baseLayout = (innerHtml) => `
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
