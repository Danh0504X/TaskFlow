import { Layers, Kanban, Sparkles, ChevronRight, Check } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { staggerContainer, fadeUpItem } from '@/lib/motion'
import type { ProjectMethodology } from '../../project.types'

interface SelectProjectTypeProps {
  selectedType: ProjectMethodology
  onSelect: (type: ProjectMethodology) => void
}

// Mỗi phương pháp luận gắn 1 pastel riêng — khớp với ProjectMethodologyBadge dùng trong
// danh sách dự án, để "Scrum = vàng, Kanban = xanh dương" nhất quán xuyên suốt app.
const options: { type: ProjectMethodology; icon: typeof Layers; title: string; desc: string; cta: string; tint: string; ink: string }[] = [
  { type: 'SCRUM', icon: Layers, title: 'Scrum lặp ngắn', desc: 'Quản lý qua các Sprint, ước lượng story point và theo dõi tiến độ định kỳ.', cta: 'Chọn Scrum', tint: 'bg-pastel-yellow', ink: 'text-pastel-yellow-ink' },
  { type: 'KANBAN', icon: Kanban, title: 'Kanban trực quan', desc: 'Quản lý công việc liên tục bằng bảng Kanban kéo thả, giới hạn WIP để tăng hiệu suất.', cta: 'Chọn Kanban', tint: 'bg-pastel-blue', ink: 'text-pastel-blue-ink' },
]

const SelectProjectType = ({ selectedType, onSelect }: SelectProjectTypeProps) => {
  return (
    <div className="space-y-6 max-w-2xl mx-auto text-center">
      <div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-pastel-blue text-pastel-blue-ink rounded-full text-[10px] font-semibold uppercase tracking-wider mb-3">
          <Sparkles size={12} />
          <span>Lựa chọn tối ưu</span>
        </span>
        <h2 className="font-editorial text-2xl font-medium text-ink tracking-tight">Chọn phương pháp quản trị dự án</h2>
        <p className="text-muted mt-2 text-xs leading-relaxed max-w-lg mx-auto">
          Chọn quy trình làm việc phù hợp với đội ngũ của bạn.
        </p>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        {options.map(({ type, icon: Icon, title, desc, cta, tint, ink }) => {
          const isSelected = selectedType === type
          return (
            <motion.div
              key={type}
              variants={fadeUpItem}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.2 }}
              onClick={() => onSelect(type)}
              className={cn(
                'relative bg-surface border rounded-xl p-6 text-left cursor-pointer transition-colors flex flex-col justify-between min-h-[210px]',
                isSelected ? 'border-ink' : 'border-hairline hover:border-ink/25',
              )}
            >
              <motion.div
                initial={false}
                animate={{ scale: isSelected ? 1 : 0, opacity: isSelected ? 1 : 0 }}
                transition={{ duration: 0.25, ease: 'backOut' }}
                className="absolute top-4 right-4 w-6 h-6 rounded-full bg-ink text-canvas flex items-center justify-center"
              >
                <Check size={13} />
              </motion.div>

              <div>
                <div className={cn('w-11 h-11 rounded-lg flex items-center justify-center mb-5', tint, ink)}>
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold text-sm text-ink mb-1.5">{title}</h3>
                <p className="text-[11px] text-muted leading-relaxed">{desc}</p>
              </div>
              <div className="flex items-center gap-1.5 text-ink text-[11px] font-semibold pt-4 mt-2 border-t border-hairline">
                <span>{cta}</span>
                <ChevronRight size={14} />
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}

export default SelectProjectType
