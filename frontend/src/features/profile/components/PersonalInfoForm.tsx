import { useEffect, useState, type FormEvent } from 'react';
import { useAuthStore } from '@/features/auth/authStore';
import { useUpdateProfile } from '@/features/auth/hooks/useAuthMutations';

export function PersonalInfoForm() {
  const user = useAuthStore((state) => state.user);
  const updateProfileMutation = useUpdateProfile();
  const [fullName, setFullName] = useState(user?.fullName ?? '');

  // Đồng bộ lại input khi userInfo trong store đổi (vd sau khi lưu thành công).
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
    updateProfileMutation.mutate({ fullName: trimmedName });
  };

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm border border-[#c7c4d7]/30">
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
    </section>
  );
}
