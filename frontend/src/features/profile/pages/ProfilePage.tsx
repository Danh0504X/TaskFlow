import { AvatarCard } from '../components/AvatarCard';
import { AiQuotaCard } from '../components/AiQuotaCard';
import { PersonalInfoForm } from '../components/PersonalInfoForm';
import { SecuritySettings } from '../components/SecuritySettings';

export function ProfilePage() {
  return (
    <div className="p-8 lg:p-12 max-w-[1600px] mx-auto w-full h-full overflow-y-auto">
      
      {/* Header & Breadcrumbs */}
      <header className="mb-10">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-[#464554] text-sm mb-2"
        >
          <a href="#" className="hover:text-[#4648d4] transition-colors">
            TaskFlow
          </a>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-[#121c2a] font-medium">Cài đặt hồ sơ</span>
        </nav>
        <h2 className="text-3xl font-bold text-[#121c2a] tracking-tight">
          Hồ sơ của tôi
        </h2>
      </header>

      {/* Khung Grid chính chia 2 cột */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10">
        
        {/* Cột trái (4 phần) */}
        <div className="lg:col-span-4 space-y-8">
          <AvatarCard />
          <AiQuotaCard />
        </div>

        {/* Cột phải (8 phần) */}
        <div className="lg:col-span-8 space-y-8">
          <PersonalInfoForm />
          <SecuritySettings />
        </div>

      </div>
    </div>
  );
}