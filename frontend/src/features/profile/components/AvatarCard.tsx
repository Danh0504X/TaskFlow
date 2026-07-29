import Avatar from '@/components/ui/Avatar';
import { useAuthStore } from '@/features/auth/authStore';

export function AvatarCard() {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  const roleLabel = user.role === 'admin' ? 'Quản trị viên' : 'Thành viên hệ thống';

  return (
    <section className="bg-surface rounded-2xl p-6 flex flex-col items-center text-center shadow-sm border border-[#c7c4d7]/30">
      <div className="mb-4">
        <Avatar
          src={user.avatarUrl}
          name={user.fullName}
          size={88}
          className="ring-4 ring-[#e1e0ff]"
        />
      </div>
      <h3 className="text-base font-bold text-[#121c2a] mb-0.5">
        {user.fullName}
      </h3>
      <p className="text-[#464554] text-sm mb-3">
        {user.email}
      </p>
      <span className="px-3 py-1 bg-[#dee9fc] text-[#4648d4] rounded-full text-[11px] font-semibold tracking-wide">
        {roleLabel}
      </span>
    </section>
  );
}
