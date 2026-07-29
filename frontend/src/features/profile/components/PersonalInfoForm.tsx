import { useEffect, useState, type FormEvent } from 'react';
import { useAuthStore } from '@/features/auth/authStore';
import { useUpdateProfile } from '@/features/auth/hooks/useAuthMutations';
// Import component Modal và kiểu dữ liệu ModalTone từ thư mục ui
import Modal, { type ModalTone } from '@/components/ui/Modal';

export function PersonalInfoForm() {
  const user = useAuthStore((state) => state.user);
  const updateProfileMutation = useUpdateProfile();
  const [fullName, setFullName] = useState(user?.fullName ?? '');

  // 1. Tạo state để quản lý cấu hình của Modal thông báo
  const [modalConfig, setModalConfig] = useState<{
    open: boolean;
    tone: ModalTone;
    title: string;
    message: string;
  }>({
    open: false,
    tone: 'brand',
    title: '',
    message: '',
  });

  // Hàm tiện ích để đóng Modal
  const closeModal = () => setModalConfig((prev) => ({ ...prev, open: false }));

  // Đồng bộ lại input khi userInfo trong store đổi
  useEffect(() => {
    setFullName(user?.fullName ?? '');
  }, [user?.fullName]);

  if (!user) return null;

  const trimmedName = fullName.trim();
  const isDirty = trimmedName !== '' && trimmedName !== user.fullName;

  const handleCancel = () => setFullName(user.fullName);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;

    // 2. Gọi hàm mutate và truyền cấu hình xử lý Thành công / Thất bại
    updateProfileMutation.mutate(
      { fullName: trimmedName },
      {
        onSuccess: () => {
          // Hiển thị Modal màu xanh ngọc (success) khi lưu thành công
          setModalConfig({
            open: true,
            tone: 'success',
            title: 'Cập nhật thành công',
            message: 'Thông tin cá nhân của bạn đã được lưu lại trên hệ thống.',
          });
        },
        onError: (error: any) => {
          // Hiển thị Modal màu đỏ (danger) khi có lỗi từ server
          // Lấy thông báo lỗi từ API, hoặc dùng câu thông báo mặc định
          const errorMessage = error?.response?.data?.message || error?.message || 'Họ và tên chỉ được chứa chữ cái và khoảng trắng.';
          
          setModalConfig({
            open: true,
            tone: 'danger',
            title: 'Lỗi cập nhật',
            message: errorMessage,
          });
        },
      }
    );
  };

  return (
    <section className="bg-surface rounded-2xl p-6 shadow-sm border border-[#c7c4d7]/30">
      <header className="flex items-center gap-2.5 mb-5">
        <span className="material-symbols-outlined text-[20px] text-[#4648d4]">badge</span>
        <h3 className="text-base font-bold text-[#121c2a]">
          Thông tin cá nhân
        </h3>
      </header>

      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
        <div className="col-span-2 group">
          <label className="block text-xs font-bold text-[#464554] mb-1.5 uppercase tracking-wide">
            Họ và tên
          </label>
          <input
            className="w-full px-3.5 py-2.5 bg-[#f8f9ff] rounded-lg border border-[#c7c4d7] focus:border-[#4648d4] focus:ring-4 focus:ring-[#4648d4]/10 outline-none transition-all text-sm text-[#121c2a]"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-bold text-[#464554] mb-1.5 uppercase tracking-wide">
            Email
          </label>
          <input
            className="w-full px-3.5 py-2.5 bg-[#eff4ff] rounded-lg border border-[#c7c4d7]/50 text-[#464554] text-sm cursor-not-allowed outline-none"
            readOnly
            type="email"
            value={user.email}
          />
        </div>

        <div className="col-span-2 mt-2 pt-5 border-t border-[#c7c4d7]/30 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={handleCancel}
            disabled={!isDirty || updateProfileMutation.isPending}
            className="px-4 py-2 rounded-lg text-sm text-[#121c2a] font-semibold hover:bg-[#e6eeff] transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-[#c7c4d7] outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={!isDirty || updateProfileMutation.isPending}
            className="px-4 py-2 bg-[#4648d4] text-white text-sm rounded-lg font-semibold hover:bg-[#6063ee] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>

      {/* 3. Khai báo component Modal ở cuối phần giao diện */}
      <Modal
        open={modalConfig.open}
        onClose={closeModal}
        title={modalConfig.title}
        tone={modalConfig.tone}
        layout="compact"
        footer={
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-canvas text-ink rounded-lg text-sm font-semibold hover:bg-hairline transition-colors"
          >
            Đóng
          </button>
        }
      >
        <p className="text-sm text-[#464554] leading-relaxed">
          {modalConfig.message}
        </p>
      </Modal>
    </section>
  );
}