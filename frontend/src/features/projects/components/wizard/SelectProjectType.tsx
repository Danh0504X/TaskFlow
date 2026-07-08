import { Layers, Kanban, Settings2, Sparkles, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

export type ProjectMethodology = 'SCRUM' | 'KANBAN' | 'CUSTOM'

interface SelectProjectTypeProps {
  selectedType: ProjectMethodology
  onSelect: (type: ProjectMethodology) => void
}

const options: { type: ProjectMethodology; icon: typeof Layers; title: string; desc: string; cta: string }[] = [
  { type: 'SCRUM', icon: Layers, title: 'Scrum lặp ngắn', desc: 'Quản lý qua các Sprint, ước lượng story point và theo dõi tiến độ định kỳ.', cta: 'Chọn Scrum' },
  { type: 'KANBAN', icon: Kanban, title: 'Kanban trực quan', desc: 'Quản lý công việc liên tục bằng bảng Kanban kéo thả, giới hạn WIP để tăng hiệu suất.', cta: 'Chọn Kanban' },
  { type: 'CUSTOM', icon: Settings2, title: 'Tùy biến cao', desc: 'Thích hợp cho quy trình đặc thù, tự thiết kế cấu trúc bảng và trạng thái.', cta: 'Tùy chỉnh ngay' },
]

const SelectProjectType = ({ selectedType, onSelect }: SelectProjectTypeProps) => {
  return (
    <div className="space-y-6 max-w-2xl mx-auto text-center">
      <div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/5 text-brand rounded-full text-[10px] font-bold uppercase tracking-wider mb-3">
          <Sparkles size={12} />
          <span>Lựa chọn tối ưu</span>
        </span>
        <h2 className="text-2xl font-extrabold text-brand tracking-tight">Chọn phương pháp quản trị dự án</h2>
        <p className="text-muted mt-2 text-xs font-semibold leading-relaxed max-w-lg mx-auto">
          Chọn quy trình làm việc phù hợp với đội ngũ của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
        {options.map(({ type, icon: Icon, title, desc, cta }) => (
          <div
            key={type}
            onClick={() => onSelect(type)}
            className={cn(
              'bg-white border-2 rounded-3xl p-6 text-left cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[220px]',
              selectedType === type ? 'border-brand shadow-lg shadow-brand/5 scale-[1.02]' : 'border-line/30 hover:border-brand/40',
            )}
          >
            <div>
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-5', selectedType === type ? 'bg-brand text-white' : 'bg-brand/5 text-brand')}>
                <Icon size={22} />
              </div>
              <h3 className="font-bold text-sm text-ink mb-1.5">{title}</h3>
              <p className="text-[11px] text-muted leading-relaxed font-semibold">{desc}</p>
            </div>
            <div className="flex items-center gap-1.5 text-brand text-[11px] font-bold pt-4 mt-2 border-t border-line/10">
              <span>{cta}</span>
              <ChevronRight size={14} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SelectProjectType
