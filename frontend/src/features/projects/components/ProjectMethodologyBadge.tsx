import { Layers, Kanban } from 'lucide-react'
import { PROJECT_METHODOLOGY, type ProjectMethodology } from '../project.types'

const config: Record<ProjectMethodology, { label: string; icon: typeof Layers }> = {
  [PROJECT_METHODOLOGY.SCRUM]: { label: 'Scrum', icon: Layers },
  [PROJECT_METHODOLOGY.KANBAN]: { label: 'Kanban', icon: Kanban },
}

const ProjectMethodologyBadge = ({ methodology }: { methodology: ProjectMethodology }) => {
  const { label, icon: Icon } = config[methodology]
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-brand/5 text-brand border border-brand/10 rounded-full text-[10px] font-bold uppercase tracking-wider">
      <Icon size={12} />
      <span>{label}</span>
    </span>
  )
}

export default ProjectMethodologyBadge
