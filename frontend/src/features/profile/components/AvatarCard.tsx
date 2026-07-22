import Avatar from '@/components/ui/Avatar';
import { useAuthStore } from '@/features/auth/authStore';

export function AvatarCard() {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  const roleLabel = user.role === 'admin' ? 'Quản trị viên' : 'Thành viên hệ thống';

  return (
    <section className="bg-white rounded-3xl p-8 flex flex-col items-center text-center shadow-sm border border-[#c7c4d7]/30">
      <div className="mb-6">
        <Avatar
          src={user.avatarUrl}
          name={user.fullName}
          size={128}
          className="ring-4 ring-[#e1e0ff]"
        />
      </div>
      <h3 className="text-xl font-bold text-[#121c2a] mb-1">
        {user.fullName}
      </h3>
      <p className="text-[#464554] text-base mb-5">
        {user.email}
      </p>
      <span className="px-4 py-1.5 bg-[#dee9fc] text-[#4648d4] rounded-full text-xs font-semibold tracking-wide">
        {roleLabel}
      </span>
    </section>
  );
}
