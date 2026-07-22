import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/features/auth/auth.schema';
import { useChangePassword } from '@/features/auth/hooks/useAuthMutations';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const changePasswordMutation = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = (data: ChangePasswordFormValues) => {
    changePasswordMutation.mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          reset();
          navigate('/profile');
        },
      },
    );
  };

  return (
    <div className="p-8 lg:p-12 max-w-[760px] mx-auto w-full h-full overflow-y-auto">
      <header className="mb-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[#464554] text-sm mb-2">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="hover:text-[#4648d4] transition-colors"
          >
            Hồ sơ của tôi
          </button>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-[#121c2a] font-medium">Đổi mật khẩu</span>
        </nav>
        <h2 className="text-3xl font-bold text-[#121c2a] tracking-tight">
          Đổi mật khẩu
        </h2>
      </header>

      <section className="bg-white rounded-3xl p-8 shadow-sm border border-[#c7c4d7]/30">
        <form className="grid grid-cols-1 gap-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label className="block text-xs font-bold text-[#464554] mb-2 uppercase tracking-wide">
              Mật khẩu hiện tại
            </label>
            <input
              className="w-full px-4 py-3 bg-[#f8f9ff] rounded-xl border border-[#c7c4d7] focus:border-[#4648d4] focus:ring-4 focus:ring-[#4648d4]/10 outline-none transition-all text-base text-[#121c2a]"
              placeholder="••••••••"
              type="password"
              {...register('currentPassword')}
            />
            {errors.currentPassword && (
              <p className="text-xs text-red-600 mt-1.5">{errors.currentPassword.message}</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-[#464554] mb-2 uppercase tracking-wide">
                Mật khẩu mới
              </label>
              <input
                className="w-full px-4 py-3 bg-[#f8f9ff] rounded-xl border border-[#c7c4d7] focus:border-[#4648d4] focus:ring-4 focus:ring-[#4648d4]/10 outline-none transition-all text-base text-[#121c2a]"
                placeholder="••••••••"
                type="password"
                {...register('newPassword')}
              />
              {errors.newPassword && (
                <p className="text-xs text-red-600 mt-1.5">{errors.newPassword.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-[#464554] mb-2 uppercase tracking-wide">
                Xác nhận mật khẩu
              </label>
              <input
                className="w-full px-4 py-3 bg-[#f8f9ff] rounded-xl border border-[#c7c4d7] focus:border-[#4648d4] focus:ring-4 focus:ring-[#4648d4]/10 outline-none transition-all text-base text-[#121c2a]"
                placeholder="••••••••"
                type="password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 mt-1.5">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-[#c7c4d7]/30 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-6 py-2.5 rounded-xl text-[#121c2a] font-semibold hover:bg-[#e6eeff] transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-[#c7c4d7] outline-none"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="px-6 py-2.5 bg-[#4648d4] hover:bg-[#6063ee] text-white rounded-xl font-semibold transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-[#4648d4] outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {changePasswordMutation.isPending ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
