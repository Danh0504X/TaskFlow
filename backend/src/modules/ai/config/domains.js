// Beta/Demo — AI Lab. Checklist miền dùng làm SÀN (không phải TRẦN) khi AI sinh Epic từ
// requirement: prompt bắt AI đối chiếu từng miền dưới đây, nhưng vẫn được thêm miền đặc thù
// khác nếu trích được câu cụ thể trong requirement (ghi vào sourceQuote của draft).
// Thêm 1 miền mới = thêm 1 dòng ở đây, không phải sửa if-else ở nơi khác.
export const AI_DOMAINS = [
  { key: 'auth', label: 'Xác thực & phiên', hint: 'đăng nhập, đăng ký, quên mật khẩu, refresh token, đăng xuất' },
  { key: 'rbac', label: 'Phân quyền', hint: 'vai trò, quyền theo tài nguyên, chặn thao tác trái phép' },
  { key: 'core_crud', label: 'Nghiệp vụ cốt lõi (CRUD)', hint: 'tạo, sửa, xoá, xem thực thể chính của hệ thống' },
  { key: 'notify', label: 'Thông báo', hint: 'email, thông báo trong ứng dụng, nhắc việc' },
  { key: 'search', label: 'Tìm kiếm & lọc', hint: 'tìm kiếm, lọc, sắp xếp, phân trang' },
  { key: 'report', label: 'Báo cáo/thống kê', hint: 'dashboard, biểu đồ, xuất số liệu tổng hợp' },
  { key: 'io', label: 'Nhập-xuất dữ liệu', hint: 'nhập xuất CSV, Excel, PDF' },
  { key: 'audit', label: 'Logging & audit', hint: 'lịch sử thao tác, nhật ký hệ thống' },
  { key: 'testing', label: 'Kiểm thử', hint: 'unit test, integration test, test case' },
  { key: 'ops', label: 'Vận hành', hint: 'triển khai, sao lưu, giám sát, cấu hình môi trường' },
]

export const AI_DOMAIN_KEYS = AI_DOMAINS.map((d) => d.key)
