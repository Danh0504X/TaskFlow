import { Layers, Kanban } from 'lucide-react'
import { PROJECT_METHODOLOGY, type ProjectMethodology } from '../project.types'

// Mỗi phương pháp luận gắn 1 pastel riêng để phân biệt nhanh bằng mắt trong lưới project.
const config: Record<ProjectMethodology, { label: string; icon: typeof Layers; bg: string; text: string }> = {
  [PROJECT_METHODOLOGY.SCRUM]: { label: 'Scrum', icon: Layers, bg: 'bg-pastel-yellow', text: 'text-pastel-yellow-ink' },
  [PROJECT_METHODOLOGY.KANBAN]: { label: 'Kanban', icon: Kanban, bg: 'bg-pastel-blue', text: 'text-pastel-blue-ink' },
}

const ProjectMethodologyBadge = ({ methodology }: { methodology: ProjectMethodology }) => {
  // Dữ liệu cũ trước khi field methodology tồn tại có thể thiếu/không khớp enum -> fallback Kanban
  // thay vì crash cả trang khi destructure config[methodology] undefined.
  const { label, icon: Icon, bg, text } = config[methodology] ?? config[PROJECT_METHODOLOGY.KANBAN]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 ${bg} ${text} rounded-full text-[10px] font-bold uppercase tracking-wider`}>
      <Icon size={12} />
      <span>{label}</span>
    </span>
  )
}

export default ProjectMethodologyBadge
