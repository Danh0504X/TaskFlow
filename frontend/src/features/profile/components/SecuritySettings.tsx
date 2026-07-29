import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import { useForgotPassword } from '@/features/auth/hooks/useAuthMutations';
import Modal, { type ModalTone } from '@/components/ui/Modal';

// Sử dụng export default để tránh lỗi màn hình trắng (Fast Refresh Error)
export function SecuritySettings() {
  const navigate = useNavigate();
  // Lấy thông tin người dùng từ Zustand store
  const user = useAuthStore((state) => state.user);
  const forgotPasswordMutation = useForgotPassword();

  // Cấu hình trạng thái cho hộp thoại (Modal) thông báo
  const [modalConfig, setModalConfig] = useState<{ open: boolean; tone: ModalTone; title: string; message: string }>({
    open: false, tone: 'brand', title: '', message: ''
  });

  // Chống lỗi màn hình trắng: Nếu dữ liệu người dùng chưa tải xong, hiển thị dòng chữ chờ
  if (!user) return <div className="p-4 text-center text-sm text-[#464554]">Đang tải cài đặt bảo mật...</div>;

  const isGoogle = user.authProvider === 'google';
  
  // Lấy trạng thái đã có mật khẩu hay chưa, mặc định là false nếu không có dữ liệu
  const hasPassword = user.hasPassword ?? false;

  const closeModal = () => setModalConfig(prev => ({ ...prev, open: false }));

  // Hàm xử lý khi người dùng bấm Quên mật khẩu
  const handleForgotPassword = () => {
    forgotPasswordMutation.mutate({ email: user.email }, {
      onSuccess: (res) => {
        setModalConfig({ open: true, tone: 'success', title: 'Đã gửi email', message: res.message });
      },
      onError: () => {
        setModalConfig({ open: true, tone: 'danger', title: 'Lỗi', message: 'Không thể gửi email lúc này.' });
      }
    });
  };

  return (
    <section className="bg-surface rounded-2xl p-6 shadow-sm border border-[#c7c4d7]/30">
      <header className="flex items-center gap-2.5 mb-5">
        <span className="material-symbols-outlined text-[20px] text-[#4648d4]">security</span>
        <h3 className="text-base font-bold text-[#121c2a]">Bảo mật & Mật khẩu</h3>
      </header>

      <div className="space-y-4">
        {/* TRƯỜNG HỢP 1: Hiển thị thông tin liên kết Google */}
        {isGoogle && (
          <div className="p-4 bg-surface rounded-xl border border-[#c7c4d7]/40 flex flex-col gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#4285F4]/10 flex items-center justify-center shrink-0">
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-semibold text-sm text-[#121c2a]">Đã liên kết với Google</span>
                </div>
                {/* Thay đổi lời nhắc dựa trên việc người dùng đã có mật khẩu hay chưa */}
                <p className="text-[#464554] text-xs">
                  {hasPassword ? 'Tài khoản của bạn đăng nhập bằng Google.' : 'Bạn chưa thiết lập mật khẩu cho tài khoản này.'}
                </p>
              </div>
            </div>

            {/* Chỉ hiển thị nút Thiết lập mật khẩu mới khi CHƯA có mật khẩu */}
            {!hasPassword && (
              <button
                type="button"
                onClick={() => navigate('/profile/change-password')}
                className="px-4 py-2 bg-[#4648d4] hover:bg-[#6063ee] text-white text-sm rounded-lg font-semibold transition-colors flex items-center gap-2 w-fit outline-none"
              >
                <span className="material-symbols-outlined text-[18px]">lock</span>
                Thiết lập mật khẩu mới
              </button>
            )}
          </div>
        )}

        {/* TRƯỜNG HỢP 2: Khu vực đổi mật khẩu (Chỉ hiện khi ĐÃ CÓ mật khẩu) */}
        {hasPassword && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#f8f9ff] rounded-xl border border-[#c7c4d7]/40">
            <div>
              <p className="font-semibold text-sm text-[#121c2a] mb-0.5">Mật khẩu</p>
              <p className="text-[#464554] text-xs">Đổi mật khẩu đăng nhập TaskFlow của bạn.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={forgotPasswordMutation.isPending}
                className="px-3 py-2 text-[#4648d4] hover:bg-[#e6eeff] text-sm rounded-lg font-semibold transition-colors outline-none disabled:opacity-50"
              >
                {forgotPasswordMutation.isPending ? 'Đang gửi...' : 'Quên mật khẩu?'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/profile/change-password')}
                className="px-4 py-2 bg-[#4648d4] hover:bg-[#6063ee] text-white text-sm rounded-lg font-semibold transition-colors outline-none"
              >
                Đổi mật khẩu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hộp thoại thông báo kết quả gửi email quên mật khẩu */}
      <Modal open={modalConfig.open} onClose={closeModal} title={modalConfig.title} tone={modalConfig.tone} layout="compact"
        footer={<button onClick={closeModal} className="px-4 py-2 bg-canvas text-ink rounded-lg text-sm font-semibold hover:bg-hairline transition-colors">Đóng</button>}
      >
        <p className="text-sm text-[#464554] leading-relaxed">{modalConfig.message}</p>
      </Modal>
    </section>
  );
}