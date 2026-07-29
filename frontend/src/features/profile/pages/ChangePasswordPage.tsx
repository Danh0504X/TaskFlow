import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getApiErrorMessage } from '@/lib/http';
import { changePasswordSchema, type ChangePasswordFormValues } from '@/features/auth/auth.schema';
import { useChangePassword } from '@/features/auth/hooks/useAuthMutations';
import { useAuthStore } from '@/features/auth/authStore';
import Modal, { type ModalTone } from '@/components/ui/Modal'; // Import component Modal

export function ChangePasswordPage() {
  const navigate = useNavigate();
  // Lấy thông tin user và hàm cập nhật user từ store
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const changePasswordMutation = useChangePassword();

  // State quản lý Modal thông báo
  const [modalConfig, setModalConfig] = useState<{ open: boolean; tone: ModalTone; title: string; message: string; isSuccess: boolean }>({
    open: false, tone: 'brand', title: '', message: '', isSuccess: false
  });

  const hasPassword = user?.hasPassword ?? false;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = (data: ChangePasswordFormValues) => {
    const payload = {
      currentPassword: data.currentPassword || '',
      newPassword: data.newPassword,
    };

    changePasswordMutation.mutate(payload, {
      onSuccess: () => {
        // 1. Cập nhật trạng thái hasPassword thành true trong Store
        if (user && setUser) {
          setUser({ ...user, hasPassword: true });
        }
        
        // 2. Hiển thị Modal thành công
        setModalConfig({
          open: true,
          tone: 'success',
          title: 'Thành công',
          message: hasPassword ? 'Đổi mật khẩu thành công!' : 'Thiết lập mật khẩu thành công!',
          isSuccess: true
        });
      },
      onError: (error: unknown) => {
        // Hiển thị Modal thất bại với message từ backend
        setModalConfig({
          open: true,
          tone: 'danger',
          title: 'Lỗi thiết lập',
          message: getApiErrorMessage(error, 'Có lỗi xảy ra, vui lòng kiểm tra lại mật khẩu hiện tại.'),
          isSuccess: false
        });
      }
    });
  };

  // Hàm xử lý khi người dùng đóng Modal
  const handleCloseModal = () => {
    setModalConfig(prev => ({ ...prev, open: false }));
    // Nếu là modal thành công, đóng modal xong thì điều hướng về trang Profile
    if (modalConfig.isSuccess) {
      reset();
      navigate('/profile');
    }
  };

  if (!user) return <div className="p-8 text-center text-[#464554] text-sm mt-10">Đang tải dữ liệu trang...</div>;

  return (
    <div className="p-6 lg:p-8 max-w-[640px] mx-auto w-full h-full overflow-y-auto">
      <header className="mb-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[#464554] text-sm mb-1.5">
          <button type="button" onClick={() => navigate('/profile')} className="hover:text-[#4648d4] transition-colors">
            Hồ sơ của tôi
          </button>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-[#121c2a] font-medium">{hasPassword ? 'Đổi mật khẩu' : 'Thiết lập mật khẩu'}</span>
        </nav>
        <h2 className="text-2xl font-bold text-[#121c2a] tracking-tight">
          {hasPassword ? 'Đổi mật khẩu' : 'Thiết lập mật khẩu'}
        </h2>
      </header>

      <section className="bg-white rounded-2xl p-6 shadow-sm border border-[#c7c4d7]/30">
        <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          
          {hasPassword && (
            <div>
              <label className="block text-xs font-bold text-[#464554] mb-1.5 uppercase tracking-wide">
                Mật khẩu hiện tại
              </label>
              <input
                className="w-full px-3.5 py-2.5 bg-[#f8f9ff] rounded-lg border border-[#c7c4d7] focus:border-[#4648d4] outline-none text-sm"
                placeholder="••••••••"
                type="password"
                {...register('currentPassword')}
              />
              {errors.currentPassword && <p className="text-xs text-red-600 mt-1">{errors.currentPassword.message}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#464554] mb-1.5 uppercase tracking-wide">Mật khẩu mới</label>
              <input
                className="w-full px-3.5 py-2.5 bg-[#f8f9ff] rounded-lg border border-[#c7c4d7] focus:border-[#4648d4] outline-none text-sm"
                placeholder="••••••••"
                type="password"
                {...register('newPassword')}
              />
              {errors.newPassword && <p className="text-xs text-red-600 mt-1">{errors.newPassword.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-[#464554] mb-1.5 uppercase tracking-wide">Xác nhận mật khẩu</label>
              <input
                className="w-full px-3.5 py-2.5 bg-[#f8f9ff] rounded-lg border border-[#c7c4d7] focus:border-[#4648d4] outline-none text-sm"
                placeholder="••••••••"
                type="password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <div className="pt-5 mt-2 border-t border-[#c7c4d7]/30 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-4 py-2 rounded-lg text-sm text-[#121c2a] font-semibold hover:bg-[#e6eeff] transition-colors outline-none"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="px-4 py-2 bg-[#4648d4] hover:bg-[#6063ee] text-white text-sm rounded-lg font-semibold transition-colors outline-none disabled:opacity-50"
            >
              {changePasswordMutation.isPending ? 'Đang xử lý...' : (hasPassword ? 'Cập nhật mật khẩu' : 'Lưu mật khẩu mới')}
            </button>
          </div>
        </form>
      </section>

      {/* Tích hợp Modal */}
      <Modal open={modalConfig.open} onClose={handleCloseModal} title={modalConfig.title} tone={modalConfig.tone} layout="compact"
        footer={<button onClick={handleCloseModal} className="px-4 py-2 bg-[#4648d4] text-white rounded-lg text-sm font-semibold hover:bg-[#6063ee] transition-colors">Đóng</button>}
      >
        <p className="text-sm text-[#464554] leading-relaxed">{modalConfig.message}</p>
      </Modal>

    </div>
  );
}